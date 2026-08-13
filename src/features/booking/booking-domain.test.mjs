import assert from 'node:assert/strict';
import test from 'node:test';

const bookingDomain = await import('./booking-domain.ts').catch(() => ({}));

test('selecciona varios servicios sin duplicados y elimina sus estilos al desmarcar', () => {
  assert.equal(typeof bookingDomain.toggleServiceSelection, 'function');
  assert.equal(typeof bookingDomain.reconcileStyleSelections, 'function');
  if (
    typeof bookingDomain.toggleServiceSelection !== 'function' ||
    typeof bookingDomain.reconcileStyleSelections !== 'function'
  ) {
    return;
  }

  const selected = bookingDomain.toggleServiceSelection(['service-a'], 'service-b');
  assert.deepEqual(selected, ['service-a', 'service-b']);
  assert.deepEqual(bookingDomain.toggleServiceSelection(selected, 'service-a'), ['service-b']);
  assert.deepEqual(
    bookingDomain.reconcileStyleSelections({ 'service-a': 'style-a', 'service-b': 'style-b' }, [
      'service-b',
    ]),
    { 'service-b': 'style-b' },
  );
});

test('calcula el total PEN y duración como vista previa, sin sustituir snapshots backend', () => {
  assert.equal(typeof bookingDomain.calculateBookingPreview, 'function');
  assert.equal(typeof bookingDomain.formatPen, 'function');
  if (
    typeof bookingDomain.calculateBookingPreview !== 'function' ||
    typeof bookingDomain.formatPen !== 'function'
  ) {
    return;
  }

  const preview = bookingDomain.calculateBookingPreview(
    ['service-b', 'service-a'],
    [
      { id: 'service-a', price: 25.5, durationMinutes: 30 },
      { id: 'service-b', price: 40, durationMinutes: 45 },
    ],
  );

  assert.deepEqual(preview, { totalPrice: 65.5, totalDurationMinutes: 75 });
  assert.equal(bookingDomain.formatPen(preview.totalPrice), 'S/ 65.50');
});

test('solo considera elegibles barberos activos asignados a todos los servicios', () => {
  assert.equal(typeof bookingDomain.getEligibleBarberIds, 'function');
  if (typeof bookingDomain.getEligibleBarberIds !== 'function') return;

  assert.deepEqual(
    bookingDomain.getEligibleBarberIds(
      ['service-a', 'service-b'],
      ['barber-a', 'barber-b'],
      [
        { barberId: 'barber-a', serviceId: 'service-a' },
        { barberId: 'barber-a', serviceId: 'service-b' },
        { barberId: 'barber-b', serviceId: 'service-a' },
      ],
    ),
    ['barber-a'],
  );
});

test('construye p_items con un estilo opcional perteneciente al servicio elegido', () => {
  assert.equal(typeof bookingDomain.buildReservationItems, 'function');
  if (typeof bookingDomain.buildReservationItems !== 'function') return;

  assert.deepEqual(
    bookingDomain.buildReservationItems(
      ['service-a', 'service-b'],
      { 'service-a': 'style-a', 'service-c': 'style-c' },
      [
        { id: 'style-a', serviceId: 'service-a' },
        { id: 'style-c', serviceId: 'service-c' },
      ],
    ),
    [
      { service_id: 'service-a', style_id: 'style-a' },
      { service_id: 'service-b', style_id: null },
    ],
  );
});

test('valida fechas de calendario reales y formatea horas en America/Lima', () => {
  assert.equal(typeof bookingDomain.isValidDateInput, 'function');
  assert.equal(typeof bookingDomain.formatLimaTime, 'function');
  if (
    typeof bookingDomain.isValidDateInput !== 'function' ||
    typeof bookingDomain.formatLimaTime !== 'function'
  ) {
    return;
  }

  assert.equal(bookingDomain.isValidDateInput('2026-08-30'), true);
  assert.equal(bookingDomain.isValidDateInput('2026-02-30'), false);
  assert.equal(bookingDomain.isValidDateInput('30/08/2026'), false);
  assert.equal(bookingDomain.formatLimaTime('2026-08-30T14:30:00.000Z'), '09:30');
});
