import assert from 'node:assert/strict';
import test from 'node:test';

import * as barberDomain from './barber-domain.ts';

import {
  WEEKDAYS_MONDAY_FIRST,
  getSelectedServiceIds,
  getWeekdayName,
  hasOverlappingIntervals,
  isScheduleWithinBarbershopHours,
  isSafeRemoteImageUrl,
  isTimeRangeValid,
  parseBarberScheduleForm,
  parseBlockForm,
} from './barber-domain.ts';
import { getBarberErrorMessage } from './errors.ts';

test('valida y normaliza los campos editables del perfil público', () => {
  assert.equal(typeof barberDomain.parseBarberProfileForm, 'function');
  if (typeof barberDomain.parseBarberProfileForm !== 'function') return;

  assert.deepEqual(
    barberDomain.parseBarberProfileForm({
      displayName: '  Ana   Torres  ',
      bio: '  Especialista en cortes clásicos.  ',
      photoUrl: '  https://images.example.com/ana.jpg  ',
    }).values,
    {
      displayName: 'Ana Torres',
      bio: 'Especialista en cortes clásicos.',
      photoUrl: 'https://images.example.com/ana.jpg',
    },
  );

  const invalid = barberDomain.parseBarberProfileForm({
    displayName: 'A',
    bio: 'a'.repeat(501),
    photoUrl: 'javascript:alert(1)',
  });
  assert.equal(invalid.values, null);
  assert.deepEqual(invalid.errors, {
    displayName: 'El nombre debe tener entre 2 y 120 caracteres.',
    bio: 'La biografía no puede superar 500 caracteres.',
    photoUrl: 'Ingresa una URL HTTPS válida.',
  });
});

test('solo permite URLs HTTPS para fotos remotas', () => {
  assert.equal(isSafeRemoteImageUrl('https://images.example.com/barber.jpg'), true);
  assert.equal(isSafeRemoteImageUrl('http://images.example.com/barber.jpg'), false);
  assert.equal(isSafeRemoteImageUrl('javascript:alert(1)'), false);
  assert.equal(isSafeRemoteImageUrl(null), false);
});

test('presenta weekdays de lunes a domingo con nombres en español', () => {
  assert.deepEqual(WEEKDAYS_MONDAY_FIRST, [1, 2, 3, 4, 5, 6, 0]);
  assert.deepEqual(WEEKDAYS_MONDAY_FIRST.map(getWeekdayName), [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
  ]);
});

test('valida que el inicio del horario sea anterior al fin', () => {
  assert.equal(isTimeRangeValid('09:00', '13:00'), true);
  assert.equal(isTimeRangeValid('13:00', '13:00'), false);
  assert.equal(isTimeRangeValid('14:00', '13:00'), false);
  assert.equal(isTimeRangeValid('24:00', '25:00'), false);
});

test('detecta solapamientos y permite intervalos adyacentes', () => {
  const intervals = [
    { id: 'morning', startTime: '09:00', endTime: '13:00' },
    { id: 'afternoon', startTime: '14:30', endTime: '22:00' },
  ];

  assert.equal(hasOverlappingIntervals({ startTime: '12:00', endTime: '14:00' }, intervals), true);
  assert.equal(hasOverlappingIntervals({ startTime: '13:00', endTime: '14:30' }, intervals), false);
  assert.equal(
    hasOverlappingIntervals({ startTime: '10:00', endTime: '12:00' }, intervals, 'morning'),
    false,
  );
});

test('exige que el horario individual quepa en un único intervalo general', () => {
  const openingHours = [
    { startTime: '09:00', endTime: '13:00' },
    { startTime: '14:30', endTime: '22:00' },
  ];

  assert.equal(
    isScheduleWithinBarbershopHours({ startTime: '09:30', endTime: '12:30' }, openingHours),
    true,
  );
  assert.equal(
    isScheduleWithinBarbershopHours({ startTime: '12:30', endTime: '15:00' }, openingHours),
    false,
  );
  assert.equal(
    parseBarberScheduleForm({ startTime: '12:30', endTime: '15:00' }, [], openingHours).values,
    null,
  );
});

test('mapea servicios seleccionados sin duplicados y en orden estable', () => {
  assert.deepEqual(
    getSelectedServiceIds([
      { serviceId: 'service-b' },
      { serviceId: 'service-a' },
      { serviceId: 'service-b' },
    ]),
    ['service-a', 'service-b'],
  );
});

test('valida que un bloqueo termine después de comenzar', () => {
  const valid = parseBlockForm({
    startDate: '2026-08-10',
    startTime: '09:00',
    endDate: '2026-08-10',
    endTime: '10:00',
    reason: ' Trámite personal ',
  });
  const invalid = parseBlockForm({
    startDate: '2026-08-10',
    startTime: '10:00',
    endDate: '2026-08-10',
    endTime: '09:00',
    reason: '',
  });

  assert.deepEqual(valid.values, {
    startsAt: '2026-08-10T14:00:00.000Z',
    endsAt: '2026-08-10T15:00:00.000Z',
    reason: 'Trámite personal',
  });
  assert.equal(invalid.values, null);
  assert.equal(invalid.errors.endTime, 'El bloqueo debe terminar después de comenzar.');
});

