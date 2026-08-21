import assert from 'node:assert/strict';
import test from 'node:test';

const reservationDomain = await import('./reservation-domain.ts').catch(() => ({}));

test('mapea estados de reserva y pago a textos comprensibles en español', () => {
  assert.equal(typeof reservationDomain.getReservationStatusLabel, 'function');
  assert.equal(typeof reservationDomain.getPaymentStatusLabel, 'function');
  assert.equal(typeof reservationDomain.getPaymentMethodLabel, 'function');
  if (
    typeof reservationDomain.getReservationStatusLabel !== 'function' ||
    typeof reservationDomain.getPaymentStatusLabel !== 'function' ||
    typeof reservationDomain.getPaymentMethodLabel !== 'function'
  ) {
    return;
  }

  assert.equal(reservationDomain.getReservationStatusLabel('confirmed'), 'Confirmada');
  assert.equal(reservationDomain.getReservationStatusLabel('in_progress'), 'En atención');
  assert.equal(reservationDomain.getReservationStatusLabel('completed'), 'Completada');
  assert.equal(reservationDomain.getReservationStatusLabel('cancelled'), 'Cancelada');
  assert.equal(reservationDomain.getReservationStatusLabel('no_show'), 'No asistió');
  assert.equal(reservationDomain.getPaymentStatusLabel('pending'), 'Pendiente');
  assert.equal(reservationDomain.getPaymentStatusLabel('paid'), 'Pagado');
  assert.equal(reservationDomain.getPaymentStatusLabel('refunded'), 'Reembolsado');
  assert.equal(reservationDomain.getPaymentStatusLabel('failed'), 'Fallido');
  assert.equal(reservationDomain.getPaymentMethodLabel('cash'), 'Efectivo');
  assert.equal(reservationDomain.getPaymentMethodLabel('yape'), 'Yape');
});

test('solo permite mostrar reprogramación una vez para reservas confirmadas futuras', () => {
  assert.equal(typeof reservationDomain.canRescheduleReservation, 'function');
  if (typeof reservationDomain.canRescheduleReservation !== 'function') return;

  const now = new Date('2026-08-12T15:00:00.000Z');
  const base = {
    status: 'confirmed',
    startsAt: '2026-08-13T15:00:00.000Z',
    rescheduleCount: 0,
  };

  assert.equal(reservationDomain.canRescheduleReservation(base, now), true);
  assert.equal(
    reservationDomain.canRescheduleReservation({ ...base, rescheduleCount: 1 }, now),
    false,
  );
  assert.equal(
    reservationDomain.canRescheduleReservation({ ...base, status: 'completed' }, now),
    false,
  );
  assert.equal(
    reservationDomain.canRescheduleReservation(
      { ...base, startsAt: '2026-08-11T15:00:00.000Z' },
      now,
    ),
    false,
  );
});

test('agrupa próximas e históricas con orden cronológico útil', () => {
  assert.equal(typeof reservationDomain.groupClientReservations, 'function');
  if (typeof reservationDomain.groupClientReservations !== 'function') return;

  const now = new Date('2026-08-12T15:00:00.000Z');
  const reservations = [
    { id: 'future-late', status: 'confirmed', startsAt: '2026-08-14T15:00:00.000Z' },
    { id: 'cancelled', status: 'cancelled', startsAt: '2026-08-15T15:00:00.000Z' },
    { id: 'future-first', status: 'confirmed', startsAt: '2026-08-13T15:00:00.000Z' },
    { id: 'completed', status: 'completed', startsAt: '2026-08-10T15:00:00.000Z' },
  ];

  const grouped = reservationDomain.groupClientReservations(reservations, now);
  assert.deepEqual(
    grouped.upcoming.map((reservation) => reservation.id),
    ['future-first', 'future-late'],
  );
  assert.deepEqual(
    grouped.history.map((reservation) => reservation.id),
    ['cancelled', 'completed'],
  );
});

test('permite cancelar únicamente reservas confirmadas futuras', () => {
  assert.equal(typeof reservationDomain.canCancelReservation, 'function');
  if (typeof reservationDomain.canCancelReservation !== 'function') return;

  const now = new Date('2026-08-12T15:00:00.000Z');
  assert.equal(
    reservationDomain.canCancelReservation(
      { status: 'confirmed', startsAt: '2026-08-13T15:00:00.000Z' },
      now,
    ),
    true,
  );
  assert.equal(
    reservationDomain.canCancelReservation(
      { status: 'in_progress', startsAt: '2026-08-13T15:00:00.000Z' },
      now,
    ),
    false,
  );
});

