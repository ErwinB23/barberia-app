import assert from 'node:assert/strict';
import test from 'node:test';

const domain = await import('./admin-home-domain.ts').catch(() => ({}));

const NOW = new Date('2026-08-20T15:00:00.000Z');

function appointment(overrides = {}) {
  return {
    id: 'appointment',
    barbershopId: 'shop-a',
    startsAt: '2026-08-20T16:00:00.000Z',
    endsAt: '2026-08-20T16:30:00.000Z',
    status: 'confirmed',
    ...overrides,
  };
}

function readiness(isComplete = true) {
  return [
    { key: 'basicData', label: 'Datos básicos requeridos', isComplete },
    { key: 'openingHours', label: 'Horario general configurado', isComplete: true },
  ];
}

test('resume únicamente las citas de la barbería administrada', () => {
  assert.equal(typeof domain.buildAdminTodaySummary, 'function');
  if (typeof domain.buildAdminTodaySummary !== 'function') return;

  const summary = domain.buildAdminTodaySummary(
    [
      appointment({ id: 'confirmed' }),
      appointment({ id: 'progress', status: 'in_progress' }),
      appointment({ id: 'completed', status: 'completed' }),
      appointment({ id: 'cancelled', status: 'cancelled' }),
      appointment({ id: 'other-shop', barbershopId: 'shop-b', status: 'completed' }),
    ],
    'shop-a',
  );

  assert.deepEqual(summary, { total: 4, confirmed: 1, inProgress: 1, completed: 1 });
});

test('selecciona como máximo cuatro citas operativas en orden cronológico', () => {
  assert.equal(typeof domain.selectAdminUpcomingAppointments, 'function');
  if (typeof domain.selectAdminUpcomingAppointments !== 'function') return;

  const selected = domain.selectAdminUpcomingAppointments(
    [
      appointment({ id: 'fifth', startsAt: '2026-08-20T20:00:00.000Z' }),
      appointment({ id: 'second', startsAt: '2026-08-20T17:00:00.000Z' }),
      appointment({ id: 'cancelled', status: 'cancelled' }),
      appointment({ id: 'first', startsAt: '2026-08-20T16:00:00.000Z' }),
      appointment({ id: 'fourth', startsAt: '2026-08-20T19:00:00.000Z' }),
      appointment({ id: 'third', startsAt: '2026-08-20T18:00:00.000Z' }),
      appointment({ id: 'other-shop', barbershopId: 'shop-b' }),
      appointment({
        id: 'ended',
        startsAt: '2026-08-20T14:00:00.000Z',
        endsAt: '2026-08-20T14:30:00.000Z',
      }),
    ],
    'shop-a',
    NOW,
    4,
  );

  assert.deepEqual(
    selected.map(({ id }) => id),
    ['first', 'second', 'third', 'fourth'],
  );
});

test('identifica pagos Yape e invitaciones que requieren atención', () => {
  assert.equal(typeof domain.buildAdminAttentionState, 'function');
  if (typeof domain.buildAdminAttentionState !== 'function') return;

  const state = domain.buildAdminAttentionState({
    pendingYapeCount: 2,
    pendingInvitationCount: 1,
    publicationStatus: 'published',
    publicationReadiness: readiness(),
  });

  assert.deepEqual(
    state.items.map(({ kind, count }) => [kind, count]),
    [
      ['pending_yape', 2],
      ['pending_invitations', 1],
    ],
  );
  assert.equal(state.isAllClear, false);
});

test('muestra preparación incompleta solo para una barbería no publicada', () => {
  assert.equal(typeof domain.buildAdminAttentionState, 'function');
  if (typeof domain.buildAdminAttentionState !== 'function') return;

  const unpublished = domain.buildAdminAttentionState({
    pendingYapeCount: 0,
    pendingInvitationCount: 0,
    publicationStatus: 'unpublished',
    publicationReadiness: readiness(false),
  });
  const paused = domain.buildAdminAttentionState({
    pendingYapeCount: 0,
    pendingInvitationCount: 0,
    publicationStatus: 'paused',
    publicationReadiness: readiness(false),
  });

  assert.equal(unpublished.items.at(-1)?.kind, 'publication_readiness');
  assert.equal(paused.items.length, 0);
  assert.equal(paused.isAllClear, true);
});

test('no afirma que todo está al día si falta un recurso de atención', () => {
  assert.equal(typeof domain.buildAdminAttentionState, 'function');
  if (typeof domain.buildAdminAttentionState !== 'function') return;

  const state = domain.buildAdminAttentionState({
    pendingYapeCount: null,
    pendingInvitationCount: 0,
    publicationStatus: 'published',
    publicationReadiness: readiness(),
  });

  assert.equal(state.isAllClear, false);
  assert.equal(state.hasUnavailableData, true);
});

