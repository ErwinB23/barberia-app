import assert from 'node:assert/strict';
import test from 'node:test';

import * as invitationDomain from './invitation-domain.ts';

test('expone únicamente roles, canales y estados soportados por la base', () => {
  assert.deepEqual(invitationDomain.INVITATION_ROLES, ['barber', 'administrator']);
  assert.deepEqual(invitationDomain.INVITATION_CHANNELS, ['app', 'email']);
  assert.deepEqual(invitationDomain.INVITATION_STATUSES, [
    'pending',
    'accepted',
    'rejected',
    'expired',
    'cancelled',
  ]);
});

test('mapea roles, canales y estados a etiquetas claras', () => {
  assert.equal(invitationDomain.getInvitationRoleLabel('barber'), 'Barbero');
  assert.equal(invitationDomain.getInvitationRoleLabel('administrator'), 'Administrador');
  assert.equal(invitationDomain.getInvitationChannelLabel('app'), 'En la app');
  assert.equal(invitationDomain.getInvitationChannelLabel('email'), 'Por email');
  assert.equal(invitationDomain.getInvitationStatusLabel('accepted'), 'Aceptada');
  assert.equal(invitationDomain.getInvitationStatusLabel('cancelled'), 'Cancelada');
});

test('normaliza un formulario válido y rechaza email, rol o canal desconocidos', () => {
  assert.deepEqual(
    invitationDomain.parseInvitationForm({
      email: '  USER@Example.COM ',
      role: 'barber',
      channel: 'app',
    }),
    {
      values: { email: 'user@example.com', role: 'barber', channel: 'app' },
      errors: {},
    },
  );

  const invalid = invitationDomain.parseInvitationForm({
    email: 'correo-invalido',
    role: 'client',
    channel: 'sms',
  });
  assert.equal(invalid.values, null);
  assert.deepEqual(invalid.errors, {
    email: 'Ingresa un correo electrónico válido.',
    role: 'Selecciona un rol válido.',
    channel: 'Selecciona un canal válido.',
  });
});

test('presenta como expirada una invitación pending cuya fecha ya pasó', () => {
  const now = new Date('2026-08-12T12:00:00.000Z');

  assert.equal(
    invitationDomain.getEffectiveInvitationStatus('pending', '2026-08-12T11:59:59.000Z', now),
    'expired',
  );
  assert.equal(
    invitationDomain.getEffectiveInvitationStatus('pending', '2026-08-12T12:00:01.000Z', now),
    'pending',
  );
  assert.equal(
    invitationDomain.getEffectiveInvitationStatus('accepted', '2026-08-12T11:59:59.000Z', now),
    'accepted',
  );
});

test('habilita acciones solo para invitaciones pendientes y vigentes', () => {
  const now = new Date('2026-08-12T12:00:00.000Z');
  const future = '2026-08-13T12:00:00.000Z';
  const past = '2026-08-11T12:00:00.000Z';

  assert.deepEqual(invitationDomain.getInvitationActions('pending', future, 'recipient', now), {
    canAccept: true,
    canReject: true,
    canCancel: false,
  });
  assert.deepEqual(invitationDomain.getInvitationActions('pending', future, 'administrator', now), {
    canAccept: false,
    canReject: false,
    canCancel: true,
  });
  assert.deepEqual(invitationDomain.getInvitationActions('pending', past, 'recipient', now), {
    canAccept: false,
    canReject: false,
    canCancel: false,
  });
  assert.deepEqual(invitationDomain.getInvitationActions('rejected', future, 'recipient', now), {
    canAccept: false,
    canReject: false,
    canCancel: false,
  });
});