test('mapea descripciones historicas exclusivamente desde snapshots', () => {
  assert.equal(typeof reservationDomain.mapReservationDescriptionSnapshots, 'function');
  assert.equal(typeof reservationDomain.mapReservationServiceDescriptionSnapshots, 'function');
  if (
    typeof reservationDomain.mapReservationDescriptionSnapshots !== 'function' ||
    typeof reservationDomain.mapReservationServiceDescriptionSnapshots !== 'function'
  ) {
    return;
  }

  assert.deepEqual(
    reservationDomain.mapReservationDescriptionSnapshots({
      barbershop_name_snapshot: 'Barbería original',
      barber_display_name_snapshot: 'Barbero original',
    }),
    {
      barbershopName: 'Barbería original',
      barberName: 'Barbero original',
    },
  );
  assert.deepEqual(
    reservationDomain.mapReservationServiceDescriptionSnapshots({
      service_name_snapshot: 'Servicio original',
      style_name_snapshot: 'Estilo original',
    }),
    {
      serviceName: 'Servicio original',
      styleName: 'Estilo original',
    },
  );
});

test('resume servicios históricos sin depender de entidades actuales', () => {
  assert.equal(typeof reservationDomain.getReservationServiceSummary, 'function');
  if (typeof reservationDomain.getReservationServiceSummary !== 'function') return;

  const items = [
    { serviceName: 'Corte clásico', styleName: 'Pompadour' },
    { serviceName: 'Barba', styleName: null },
    { serviceName: 'Lavado', styleName: null },
  ];

  assert.equal(
    reservationDomain.getReservationServiceSummary(items),
    'Corte clásico (Pompadour), Barba y 1 más',
  );
});

test('construye la comparación de reprogramación conservando los servicios contratados', () => {
  assert.equal(typeof reservationDomain.buildRescheduleReview, 'function');
  if (typeof reservationDomain.buildRescheduleReview !== 'function') return;

  const services = [
    { serviceName: 'Corte original', styleName: 'Estilo original' },
    { serviceName: 'Barba original', styleName: null },
  ];
  const review = reservationDomain.buildRescheduleReview(
    {
      startsAt: '2026-08-20T15:00:00.000Z',
      barberName: 'Carlos',
      items: services,
    },
    {
      startsAt: '2026-08-22T17:00:00.000Z',
      barberName: 'Mateo',
    },
  );

  assert.deepEqual(review, {
    current: {
      startsAt: '2026-08-20T15:00:00.000Z',
      barberName: 'Carlos',
    },
    next: {
      startsAt: '2026-08-22T17:00:00.000Z',
      barberName: 'Mateo',
    },
    services,
  });
  assert.equal(review.services, services);
});

test('explica la cancelación tardía con la política snapshot real', () => {
  assert.equal(typeof reservationDomain.getCancellationPolicyMessage, 'function');
  if (typeof reservationDomain.getCancellationPolicyMessage !== 'function') return;

  assert.equal(
    reservationDomain.getCancellationPolicyMessage({
      isLateCancellation: true,
      isRefundEligible: false,
      paymentStatus: 'paid',
    }),
    'La cancelación fue tardía y la política guardada para esta reserva no permite reembolso.',
  );
  assert.equal(
    reservationDomain.getCancellationPolicyMessage({
      isLateCancellation: true,
      isRefundEligible: true,
      paymentStatus: 'paid',
    }),
    'La cancelación fue tardía, pero la política guardada permite solicitar el reembolso. La barbería debe procesarlo.',
  );
  assert.equal(
    reservationDomain.getCancellationPolicyMessage({
      isLateCancellation: false,
      isLateReschedule: true,
      isRefundEligible: false,
      paymentStatus: 'paid',
    }),
    'Una reprogramación tardía conservó la política sin reembolso para esta reserva.',
  );
});

test('usa un destino estable después de reprogramar o cancelar', () => {
  assert.equal(typeof reservationDomain.getClientReservationHref, 'function');
  if (typeof reservationDomain.getClientReservationHref !== 'function') return;

  assert.equal(
    reservationDomain.getClientReservationHref('reservation/with spaces'),
    '/reservations/reservation%2Fwith%20spaces',
  );
});
