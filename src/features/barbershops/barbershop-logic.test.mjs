import assert from 'node:assert/strict';
import test from 'node:test';

import { getBarbershopErrorMessage } from './errors.ts';
import {
  normalizeBarbershopForm,
  normalizeYapeSettingsForm,
  parseBarbershopSettingsForm,
  isValidUuid,
  validateBarbershopForm,
  validateYapeSettingsForm,
} from './validation.ts';
import { getBarbershopStatusLabel, getMembershipRoleLabel, mapMembershipRows } from './mappers.ts';

test('acepta solo identificadores UUID válidos en rutas dinámicas', () => {
  assert.equal(isValidUuid('550e8400-e29b-41d4-a716-446655440000'), true);
  assert.equal(isValidUuid('../otra-ruta'), false);
  assert.equal(isValidUuid(''), false);
});

test('traduce errores de base de datos sin exponer detalles internos', () => {
  assert.equal(
    getBarbershopErrorMessage({ code: '42501' }),
    'No tienes permiso para realizar esta acción.',
  );
  assert.equal(
    getBarbershopErrorMessage({ code: 'P0002' }),
    'La barbería solicitada no está disponible.',
  );
  assert.equal(
    getBarbershopErrorMessage(new Error('private database detail')),
    'No pudimos completar la operación. Inténtalo nuevamente.',
  );
});

test('normaliza los datos generales antes de enviarlos a las RPC', () => {
  assert.deepEqual(
    normalizeBarbershopForm({
      name: '  Barbería   Central  ',
      description: '  Atención con cita  ',
      phone: '  +51 999 111 222  ',
      address: '  Av. Principal 123  ',
      locationReference: '  Frente al parque  ',
      logoUrl: '   ',
    }),
    {
      name: 'Barbería Central',
      description: 'Atención con cita',
      phone: '+51 999 111 222',
      address: 'Av. Principal 123',
      locationReference: 'Frente al parque',
      logoUrl: undefined,
    },
  );
});

test('rechaza datos generales fuera de las restricciones del esquema', () => {
  const errors = validateBarbershopForm({
    name: 'B',
    description: 'x'.repeat(501),
    phone: 'abc',
    address: 'x'.repeat(251),
    locationReference: 'x'.repeat(251),
    logoUrl: 'javascript:alert(1)',
  });

  assert.equal(errors.name, 'El nombre debe tener entre 2 y 120 caracteres.');
  assert.equal(errors.description, 'La descripción no puede superar 500 caracteres.');
  assert.equal(errors.phone, 'Ingresa un teléfono válido de entre 7 y 30 caracteres.');
  assert.equal(errors.address, 'La dirección no puede superar 250 caracteres.');
  assert.equal(errors.locationReference, 'La referencia no puede superar 250 caracteres.');
  assert.equal(errors.logoUrl, 'Ingresa una URL segura que empiece con http:// o https://.');
});

test('convierte los ajustes a enteros y valida los límites del esquema', () => {
  assert.deepEqual(
    parseBarbershopSettingsForm({
      minBookingNoticeMinutes: '60',
      maxBookingDays: '15',
      slotIntervalMinutes: '15',
      appointmentBufferMinutes: '15',
      cancellationNoticeMinutes: '120',
      lateCancellationRefundPolicy: 'full_refund',
    }),
    {
      values: {
        minBookingNoticeMinutes: 60,
        maxBookingDays: 15,
        slotIntervalMinutes: 15,
        appointmentBufferMinutes: 15,
        cancellationNoticeMinutes: 120,
        lateCancellationRefundPolicy: 'full_refund',
      },
      errors: {},
    },
  );

  const invalid = parseBarbershopSettingsForm({
    minBookingNoticeMinutes: '-1',
    maxBookingDays: '0',
    slotIntervalMinutes: '10.5',
    appointmentBufferMinutes: '241',
    cancellationNoticeMinutes: '10081',
    lateCancellationRefundPolicy: 'no_refund',
  });

  assert.deepEqual(Object.keys(invalid.errors).sort(), [
    'appointmentBufferMinutes',
    'cancellationNoticeMinutes',
    'maxBookingDays',
    'minBookingNoticeMinutes',
    'slotIntervalMinutes',
  ]);
});

test('valida Yape sin aceptar esquemas de URL inseguros', () => {
  assert.deepEqual(
    normalizeYapeSettingsForm({
      holderName: '  Ana   Pérez  ',
      phone: '  +51 999 111 222 ',
      qrUrl: '  https://example.com/qr.png  ',
    }),
    {
      holderName: 'Ana Pérez',
      phone: '+51 999 111 222',
      qrUrl: 'https://example.com/qr.png',
    },
  );
  assert.deepEqual(
    validateYapeSettingsForm({ holderName: '', phone: '', qrUrl: 'https://example.com/qr.png' }),
    {},
  );
  assert.deepEqual(
    validateYapeSettingsForm({ holderName: 'A', phone: '123', qrUrl: 'data:text/html,test' }),
    {
      holderName: 'El titular debe tener entre 2 y 120 caracteres.',
      phone: 'Ingresa un teléfono válido de entre 7 y 30 caracteres.',
      qrUrl: 'Ingresa una URL segura que empiece con http:// o https://.',
    },
  );
});

test('mapea solo membresías con barbería disponible y presenta rol y estado', () => {
  assert.deepEqual(
    mapMembershipRows([
      {
        id: 'membership-a',
        role: 'administrator',
        barbershop: {
          id: 'shop-a',
          name: 'Central',
          status: 'unpublished',
          phone: null,
          address: null,
          description: null,
          location_reference: 'Frente al parque',
          logo_url: null,
          created_at: '2026-08-08T00:00:00Z',
          updated_at: '2026-08-08T00:00:00Z',
        },
      },
      { id: 'membership-b', role: 'barber', barbershop: null },
    ]),
    [
      {
        membershipId: 'membership-a',
        role: 'administrator',
        barbershop: {
          id: 'shop-a',
          name: 'Central',
          status: 'unpublished',
          phone: null,
          address: null,
          description: null,
          locationReference: 'Frente al parque',
          logoUrl: null,
          createdAt: '2026-08-08T00:00:00Z',
          updatedAt: '2026-08-08T00:00:00Z',
        },
      },
    ],
  );
  assert.equal(getMembershipRoleLabel('administrator'), 'Administrador');
  assert.equal(getMembershipRoleLabel('barber'), 'Barbero');
  assert.equal(getBarbershopStatusLabel('unpublished'), 'No publicada');
  assert.equal(getBarbershopStatusLabel('published'), 'Publicada');
  assert.equal(getBarbershopStatusLabel('paused'), 'Pausada');
});
