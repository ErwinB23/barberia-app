import type { PaymentMethod, PaymentStatus, ReservationStatus } from './types';

export type OperationalRole = 'barber' | 'administrator';
export type AgendaPeriod = 'today' | 'upcoming' | 'history';

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

type FilterableAppointment = {
  id: string;
  barberId: string;
  startsAt: string;
  status: ReservationStatus;
  payment: { status: PaymentStatus } | null;
};

export type AgendaFilters = {
  period: AgendaPeriod;
  barberId: string | null;
  status: ReservationStatus | null;
  pendingPaymentsOnly: boolean;
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

const HISTORY_STATUSES: readonly ReservationStatus[] = ['completed', 'cancelled', 'no_show'];

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

function matchesPeriod(appointment: FilterableAppointment, period: AgendaPeriod, now: Date) {
  const appointmentDate = getLimaDateKey(new Date(appointment.startsAt));
  const today = getLimaDateKey(now);

  if (period === 'today') return appointmentDate === today;
  if (period === 'history') {
    return appointmentDate < today || HISTORY_STATUSES.includes(appointment.status);
  }
  return appointmentDate > today && !HISTORY_STATUSES.includes(appointment.status);
}

export function filterAgendaAppointments<T extends FilterableAppointment>(
  appointments: readonly T[],
  filters: AgendaFilters,
  now = new Date(),
) {
  const filtered = appointments.filter(
    (appointment) =>
      matchesPeriod(appointment, filters.period, now) &&
      (!filters.barberId || appointment.barberId === filters.barberId) &&
      (!filters.status || appointment.status === filters.status) &&
      (!filters.pendingPaymentsOnly || appointment.payment?.status === 'pending'),
  );

  return filtered.sort((left, right) => {
    const direction = filters.period === 'history' ? -1 : 1;
    return direction * left.startsAt.localeCompare(right.startsAt);
  });
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
