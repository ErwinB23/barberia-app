import assert from 'node:assert/strict';
import test from 'node:test';

const domain = await import('./barber-home-domain.ts').catch(() => ({}));

const NOW = new Date('2026-08-20T15:00:00.000Z');

function appointment(overrides = {}) {
  return {
    id: 'appointment',
    barbershopId: 'shop-a',
    barberId: 'barber-a',
    startsAt: '2026-08-20T16:00:00.000Z',
    endsAt: '2026-08-20T16:30:00.000Z',
    status: 'confirmed',
    ...overrides,
  };
}

test('selecciona la próxima cita operativa de hoy en Lima', () => {
  assert.equal(typeof domain.buildBarberTodayState, 'function');
  if (typeof domain.buildBarberTodayState !== 'function') return;

  const state = domain.buildBarberTodayState(
    [
      appointment({ id: 'completed', status: 'completed', startsAt: '2026-08-20T14:00:00.000Z' }),
      appointment({
        id: 'in-progress',
        status: 'in_progress',
        startsAt: '2026-08-20T14:30:00.000Z',
        endsAt: '2026-08-20T15:30:00.000Z',
      }),
      appointment({ id: 'next-confirmed', startsAt: '2026-08-20T16:30:00.000Z' }),
    ],
    'shop-a',
    NOW,
  );

  assert.equal(state.nextAppointment?.id, 'in-progress');
});

test('ordena cronológicamente las citas siguientes y limita la portada', () => {
  assert.equal(typeof domain.buildBarberTodayState, 'function');
  if (typeof domain.buildBarberTodayState !== 'function') return;

  const state = domain.buildBarberTodayState(
    [
      appointment({ id: 'fourth', startsAt: '2026-08-20T20:00:00.000Z' }),
      appointment({ id: 'next', startsAt: '2026-08-20T16:00:00.000Z' }),
      appointment({ id: 'third', startsAt: '2026-08-20T19:00:00.000Z' }),
      appointment({ id: 'second', startsAt: '2026-08-20T18:00:00.000Z' }),
      appointment({ id: 'fifth', startsAt: '2026-08-20T21:00:00.000Z' }),
    ],
    'shop-a',
    NOW,
  );

  assert.deepEqual(
    state.followingAppointments.map(({ id }) => id),
    ['second', 'third', 'fourth'],
  );
});

test('resume la jornada sin convertirla en analytics', () => {
  assert.equal(typeof domain.buildBarberTodayState, 'function');
  if (typeof domain.buildBarberTodayState !== 'function') return;

  const state = domain.buildBarberTodayState(
    [
      appointment({ id: 'confirmed', status: 'confirmed' }),
      appointment({ id: 'in-progress', status: 'in_progress' }),
      appointment({ id: 'completed', status: 'completed' }),
      appointment({ id: 'cancelled', status: 'cancelled' }),
      appointment({ id: 'no-show', status: 'no_show' }),
    ],
    'shop-a',
    NOW,
  );

  assert.deepEqual(state.summary, { total: 5, pending: 2, completed: 1 });
});

test('distingue un día vacío de una jornada ya atendida', () => {
  assert.equal(typeof domain.buildBarberTodayState, 'function');
  if (typeof domain.buildBarberTodayState !== 'function') return;

  assert.equal(domain.buildBarberTodayState([], 'shop-a', NOW).emptyState, 'no_appointments');
  assert.equal(
    domain.buildBarberTodayState(
      [appointment({ status: 'completed', startsAt: '2026-08-20T14:00:00.000Z' })],
      'shop-a',
      NOW,
    ).emptyState,
    'day_complete',
  );
});

test('aísla la jornada por barbería antes de calcular métricas', () => {
  assert.equal(typeof domain.buildBarberTodayState, 'function');
  if (typeof domain.buildBarberTodayState !== 'function') return;

  const state = domain.buildBarberTodayState(
    [appointment({ id: 'shop-a' }), appointment({ id: 'shop-b', barbershopId: 'shop-b' })],
    'shop-a',
    NOW,
  );

  assert.equal(state.summary.total, 1);
  assert.equal(state.nextAppointment?.id, 'shop-a');
});

test('construye el detalle operativo dentro del barbero y barbería actuales', () => {
  assert.equal(typeof domain.getBarberHomeRoutes, 'function');
  if (typeof domain.getBarberHomeRoutes !== 'function') return;

  const routes = domain.getBarberHomeRoutes('shop-a', 'barber-a');
  assert.equal(
    routes.appointment('reservation-a'),
    '/barbershops/shop-a/barbers/barber-a/appointments/reservation-a',
  );
});

test('la cuenta multi-capacidad conserva una salida explícita al inicio Cliente', () => {
  assert.equal(typeof domain.getBarberHomeRoutes, 'function');
  if (typeof domain.getBarberHomeRoutes !== 'function') return;

  const routes = domain.getBarberHomeRoutes('shop-a', 'barber-a');
  assert.equal(routes.clientHome, '/');
  assert.equal(routes.agenda, '/barbershops/shop-a/barbers/barber-a/appointments');
  assert.equal(routes.workspace, '/barbershops/shop-a/barbers/barber-a');
  assert.equal(routes.schedule, '/barbershops/shop-a/barbers/barber-a/schedule');
  assert.equal(routes.newBlock, '/barbershops/shop-a/barbers/barber-a/blocks/new');
});

test('un fallo secundario no bloquea la jornada principal', async () => {
  assert.equal(typeof domain.loadBarberHomeData, 'function');
  if (typeof domain.loadBarberHomeData !== 'function') return;

  const data = await domain.loadBarberHomeData(
    {
      getAgenda: async () => ({ appointments: [appointment({ id: 'visible' })] }),
      getBarbershopName: async () => {
        throw new Error('context unavailable');
      },
      getUnreadNotificationCount: async () => {
        throw new Error('notifications unavailable');
      },
    },
    'shop-a',
    NOW,
  );

  assert.equal(data?.nextAppointment?.id, 'visible');
  assert.equal(data?.barbershopName, null);
  assert.equal(data?.unreadNotificationCount, null);
});
