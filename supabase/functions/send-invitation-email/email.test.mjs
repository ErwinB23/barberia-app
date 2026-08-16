import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildInvitationEmail,
  getInvitationEmailEligibility,
  parseInvitationEmailRequest,
  sendInvitationEmailWithResend,
} from './email.ts';

const INVITATION_ID = '0d7af2f2-1e73-46a9-a29a-bb927eedfd92';

test('accepts only a minimal invitation_id request', () => {
  assert.deepEqual(parseInvitationEmailRequest({ invitation_id: INVITATION_ID }), {
    invitationId: INVITATION_ID,
  });

  for (const invalid of [
    null,
    {},
    { invitation_id: 'not-a-uuid' },
    { invitation_id: INVITATION_ID, email: 'attacker@example.com' },
    { invitation_id: INVITATION_ID, role: 'administrator' },
  ]) {
    assert.throws(() => parseInvitationEmailRequest(invalid), /invitation_id/);
  }
});

test('allows only pending, unexpired email invitations', () => {
  const now = Date.parse('2026-08-15T12:00:00Z');

  assert.equal(
    getInvitationEmailEligibility(
      { channel: 'email', status: 'pending', expiresAt: '2026-08-16T12:00:00Z' },
      now,
    ),
    'ready',
  );
  assert.equal(
    getInvitationEmailEligibility(
      { channel: 'app', status: 'pending', expiresAt: '2026-08-16T12:00:00Z' },
      now,
    ),
    'wrong_channel',
  );
  assert.equal(
    getInvitationEmailEligibility(
      { channel: 'email', status: 'accepted', expiresAt: '2026-08-16T12:00:00Z' },
      now,
    ),
    'not_pending',
  );
  assert.equal(
    getInvitationEmailEligibility(
      { channel: 'email', status: 'pending', expiresAt: '2026-08-15T12:00:00Z' },
      now,
    ),
    'expired',
  );
});

test('builds safe, readable content for supported invitation roles', () => {
  const content = buildInvitationEmail({
    barbershopName: 'Barbería <Central>',
    role: 'administrator',
  });

  assert.match(content.subject, /Barbería <Central>/);
  assert.match(content.text, /Administrador/);
  assert.match(content.text, /Invitaciones/);
  assert.match(content.html, /Barbería &lt;Central&gt;/);
  assert.doesNotMatch(content.html, /Barbería <Central>/);
  assert.match(content.html, /max-width/);
  assert.doesNotMatch(`${content.html}${content.text}`, /https?:\/\//);

  assert.match(
    buildInvitationEmail({ barbershopName: 'Barbería Norte', role: 'barber' }).text,
    /Barbero/,
  );
  assert.throws(
    () => buildInvitationEmail({ barbershopName: 'Barbería Norte', role: 'client' }),
    /rol/i,
  );
});

test('sends through Resend without leaking the API key into the payload', async () => {
  let capturedUrl = '';
  let capturedInit;
  const apiKey = 'test-secret-that-must-not-leak';
  const content = buildInvitationEmail({ barbershopName: 'Barbería Norte', role: 'barber' });

  await sendInvitationEmailWithResend({
    apiKey,
    fromEmail: 'Barbería App <invitations@example.com>',
    recipientEmail: 'barber@example.com',
    invitationId: INVITATION_ID,
    content,
    fetcher: async (url, init) => {
      capturedUrl = String(url);
      capturedInit = init;
      return new Response(JSON.stringify({ id: 'email-id' }), { status: 200 });
    },
  });

  assert.equal(capturedUrl, 'https://api.resend.com/emails');
  assert.equal(capturedInit.method, 'POST');
  assert.equal(capturedInit.headers.Authorization, `Bearer ${apiKey}`);
  assert.equal(capturedInit.headers['Idempotency-Key'], `barbershop-invitation/${INVITATION_ID}`);

  const payload = JSON.parse(capturedInit.body);
  assert.deepEqual(payload.to, ['barber@example.com']);
  assert.equal(payload.from, 'Barbería App <invitations@example.com>');
  assert.equal(JSON.stringify(payload).includes(apiKey), false);
});

test('maps a Resend failure to a safe delivery error', async () => {
  const content = buildInvitationEmail({ barbershopName: 'Barbería Norte', role: 'barber' });

  await assert.rejects(
    sendInvitationEmailWithResend({
      apiKey: 'test-secret',
      fromEmail: 'invitations@example.com',
      recipientEmail: 'barber@example.com',
      invitationId: INVITATION_ID,
      content,
      fetcher: async () =>
        new Response(JSON.stringify({ message: 'provider internal details' }), { status: 503 }),
    }),
    (error) => {
      assert.equal(error.code, 'resend_delivery_failed');
      assert.doesNotMatch(error.message, /provider internal details|test-secret/);
      return true;
    },
  );
});
