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