test('expone copy exacto para los tres estados reales de barbería', () => {
  assert.equal(typeof domain.getAdminBarbershopStatusCopy, 'function');
  if (typeof domain.getAdminBarbershopStatusCopy !== 'function') return;

  assert.equal(domain.getAdminBarbershopStatusCopy('published').label, 'Publicada');
  assert.equal(domain.getAdminBarbershopStatusCopy('paused').label, 'Pausada');
  assert.equal(domain.getAdminBarbershopStatusCopy('unpublished').label, 'No publicada');
});

test('construye únicamente rutas administrativas existentes dentro de la barbería', () => {
  assert.equal(typeof domain.getAdminHomeRoutes, 'function');
  if (typeof domain.getAdminHomeRoutes !== 'function') return;

  const routes = domain.getAdminHomeRoutes('shop/a', null);

  assert.equal(routes.agenda, '/barbershops/shop%2Fa/appointments');
  assert.equal(routes.services, '/barbershops/shop%2Fa/services');
  assert.equal(routes.barbers, '/barbershops/shop%2Fa/barbers');
  assert.equal(routes.schedules, '/barbershops/shop%2Fa/schedules');
  assert.equal(routes.invitations, '/barbershops/shop%2Fa/invitations');
  assert.equal(routes.publication, '/barbershops/shop%2Fa/publication');
  assert.equal(
    routes.appointment('reservation/a'),
    '/barbershops/shop%2Fa/appointments/reservation%2Fa',
  );
  assert.equal(routes.ownBarberHome, null);
});

test('una cuenta administradora y barbera conserva ambos espacios sin selector ficticio', () => {
  assert.equal(typeof domain.getAdminHomeRoutes, 'function');
  if (typeof domain.getAdminHomeRoutes !== 'function') return;

  const routes = domain.getAdminHomeRoutes('shop-a', 'barber-a');

  assert.equal(routes.clientHome, '/');
  assert.equal(routes.ownBarberHome, '/barbershops/shop-a/barbers/barber-a/home');
});

test('un fallo secundario no bloquea el contexto ni las demás secciones', async () => {
  assert.equal(typeof domain.loadAdminHomeData, 'function');
  if (typeof domain.loadAdminHomeData !== 'function') return;

  const data = await domain.loadAdminHomeData(
    {
      getContext: async () => ({
        role: 'administrator',
        barbershop: { id: 'shop-a', name: 'Central', status: 'published' },
      }),
      getTodayAppointments: async () => [appointment()],
      getUpcomingAppointments: async () => {
        throw new Error('appointments unavailable');
      },
      getPendingYapeCount: async () => 1,
      getPendingInvitationCount: async () => 0,
      getPublicationReadiness: async () => readiness(),
      getUnreadNotificationCount: async () => 3,
      getOwnBarberProfile: async () => ({ barberId: 'barber-a', isActive: true }),
    },
    'shop-a',
    NOW,
  );

  assert.equal(data?.context.barbershop.name, 'Central');
  assert.equal(data?.summary?.total, 1);
  assert.equal(data?.upcomingAppointments, null);
  assert.equal(data?.pendingYapeCount, 1);
  assert.equal(data?.unreadNotificationCount, 3);
  assert.deepEqual(data?.unavailableSections, ['upcomingAppointments']);
});

test('una membresía de barbero no ejecuta consultas administrativas', async () => {
  assert.equal(typeof domain.loadAdminHomeData, 'function');
  if (typeof domain.loadAdminHomeData !== 'function') return;

  let adminQueryCount = 0;
  const adminLoader = async () => {
    adminQueryCount += 1;
    return [];
  };
  const data = await domain.loadAdminHomeData(
    {
      getContext: async () => ({
        role: 'barber',
        barbershop: { id: 'shop-a', name: 'Central', status: 'published' },
      }),
      getTodayAppointments: adminLoader,
      getUpcomingAppointments: adminLoader,
      getPendingYapeCount: async () => {
        adminQueryCount += 1;
        return 0;
      },
      getPendingInvitationCount: async () => {
        adminQueryCount += 1;
        return 0;
      },
      getPublicationReadiness: adminLoader,
      getUnreadNotificationCount: async () => 2,
      getOwnBarberProfile: async () => ({ barberId: 'barber-a', isActive: true }),
    },
    'shop-a',
    NOW,
  );

  assert.equal(adminQueryCount, 0);
  assert.equal(data?.summary, null);
  assert.equal(data?.ownBarberProfile?.barberId, 'barber-a');
});
