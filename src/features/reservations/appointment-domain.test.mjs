import assert from 'node:assert/strict';
import test from 'node:test';

import { getReservationErrorMessage } from './errors.ts';

const domain = await import('./appointment-domain.ts').catch(() => ({}));

test('habilita transiciones operativas según estado y tolerancia', () => {
  assert.equal(typeof domain.getOperationalActions, 'function');
  if (typeof domain.getOperationalActions !== 'function') return;

  const beforeTolerance = new Date('2026-08-12T15:09:59.000Z');
  const afterTolerance = new Date('2026-08-12T15:10:00.000Z');
  const confirmed = {
    actorRole: 'barber',
    reservationStatus: 'confirmed',
    startsAt: '2026-08-12T15:00:00.000Z',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    isRefundEligible: false,
  };

  assert.deepEqual(domain.getOperationalActions(confirmed, beforeTolerance), {
    canStart: true,
    canComplete: false,
    canMarkNoShow: false,
    canConfirmCash: true,
    canConfirmYape: false,
    canRefund: false,
  });
  assert.equal(domain.getOperationalActions(confirmed, afterTolerance).canMarkNoShow, true);
  assert.equal(
    domain.getOperationalActions({ ...confirmed, reservationStatus: 'in_progress' }, afterTolerance)
      .canComplete,
    true,
  );
});

test('separa permisos de pago entre barbero y administrador', () => {
  assert.equal(typeof domain.getOperationalActions, 'function');
  if (typeof domain.getOperationalActions !== 'function') return;

  const yapePending = {
    reservationStatus: 'confirmed',
    startsAt: '2026-08-12T15:00:00.000Z',
    paymentMethod: 'yape',
    paymentStatus: 'pending',
    isRefundEligible: false,
  };

  assert.equal(
    domain.getOperationalActions({ ...yapePending, actorRole: 'barber' }).canConfirmYape,
    false,
  );
  assert.equal(
    domain.getOperationalActions({ ...yapePending, actorRole: 'administrator' }).canConfirmYape,
    true,
  );
  assert.equal(
    domain.getOperationalActions({
      ...yapePending,
      actorRole: 'administrator',
      paymentMethod: 'cash',
    }).canConfirmCash,
    true,
  );
});

test('muestra reembolso solo al administrador cuando los snapshots y el pago lo permiten', () => {
  assert.equal(typeof domain.getOperationalActions, 'function');
  if (typeof domain.getOperationalActions !== 'function') return;

  const refundable = {
    actorRole: 'administrator',
    reservationStatus: 'cancelled',
    startsAt: '2026-08-10T15:00:00.000Z',
    paymentMethod: 'yape',
    paymentStatus: 'paid',
    isRefundEligible: true,
  };

  assert.equal(domain.getOperationalActions(refundable).canRefund, true);
  assert.equal(
    domain.getOperationalActions({ ...refundable, actorRole: 'barber' }).canRefund,
    false,
  );
  assert.equal(
    domain.getOperationalActions({ ...refundable, isRefundEligible: false }).canRefund,
    false,
  );
  assert.equal(
    domain.getOperationalActions({ ...refundable, paymentStatus: 'pending' }).canRefund,
    false,
  );
});

test('filtra agenda por período, barbero, estado y pagos pendientes', () => {
  assert.equal(typeof domain.filterAgendaAppointments, 'function');
  if (typeof domain.filterAgendaAppointments !== 'function') return;

  const appointments = [
    {
      id: 'today-a',
      barberId: 'barber-a',
      startsAt: '2026-08-12T16:00:00.000Z',
      status: 'confirmed',
      payment: { status: 'pending' },
    },
    {
      id: 'future-b',
      barberId: 'barber-b',
      startsAt: '2026-08-13T16:00:00.000Z',
      status: 'confirmed',
      payment: { status: 'paid' },
    },
    {
      id: 'history-a',
      barberId: 'barber-a',
      startsAt: '2026-08-10T16:00:00.000Z',
      status: 'completed',
      payment: { status: 'pending' },
    },
  ];
  const now = new Date('2026-08-12T15:00:00.000Z');

  assert.deepEqual(
    domain
      .filterAgendaAppointments(
        appointments,
        {
          period: 'today',
          barberId: 'barber-a',
          status: 'confirmed',
          pendingPaymentsOnly: true,
        },
        now,
      )
      .map((appointment) => appointment.id),
    ['today-a'],
  );
  assert.deepEqual(
    domain
      .filterAgendaAppointments(
        appointments,
        {
          period: 'upcoming',
          barberId: null,
          status: null,
          pendingPaymentsOnly: false,
        },
        now,
      )
      .map((appointment) => appointment.id),
    ['future-b'],
  );
  assert.deepEqual(
    domain
      .filterAgendaAppointments(
        appointments,
        {
          period: 'history',
          barberId: null,
          status: null,
          pendingPaymentsOnly: true,
        },
        now,
      )
      .map((appointment) => appointment.id),
    ['history-a'],
  );
});

test('define la ventana de consulta por día de Lima antes de aplicar otros filtros', () => {
  const now = new Date('2026-08-12T15:00:00.000Z');

  assert.deepEqual(domain.getAgendaPeriodWindow('today', now), {
    startInclusive: '2026-08-12T05:00:00.000Z',
    endExclusive: '2026-08-13T05:00:00.000Z',
    ascending: true,
  });
  assert.deepEqual(domain.getAgendaPeriodWindow('upcoming', now), {
    startInclusive: '2026-08-13T05:00:00.000Z',
    endExclusive: null,
    ascending: true,
  });
  assert.deepEqual(domain.getAgendaPeriodWindow('history', now), {
    startInclusive: null,
    endExclusive: '2026-08-12T05:00:00.000Z',
    ascending: false,
  });
});