test('permite al barbero gestionar solo su espacio operativo sin administrar servicios', () => {
  const access =
    typeof barberDomain.getBarberOperationalAccess === 'function'
      ? barberDomain.getBarberOperationalAccess({
          role: 'barber',
          targetBarberId: 'barber-own',
          ownProfile: { barberId: 'barber-own', isActive: true },
        })
      : null;

  assert.deepEqual(access, {
    canAccess: true,
    canEditProfile: true,
    canViewServices: true,
    canManageServices: false,
    canManageSchedule: true,
    canManageBlocks: true,
    canDeactivate: true,
  });
});

test('impide al barbero acceder al espacio operativo de otro barbero', () => {
  const access =
    typeof barberDomain.getBarberOperationalAccess === 'function'
      ? barberDomain.getBarberOperationalAccess({
          role: 'barber',
          targetBarberId: 'barber-other',
          ownProfile: { barberId: 'barber-own', isActive: true },
        })
      : null;

  assert.deepEqual(access, {
    canAccess: false,
    canEditProfile: false,
    canViewServices: false,
    canManageServices: false,
    canManageSchedule: false,
    canManageBlocks: false,
    canDeactivate: false,
  });
});

test('conserva la gestión completa del administrador dentro de su barbería', () => {
  const access =
    typeof barberDomain.getBarberOperationalAccess === 'function'
      ? barberDomain.getBarberOperationalAccess({
          role: 'administrator',
          targetBarberId: 'barber-other',
          ownProfile: null,
        })
      : null;

  assert.deepEqual(access, {
    canAccess: true,
    canEditProfile: true,
    canViewServices: true,
    canManageServices: true,
    canManageSchedule: true,
    canManageBlocks: true,
    canDeactivate: true,
  });
});

test('construye navegación profesional aislada por barbería y perfil', () => {
  assert.equal(typeof barberDomain.getBarberWorkspaceRoutes, 'function');
  if (typeof barberDomain.getBarberWorkspaceRoutes !== 'function') return;

  const first = barberDomain.getBarberWorkspaceRoutes('shop-a', 'barber-a');
  const second = barberDomain.getBarberWorkspaceRoutes('shop-b', 'barber-a');

  assert.deepEqual(first, {
    clientHome: '/',
    professionalHome: '/barbershops/shop-a/barbers/barber-a/home',
    workspace: '/barbershops/shop-a/barbers/barber-a',
    profile: '/barbershops/shop-a/barbers/barber-a/edit',
    services: '/barbershops/shop-a/barbers/barber-a/services',
    schedule: '/barbershops/shop-a/barbers/barber-a/schedule',
    blocks: '/barbershops/shop-a/barbers/barber-a/blocks',
    newBlock: '/barbershops/shop-a/barbers/barber-a/blocks/new',
    agenda: '/barbershops/shop-a/barbers/barber-a/appointments',
    administration: '/barbershops/shop-a',
  });
  assert.notEqual(first.workspace, second.workspace);
  assert.equal(second.workspace.includes('shop-a'), false);
});

test('organiza los siete días y conserva múltiples intervalos ordenados', () => {
  assert.equal(typeof barberDomain.buildBarberScheduleDays, 'function');
  if (typeof barberDomain.buildBarberScheduleDays !== 'function') return;

  const days = barberDomain.buildBarberScheduleDays(
    [
      { id: 'afternoon', weekday: 1, startTime: '14:30', endTime: '19:00' },
      { id: 'morning', weekday: 1, startTime: '09:00', endTime: '13:00' },
    ],
    [{ id: 'opening', weekday: 1, startTime: '08:00', endTime: '20:00' }],
  );

  assert.equal(days.length, 7);
  assert.deepEqual(
    days.map(({ weekday, name }) => ({ weekday, name })),
    [
      { weekday: 1, name: 'Lunes' },
      { weekday: 2, name: 'Martes' },
      { weekday: 3, name: 'Miércoles' },
      { weekday: 4, name: 'Jueves' },
      { weekday: 5, name: 'Viernes' },
      { weekday: 6, name: 'Sábado' },
      { weekday: 0, name: 'Domingo' },
    ],
  );
  assert.deepEqual(
    days[0].schedules.map(({ id }) => id),
    ['morning', 'afternoon'],
  );
  assert.deepEqual(days[1].schedules, []);
});

test('traduce el conflicto entre bloqueo y cita sin filtrar el error de base de datos', () => {
  assert.equal(
    getBarberErrorMessage({ code: '23P01', message: 'exclusion constraint details' }, 'blocks'),
    'No se puede crear el bloqueo porque se superpone con una reserva activa.',
  );
});
