import assert from 'node:assert/strict';
import test from 'node:test';

import { getBarbershopErrorMessage, getPublicationErrorMessage } from './errors.ts';
import {
  buildPublicationReadiness,
  canPublishBarbershop,
  getPublicationRequirementRoute,
  getPublicationStatusCopy,
} from './publication.ts';
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

test('presenta los cinco requisitos reales de publicación', () => {
  assert.deepEqual(
    buildPublicationReadiness({
      phone: '+51 999 111 222',
      address: 'Av. Principal 123',
      hasOpeningHours: true,
      hasActiveService: true,
      hasActiveBarber: true,
      hasScheduledActiveBarber: false,
    }),
    [
      { key: 'basicData', label: 'Datos básicos requeridos', isComplete: true },
      { key: 'openingHours', label: 'Horario general configurado', isComplete: true },
      { key: 'activeService', label: 'Al menos un servicio activo', isComplete: true },
      { key: 'activeBarber', label: 'Al menos un barbero activo', isComplete: true },
      {
        key: 'scheduledActiveBarber',
        label: 'Al menos un barbero activo con horario individual',
        isComplete: false,
      },
    ],
  );
});

test('considera incompletos los datos básicos vacíos', () => {
  const [basicData] = buildPublicationReadiness({
    phone: '   ',
    address: null,
    hasOpeningHours: false,
    hasActiveService: false,
    hasActiveBarber: false,
    hasScheduledActiveBarber: false,
  });

  assert.equal(basicData?.isComplete, false);
});

test('bloquea publicación incompleta y dirige al requisito pendiente correcto', () => {
  const readiness = buildPublicationReadiness({
    phone: '+51 999 111 222',
    address: 'Av. Principal 123',
    hasOpeningHours: true,
    hasActiveService: true,
    hasActiveBarber: true,
    hasScheduledActiveBarber: false,
  });

  assert.equal(canPublishBarbershop(readiness), false);
  assert.equal(
    getPublicationRequirementRoute('scheduledActiveBarber', 'shop-a'),
    '/barbershops/shop-a/barbers',
  );
  assert.equal(getPublicationRequirementRoute('basicData', 'shop-a'), '/barbershops/shop-a/edit');
  assert.equal(
    canPublishBarbershop(readiness.map((item) => ({ ...item, isComplete: true }))),
    true,
  );
});

test('explica sin depender del color los tres estados de publicación', () => {
  assert.deepEqual(getPublicationStatusCopy('published'), {
    label: 'Publicada',
    description: 'Visible y disponible para nuevas reservas.',
  });
  assert.deepEqual(getPublicationStatusCopy('paused'), {
    label: 'Pausada',
    description: 'Visible, pero temporalmente no acepta nuevas reservas.',
  });
  assert.deepEqual(getPublicationStatusCopy('unpublished'), {
    label: 'No publicada',
    description: 'No es visible para los clientes.',
  });
});

test('traduce cada requisito rechazado por publish_barbershop', () => {
  assert.equal(
    getPublicationErrorMessage({
      code: '22023',
      message: 'Complete the required barbershop information',
    }),
    'Completa el teléfono y la dirección de la barbería antes de publicarla.',
  );
  assert.equal(
    getPublicationErrorMessage({
      code: '22023',
      message: 'Configure barbershop opening hours first',
    }),
    'Configura al menos un intervalo en el horario general antes de publicar.',
  );
  assert.equal(
    getPublicationErrorMessage({
      code: '22023',
      message: 'At least one active service is required',
    }),
    'Activa al menos un servicio antes de publicar.',
  );
  assert.equal(
    getPublicationErrorMessage({
      code: '22023',
      message: 'At least one active barber with a configured schedule is required',
    }),
    'Necesitas al menos un barbero activo con horario individual antes de publicar.',
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
