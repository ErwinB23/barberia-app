import type { PaymentMethod, PaymentStatus, ReservationStatus } from './types';

export type OperationalRole = 'barber' | 'administrator';
export type AgendaPeriod = 'today' | 'upcoming' | 'history';

export type AgendaPeriodWindow = {
  startInclusive: string | null;
  endExclusive: string | null;
  ascending: boolean;
};

type OperationalActionInput = {
  actorRole: OperationalRole;
  reservationStatus: ReservationStatus;
  startsAt: string;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus | null;
  isRefundEligible: boolean;
};

export type OperationalActions = {
  canStart: boolean;
  canComplete: boolean;
  canMarkNoShow: boolean;
  canConfirmCash: boolean;
  canConfirmYape: boolean;
  canRefund: boolean;
};

export type BarberAppointmentControls = {
  primaryAction: 'start' | 'complete' | null;
  canMarkNoShow: boolean;
  canConfirmCash: boolean;
  paymentGuidance: string | null;
};

type FilterableAppointment = {
  id: string;
  barberId: string;
  startsAt: string;
  status: ReservationStatus;
  payment: { method?: PaymentMethod; status: PaymentStatus } | null;
};

export type AgendaFilters = {
  period: AgendaPeriod;
  barberId: string | null;
  status: ReservationStatus | null;
  paymentStatus: PaymentStatus | null;
  paymentMethod: PaymentMethod | null;
  pendingPaymentsOnly?: boolean;
};

export type YapeConfirmationFormValues = {
  reference: string;
  note: string;
};

export type YapeConfirmationFormErrors = Partial<Record<keyof YapeConfirmationFormValues, string>>;

const PAYMENT_CONFIRMABLE_STATUSES: readonly ReservationStatus[] = [
  'confirmed',
  'in_progress',
  'completed',
];

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function getLimaDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Lima',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getAgendaPeriodWindow(period: AgendaPeriod, now = new Date()): AgendaPeriodWindow {
  const limaDayStart = new Date(`${getLimaDateKey(now)}T00:00:00-05:00`);
  const nextLimaDayStart = new Date(limaDayStart.getTime() + MILLISECONDS_PER_DAY);

  if (period === 'today') {
    return {
      startInclusive: limaDayStart.toISOString(),
      endExclusive: nextLimaDayStart.toISOString(),
      ascending: true,
    };
  }

  if (period === 'upcoming') {
    return {
      startInclusive: nextLimaDayStart.toISOString(),
      endExclusive: null,
      ascending: true,
    };
  }

  return {
    startInclusive: null,
    endExclusive: limaDayStart.toISOString(),
    ascending: false,
  };
}

export function getOperationalActions(
  input: OperationalActionInput,
  now = new Date(),
): OperationalActions {
  const isPaymentConfirmable = PAYMENT_CONFIRMABLE_STATUSES.includes(input.reservationStatus);
  const isPendingPayment = input.paymentStatus === 'pending';
  const hasNoShowToleranceEnded =
    now.getTime() >= new Date(input.startsAt).getTime() + 10 * 60 * 1000;

  return {
    canStart: input.reservationStatus === 'confirmed',
    canComplete: input.reservationStatus === 'in_progress',
    canMarkNoShow: input.reservationStatus === 'confirmed' && hasNoShowToleranceEnded,
    canConfirmCash: input.paymentMethod === 'cash' && isPendingPayment && isPaymentConfirmable,
    canConfirmYape:
      input.actorRole === 'administrator' &&
      input.paymentMethod === 'yape' &&
      isPendingPayment &&
      isPaymentConfirmable,
    canRefund:
      input.actorRole === 'administrator' &&
      input.reservationStatus === 'cancelled' &&
      input.isRefundEligible &&
      input.paymentStatus === 'paid',
  };
}

export function getBarberAppointmentControls(
  actions: OperationalActions,
  paymentMethod: PaymentMethod | null,
  paymentStatus: PaymentStatus | null,
): BarberAppointmentControls {
  return {
    primaryAction: actions.canStart ? 'start' : actions.canComplete ? 'complete' : null,
    canMarkNoShow: actions.canMarkNoShow,
    canConfirmCash: actions.canConfirmCash,
    paymentGuidance:
      paymentMethod === 'yape' && paymentStatus === 'pending'
        ? 'Confirmación pendiente del administrador.'
        : null,
  };
}

export function getAgendaEmptyStateCopy(period: AgendaPeriod, hasActiveStatusFilter = false) {
  if (hasActiveStatusFilter) {
    return {
      title: 'Sin citas con este estado',
      description: 'Prueba otro filtro para consultar tu agenda.',
    };
  }
  if (period === 'today') {
    return { title: 'Sin citas para hoy', description: 'Tu jornada está libre por ahora.' };
  }
  if (period === 'upcoming') {
    return {
      title: 'No tienes próximas citas programadas',
      description: 'Las nuevas reservas aparecerán aquí.',
    };
  }
  return {
    title: 'Aún no tienes citas anteriores',
    description: 'Tu historial se mostrará aquí después de cada jornada.',
  };
}

function matchesPeriod(appointment: FilterableAppointment, period: AgendaPeriod, now: Date) {
  const appointmentDate = getLimaDateKey(new Date(appointment.startsAt));
  const today = getLimaDateKey(now);

  if (period === 'today') return appointmentDate === today;
  if (period === 'history') return appointmentDate < today;
  return appointmentDate > today;
}

export function filterAgendaAppointments<T extends FilterableAppointment>(
  appointments: readonly T[],
  filters: AgendaFilters,
  now = new Date(),
) {
  const paymentStatus = filters.paymentStatus ?? (filters.pendingPaymentsOnly ? 'pending' : null);
  const filtered = appointments.filter(
    (appointment) =>
      matchesPeriod(appointment, filters.period, now) &&
      (!filters.barberId || appointment.barberId === filters.barberId) &&
      (!filters.status || appointment.status === filters.status) &&
      (!paymentStatus || appointment.payment?.status === paymentStatus) &&
      (!filters.paymentMethod || appointment.payment?.method === filters.paymentMethod),
  );

  return filtered.sort((left, right) => {
    const direction = filters.period === 'history' ? -1 : 1;
    return direction * left.startsAt.localeCompare(right.startsAt);
  });
}

export function hasSecondaryAgendaFilters(filters: AgendaFilters) {
  return Boolean(
    filters.barberId ||
    filters.status ||
    filters.paymentStatus ||
    filters.paymentMethod ||
    filters.pendingPaymentsOnly,
  );
}

export function clearSecondaryAgendaFilters(filters: AgendaFilters): AgendaFilters {
  return {
    period: filters.period,
    barberId: null,
    status: null,
    paymentStatus: null,
    paymentMethod: null,
  };
}

export function canClientChangePaymentMethod(
  reservationStatus: ReservationStatus,
  paymentStatus: PaymentStatus,
) {
  return reservationStatus !== 'cancelled' && paymentStatus === 'pending';
}

export function validateYapeConfirmation(values: YapeConfirmationFormValues): {
  values: YapeConfirmationFormValues | null;
  errors: YapeConfirmationFormErrors;
} {
  const normalized = {
    reference: values.reference.trim(),
    note: values.note.trim(),
  };
  const errors: YapeConfirmationFormErrors = {};

  if (normalized.reference.length > 120) {
    errors.reference = 'La referencia no puede superar 120 caracteres.';
  }
  if (normalized.note.length > 500) {
    errors.note = 'La nota no puede superar 500 caracteres.';
  }

  return Object.keys(errors).length > 0 ? { values: null, errors } : { values: normalized, errors };
}
