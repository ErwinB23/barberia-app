import assert from 'node:assert/strict';
import test from 'node:test';

import * as homeDomain from './client-home-domain.ts';
import {
  getClientFirstName,
  getReservationServicesSummary,
  selectAvailableBarbershops,
  selectHomeFavorites,
  selectUpcomingReservation,
} from './client-home-domain.ts';

function createHomeLoaders(overrides = {}) {
  return {
    getReservations: async () => [
      { id: 'reservation-a', status: 'confirmed', startsAt: '2026-08-20T15:00:00Z' },
    ],
    getBarbershops: async () => [{ id: 'barbershop-a', status: 'published' }],
    getFavorites: async () => [
      {
        id: 'favorite-a',
        isPrimary: true,
        barbershop: { id: 'barbershop-a' },
      },
    ],
    getUnreadNotificationCount: async () => 2,
    ...overrides,
  };
}

test('obtiene un saludo corto desde un nombre real disponible', () => {
  assert.equal(getClientFirstName('  Andrea Milagros Pérez  '), 'Andrea');
  assert.equal(getClientFirstName(null), null);
  assert.equal(getClientFirstName('   '), null);
});

test('selecciona la próxima reserva activa en orden cronológico', () => {
  const reservations = [
    { id: 'later', status: 'confirmed', startsAt: '2026-08-17T15:00:00Z' },
    { id: 'cancelled', status: 'cancelled', startsAt: '2026-08-16T12:00:00Z' },
    { id: 'next', status: 'confirmed', startsAt: '2026-08-16T15:00:00Z' },
  ];

  assert.equal(
    selectUpcomingReservation(reservations, new Date('2026-08-15T12:00:00Z'))?.id,
    'next',
  );
});

test('resume servicios sin perder sus nombres snapshot', () => {
  assert.equal(getReservationServicesSummary([]), null);
  assert.equal(getReservationServicesSummary([{ serviceName: 'Corte clásico' }]), 'Corte clásico');
  assert.equal(
    getReservationServicesSummary([
      { serviceName: 'Corte clásico' },
      { serviceName: 'Barba' },
      { serviceName: 'Lavado' },
    ]),
    'Corte clásico, Barba +1',
  );
});

test('muestra solo barberías realmente publicadas y limita la portada', () => {
  const barbershops = [
    { id: 'a', status: 'published' },
    { id: 'b', status: 'paused' },
    { id: 'c', status: 'published' },
    { id: 'd', status: 'published' },
  ];

  assert.deepEqual(
    selectAvailableBarbershops(barbershops, 2).map(({ id }) => id),
    ['a', 'c'],
  );
});

test('omite favoritas sin barbería visible y conserva la principal primero', () => {
  const favorites = [
    { id: 'hidden', isPrimary: false, barbershop: null },
    { id: 'secondary', isPrimary: false, barbershop: { id: 'b' } },
    { id: 'primary', isPrimary: true, barbershop: { id: 'a' } },
  ];

  assert.deepEqual(
    selectHomeFavorites(favorites, 2).map(({ id }) => id),
    ['primary', 'secondary'],
  );
});

test('mantiene operativo el Home si falla únicamente el contador de notificaciones', async () => {
  assert.equal(typeof homeDomain.loadClientHomeData, 'function');
  if (typeof homeDomain.loadClientHomeData !== 'function') return;

  const data = await homeDomain.loadClientHomeData(
    createHomeLoaders({
      getUnreadNotificationCount: async () => {
        throw new Error('notifications unavailable');
      },
    }),
    new Date('2026-08-18T12:00:00Z'),
  );

  assert.equal(data.upcomingReservation?.id, 'reservation-a');
  assert.deepEqual(
    data.availableBarbershops.map(({ id }) => id),
    ['barbershop-a'],
  );
  assert.deepEqual(
    data.favorites.map(({ id }) => id),
    ['favorite-a'],
  );
  assert.equal(data.unreadNotificationCount, null);
});

test('conserva el contador correcto cuando notifications responde', async () => {
  assert.equal(typeof homeDomain.loadClientHomeData, 'function');
  if (typeof homeDomain.loadClientHomeData !== 'function') return;

  const data = await homeDomain.loadClientHomeData(
    createHomeLoaders({ getUnreadNotificationCount: async () => 7 }),
    new Date('2026-08-18T12:00:00Z'),
  );

  assert.equal(data.unreadNotificationCount, 7);
});

test('inicia y conserva el resto de recursos aunque notifications falle', async () => {
  assert.equal(typeof homeDomain.loadClientHomeData, 'function');
  if (typeof homeDomain.loadClientHomeData !== 'function') return;

  const requestedResources = [];
  const data = await homeDomain.loadClientHomeData(
    createHomeLoaders({
      getReservations: async () => {
        requestedResources.push('reservations');
        return [];
      },
      getBarbershops: async () => {
        requestedResources.push('barbershops');
        return [];
      },
      getFavorites: async () => {
        requestedResources.push('favorites');
        return [];
      },
      getUnreadNotificationCount: async () => {
        requestedResources.push('notifications');
        throw new Error('notifications unavailable');
      },
    }),
  );

  assert.deepEqual(
    new Set(requestedResources),
    new Set(['reservations', 'barbershops', 'favorites', 'notifications']),
  );
  assert.deepEqual(data.availableBarbershops, []);
  assert.deepEqual(data.favorites, []);
  assert.equal(data.upcomingReservation, null);
});
