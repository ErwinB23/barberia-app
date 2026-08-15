import type { Database } from '@/infrastructure/supabase/database.types';

type ReservationStatus = Database['public']['Enums']['reservation_status'];
type PaymentMethod = Database['public']['Enums']['payment_method'];
type PaymentStatus = Database['public']['Enums']['payment_status'];

type ActionableReservation = {
  status: ReservationStatus;
  startsAt: string;
};

type ReschedulableReservation = ActionableReservation & {
  rescheduleCount: number;
};

type GroupableReservation = ActionableReservation & {
  id: string;
};

type ReservationDescriptionSnapshots = {
  barbershop_name_snapshot: string;
  barber_display_name_snapshot: string;
};

type ReservationServiceDescriptionSnapshots = {
  service_name_snapshot: string;
  style_name_snapshot: string | null;
};

const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  confirmed: 'Confirmada',
  in_progress: 'En atención',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  refunded: 'Reembolsado',
  failed: 'Fallido',
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  yape: 'Yape',
};

export function getReservationStatusLabel(status: ReservationStatus) {
  return RESERVATION_STATUS_LABELS[status];
}

export function getPaymentStatusLabel(status: PaymentStatus) {
  return PAYMENT_STATUS_LABELS[status];
}

export function getPaymentMethodLabel(method: PaymentMethod) {
  return PAYMENT_METHOD_LABELS[method];
}

export function mapReservationDescriptionSnapshots(row: ReservationDescriptionSnapshots) {
  return {
    barbershopName: row.barbershop_name_snapshot,
    barberName: row.barber_display_name_snapshot,
  };
}

export function mapReservationServiceDescriptionSnapshots(
  row: ReservationServiceDescriptionSnapshots,
) {
  return {
    serviceName: row.service_name_snapshot,
    styleName: row.style_name_snapshot,
  };
}

export function canCancelReservation(reservation: ActionableReservation, now = new Date()) {
  return (
    reservation.status === 'confirmed' && new Date(reservation.startsAt).getTime() > now.getTime()
  );
}

export function canRescheduleReservation(reservation: ReschedulableReservation, now = new Date()) {
  return reservation.rescheduleCount < 1 && canCancelReservation(reservation, now);
}

export function groupClientReservations<T extends GroupableReservation>(
  reservations: T[],
  now = new Date(),
) {
  const upcoming: T[] = [];
  const history: T[] = [];

  for (const reservation of reservations) {
    const isUpcoming =
      reservation.status === 'in_progress' ||
      (reservation.status === 'confirmed' &&
        new Date(reservation.startsAt).getTime() >= now.getTime());
    (isUpcoming ? upcoming : history).push(reservation);
  }

  upcoming.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  history.sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  return { upcoming, history };
}