test('conserva todo el historial asignado y lo ordena del más reciente al más antiguo', () => {
  const now = new Date('2026-08-12T15:00:00.000Z');
  const appointments = [
    {
      id: 'completed-old',
      barberId: 'barber-a',
      startsAt: '2026-08-08T15:00:00.000Z',
      status: 'completed',
      payment: null,
    },
    {
      id: 'cancelled-recent',
      barberId: 'barber-a',
      startsAt: '2026-08-11T15:00:00.000Z',
      status: 'cancelled',
      payment: null,
    },
    {
      id: 'no-show-middle',
      barberId: 'barber-a',
      startsAt: '2026-08-10T15:00:00.000Z',
      status: 'no_show',
      payment: null,
    },
    {
      id: 'confirmed-past',
      barberId: 'barber-a',
      startsAt: '2026-08-09T15:00:00.000Z',
      status: 'confirmed',
      payment: null,
    },
    {
      id: 'other-barber',
      barberId: 'barber-b',
      startsAt: '2026-08-11T16:00:00.000Z',
      status: 'completed',
      payment: null,
    },
  ];

  const history = domain.filterAgendaAppointments(
    appointments,
    {
      period: 'history',
      barberId: 'barber-a',
      status: null,
      pendingPaymentsOnly: false,
    },
    now,
  );

  assert.deepEqual(
    history.map((appointment) => appointment.id),
    ['cancelled-recent', 'no-show-middle', 'confirmed-past', 'completed-old'],
  );
});

test('aplica el estado después del período sin mover citas entre vistas', () => {
  const now = new Date('2026-08-12T15:00:00.000Z');
  const appointments = [
    {
      id: 'past-completed',
      barberId: 'barber-a',
      startsAt: '2026-08-11T15:00:00.000Z',
      status: 'completed',
      payment: null,
    },
    {
      id: 'past-cancelled',
      barberId: 'barber-a',
      startsAt: '2026-08-10T15:00:00.000Z',
      status: 'cancelled',
      payment: null,
    },
    {
      id: 'today-no-show',
      barberId: 'barber-a',
      startsAt: '2026-08-12T14:00:00.000Z',
      status: 'no_show',
      payment: null,
    },
    {
      id: 'future-completed',
      barberId: 'barber-a',
      startsAt: '2026-08-13T15:00:00.000Z',
      status: 'completed',
      payment: null,
    },
  ];
  const baseFilters = {
    barberId: 'barber-a',
    pendingPaymentsOnly: false,
  };

  assert.deepEqual(
    domain
      .filterAgendaAppointments(
        appointments,
        { ...baseFilters, period: 'history', status: 'completed' },
        now,
      )
      .map((appointment) => appointment.id),
    ['past-completed'],
  );
  assert.deepEqual(
    domain
      .filterAgendaAppointments(
        appointments,
        { ...baseFilters, period: 'today', status: null },
        now,
      )
      .map((appointment) => appointment.id),
    ['today-no-show'],
  );
  assert.deepEqual(
    domain
      .filterAgendaAppointments(
        appointments,
        { ...baseFilters, period: 'upcoming', status: null },
        now,
      )
      .map((appointment) => appointment.id),
    ['future-completed'],
  );
});

test('el cliente solo puede cambiar un pago pendiente de una reserva no cancelada', () => {
  assert.equal(typeof domain.canClientChangePaymentMethod, 'function');
  if (typeof domain.canClientChangePaymentMethod !== 'function') return;

  assert.equal(domain.canClientChangePaymentMethod('confirmed', 'pending'), true);
  assert.equal(domain.canClientChangePaymentMethod('completed', 'pending'), true);
  assert.equal(domain.canClientChangePaymentMethod('cancelled', 'pending'), false);
  assert.equal(domain.canClientChangePaymentMethod('confirmed', 'paid'), false);
});

test('normaliza los datos opcionales de confirmación Yape y respeta sus límites', () => {
  assert.equal(typeof domain.validateYapeConfirmation, 'function');
  if (typeof domain.validateYapeConfirmation !== 'function') return;

  assert.deepEqual(domain.validateYapeConfirmation({ reference: '  OP-123 ', note: '  Listo  ' }), {
    values: { reference: 'OP-123', note: 'Listo' },
    errors: {},
  });
  assert.deepEqual(
    domain.validateYapeConfirmation({ reference: 'x'.repeat(121), note: 'x'.repeat(501) }),
    {
      values: null,
      errors: {
        reference: 'La referencia no puede superar 120 caracteres.',
        note: 'La nota no puede superar 500 caracteres.',
      },
    },
  );
});

test('traduce rechazos operativos sin exponer detalles internos', () => {
  assert.equal(
    getReservationErrorMessage({ message: 'The 10-minute tolerance period has not ended' }),
    'Aún no termina la tolerancia de 10 minutos para marcar que el cliente no asistió.',
  );
  assert.equal(
    getReservationErrorMessage({ message: 'Payment method is not Yape' }),
    'Este pago no está configurado como Yape.',
  );
  assert.equal(
    getReservationErrorMessage({ message: 'This reservation does not allow a refund' }),
    'La política snapshot de esta reserva no permite un reembolso.',
  );
});
