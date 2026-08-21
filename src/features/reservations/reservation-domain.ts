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

type ReservationServiceSummaryItem = {
  serviceName: string;
  styleName: string | null;
};

type RescheduleReviewSource = {
  startsAt: string;
  barberName: string;
  items: ReservationServiceSummaryItem[];
};

type RescheduleReviewTarget = {
  startsAt: string;
  barberName: string;
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

export function getReservationServiceSummary(
  items: ReservationServiceSummaryItem[],
  visibleLimit = 2,
) {
  if (items.length === 0) return 'Servicios de la reserva';

  const visibleItems = items
    .slice(0, visibleLimit)
    .map((item) => (item.styleName ? `${item.serviceName} (${item.styleName})` : item.serviceName));
  const hiddenCount = items.length - visibleItems.length;

  return hiddenCount > 0
    ? `${visibleItems.join(', ')} y ${hiddenCount} más`
    : visibleItems.join(', ');
}

export function buildRescheduleReview(
  current: RescheduleReviewSource,
  next: RescheduleReviewTarget,
) {
  return {
    current: { startsAt: current.startsAt, barberName: current.barberName },
    next,
    services: current.items,
  };
}

export function getCancellationPolicyMessage({
  isLateCancellation,
  isLateReschedule = false,
  isRefundEligible,
  paymentStatus,
}: {
  isLateCancellation: boolean;
  isLateReschedule?: boolean;
  isRefundEligible: boolean;
  paymentStatus: PaymentStatus | null;
}) {
  if (isLateCancellation && !isRefundEligible) {
    return 'La cancelación fue tardía y la política guardada para esta reserva no permite reembolso.';
  }
  if (isLateCancellation && isRefundEligible) {
    return 'La cancelación fue tardía, pero la política guardada permite solicitar el reembolso. La barbería debe procesarlo.';
  }
  if (isLateReschedule && !isRefundEligible) {
    return 'Una reprogramación tardía conservó la política sin reembolso para esta reserva.';
  }
  if (paymentStatus === 'refunded') return 'El pago de esta reserva ya fue reembolsado.';
  if (paymentStatus === 'paid') {
    return 'La cancelación no fue tardía. La barbería debe procesar el reembolso si aún figura pendiente.';
  }
  return 'La cancelación no fue tardía. No se registró un pago confirmado por reembolsar.';
}

export function getClientReservationHref(reservationId: string) {
  return `/reservations/${encodeURIComponent(reservationId)}` as const;
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
