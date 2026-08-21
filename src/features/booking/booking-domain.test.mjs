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

test('filtra barberías por nombre, descripción o dirección sin depender de tildes', () => {
  assert.equal(typeof bookingDomain.filterPublicBarbershops, 'function');
  if (typeof bookingDomain.filterPublicBarbershops !== 'function') return;

  const barbershops = [
    {
      id: 'shop-a',
      name: 'Corte Clásico',
      description: 'Barbería tradicional',
      address: 'Avenida Arequipa 120',
    },
    {
      id: 'shop-b',
      name: 'Distrito 27',
      description: 'Cortes contemporáneos',
      address: 'Jirón de la Unión 400',
    },
  ];

  assert.deepEqual(
    bookingDomain.filterPublicBarbershops(barbershops, 'clasico').map((item) => item.id),
    ['shop-a'],
  );
  assert.deepEqual(
    bookingDomain.filterPublicBarbershops(barbershops, 'CONTEMPORANEOS').map((item) => item.id),
    ['shop-b'],
  );
  assert.deepEqual(bookingDomain.filterPublicBarbershops(barbershops, 'barranco'), []);
  assert.equal(bookingDomain.filterPublicBarbershops(barbershops, '   '), barbershops);
});

test('resume únicamente los servicios asignados al barbero con un límite legible', () => {
  assert.equal(typeof bookingDomain.getBarberServiceSummary, 'function');
  if (typeof bookingDomain.getBarberServiceSummary !== 'function') return;

  const services = [
    { id: 'service-a', name: 'Corte clásico' },
    { id: 'service-b', name: 'Barba' },
    { id: 'service-c', name: 'Perfilado' },
    { id: 'service-d', name: 'Color' },
  ];
  const assignments = services.map((service) => ({
    barberId: 'barber-a',
    serviceId: service.id,
  }));

  assert.equal(
    bookingDomain.getBarberServiceSummary('barber-a', services, assignments),
    'Corte clásico, Barba, Perfilado y 1 más',
  );
  assert.equal(
    bookingDomain.getBarberServiceSummary('barber-b', services, assignments),
    'Servicios por confirmar',
  );
});

test('expone una progresión compacta y predecible para el flujo de reserva', () => {
  assert.equal(typeof bookingDomain.getNextBookingStep, 'function');
  assert.equal(typeof bookingDomain.getPreviousBookingStep, 'function');
  assert.deepEqual(
    bookingDomain.BOOKING_FLOW_STEPS?.map((step) => step.label),
    ['Servicios', 'Profesional', 'Horario', 'Confirmar'],
  );
  if (
    typeof bookingDomain.getNextBookingStep !== 'function' ||
    typeof bookingDomain.getPreviousBookingStep !== 'function'
  ) {
    return;
  }

  assert.equal(bookingDomain.getNextBookingStep('services'), 'professional');
  assert.equal(bookingDomain.getNextBookingStep('professional'), 'schedule');
  assert.equal(bookingDomain.getNextBookingStep('schedule'), 'confirm');
  assert.equal(bookingDomain.getNextBookingStep('confirm'), 'confirm');
  assert.equal(bookingDomain.getPreviousBookingStep('confirm'), 'schedule');
  assert.equal(bookingDomain.getPreviousBookingStep('services'), 'services');
});

test('bloquea el avance hasta completar la elección requerida de cada etapa', () => {
  assert.equal(typeof bookingDomain.canContinueBookingStep, 'function');
  if (typeof bookingDomain.canContinueBookingStep !== 'function') return;

  const emptySelection = {
    selectedServiceCount: 0,
    eligibleBarberCount: 0,
    hasSelectedSlot: false,
  };
  assert.equal(bookingDomain.canContinueBookingStep('services', emptySelection), false);
  assert.equal(
    bookingDomain.canContinueBookingStep('services', {
      ...emptySelection,
      selectedServiceCount: 2,
    }),
    true,
  );
  assert.equal(
    bookingDomain.canContinueBookingStep('professional', {
      ...emptySelection,
      selectedServiceCount: 2,
      eligibleBarberCount: 1,
    }),
    true,
  );
  assert.equal(
    bookingDomain.canContinueBookingStep('schedule', {
      selectedServiceCount: 2,
      eligibleBarberCount: 1,
      hasSelectedSlot: true,
    }),
    true,
  );
});

test('genera el rango de fechas permitido incluyendo hoy y el horizonte configurado', () => {
  assert.equal(typeof bookingDomain.getBookingDateRange, 'function');
  if (typeof bookingDomain.getBookingDateRange !== 'function') return;

  assert.deepEqual(bookingDomain.getBookingDateRange('2026-08-18', 3), [
    '2026-08-18',
    '2026-08-19',
    '2026-08-20',
    '2026-08-21',
  ]);
});

test('agrupa los slots reales por mañana, tarde y noche conservando su orden', () => {
  assert.equal(typeof bookingDomain.groupAvailableSlotsByPeriod, 'function');
  if (typeof bookingDomain.groupAvailableSlotsByPeriod !== 'function') return;

  const slots = [
    { barberId: 'barber-a', startsAt: '2026-08-19T15:00:00.000Z', endsAt: 'x' },
    { barberId: 'barber-a', startsAt: '2026-08-19T20:00:00.000Z', endsAt: 'x' },
    { barberId: 'barber-a', startsAt: '2026-08-20T00:00:00.000Z', endsAt: 'x' },
  ];

  assert.deepEqual(
    bookingDomain.groupAvailableSlotsByPeriod(slots).map((group) => ({
      key: group.key,
      startsAt: group.slots.map((slot) => slot.startsAt),
    })),
    [
      { key: 'morning', startsAt: ['2026-08-19T15:00:00.000Z'] },
      { key: 'afternoon', startsAt: ['2026-08-19T20:00:00.000Z'] },
      { key: 'night', startsAt: ['2026-08-20T00:00:00.000Z'] },
    ],
  );
});

test('impide doble submit y construye un destino de éxito que reemplaza la confirmación', () => {
  assert.equal(typeof bookingDomain.canStartBookingSubmission, 'function');
  assert.equal(typeof bookingDomain.getCreatedReservationHref, 'function');
  if (
    typeof bookingDomain.canStartBookingSubmission !== 'function' ||
    typeof bookingDomain.getCreatedReservationHref !== 'function'
  ) {
    return;
  }

  assert.equal(
    bookingDomain.canStartBookingSubmission({
      isSubmitting: false,
      selectedServiceCount: 2,
      hasSelectedSlot: true,
    }),
    true,
  );
  assert.equal(
    bookingDomain.canStartBookingSubmission({
      isSubmitting: true,
      selectedServiceCount: 2,
      hasSelectedSlot: true,
    }),
    false,
  );
  assert.equal(
    bookingDomain.getCreatedReservationHref('3a6f42bc-3dbc-4efd-a12b-d20dc639f1a0'),
    '/reservations/3a6f42bc-3dbc-4efd-a12b-d20dc639f1a0?created=1',
  );
});
