import assert from 'node:assert/strict';
import test from 'node:test';

import {
  completeAuthCallback,
  getAuthCallbackDestination,
  parseAuthCallbackUrl,
} from './auth-callback.ts';

test('reconoce un callback implícito de recuperación sin exponer parámetros ajenos', () => {
  const callback = parseAuthCallbackUrl(
    'barberiaapp://auth/callback#access_token=access&refresh_token=refresh&type=recovery',
  );

  assert.deepEqual(callback, {
    kind: 'tokens',
    accessToken: 'access',
    refreshToken: 'refresh',
    intent: 'password-recovery',
  });
  assert.equal(getAuthCallbackDestination(callback.intent), './reset-password');
});

test('reconoce confirmación de email y código PKCE para completar el acceso', () => {
  const confirmation = parseAuthCallbackUrl(
    'https://app.example.com/auth/callback#access_token=access&refresh_token=refresh&type=signup',
  );
  const pkce = parseAuthCallbackUrl(
    'https://app.example.com/auth/callback?code=verification-code&type=signup',
  );

  assert.equal(confirmation.kind, 'tokens');
  assert.equal(confirmation.intent, 'complete-sign-in');
  assert.deepEqual(pkce, {
    kind: 'code',
    code: 'verification-code',
    intent: 'complete-sign-in',
  });
  assert.equal(getAuthCallbackDestination(confirmation.intent), '/');
});

test('rechaza callbacks incompletos y conserva solo el código seguro del error', () => {
  assert.deepEqual(parseAuthCallbackUrl('barberiaapp://auth/callback'), { kind: 'invalid' });
  assert.deepEqual(
    parseAuthCallbackUrl(
      'barberiaapp://auth/callback#error=access_denied&error_code=otp_expired&error_description=detalle-interno',
    ),
    { kind: 'error', errorCode: 'otp_expired' },
  );
});

test('completa el callback con las APIs oficiales sin persistir tokens manualmente', async () => {
  const calls = [];
  const intent = await completeAuthCallback(
    'barberiaapp://auth/callback#access_token=access&refresh_token=refresh&type=recovery',
    {
      exchangeCodeForSession: async (code) => calls.push(['code', code]),
      setSession: async (session) => calls.push(['session', session]),
    },
  );

  assert.equal(intent, 'password-recovery');
  assert.deepEqual(calls, [['session', { accessToken: 'access', refreshToken: 'refresh' }]]);
});

test('intercambia un callback PKCE y rechaza enlaces inválidos', async () => {
  const calls = [];
  const handlers = {
    exchangeCodeForSession: async (code) => calls.push(code),
    setSession: async () => undefined,
  };

  assert.equal(
    await completeAuthCallback('https://app.example.com/auth/callback?code=pkce-code', handlers),
    'complete-sign-in',
  );
  assert.deepEqual(calls, ['pkce-code']);
  await assert.rejects(
    completeAuthCallback('barberiaapp://auth/callback', handlers),
    /invalid_auth_callback/,
  );
});
