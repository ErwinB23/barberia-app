const NOTIFICATION_TYPE_LABELS: Readonly<Record<string, string>> = {
  reservation_created: 'Reserva',
  reservation_rescheduled: 'Reserva',
  reservation_cancelled: 'Reserva',
  yape_payment_pending: 'Pago Yape',
  payment_confirmed: 'Pago',
  payment_refunded: 'Reembolso',
  refund_required: 'Reembolso',
  invitation_received: 'Invitación',
  invitation_accepted: 'Invitación aceptada',
  invitation_rejected: 'Invitación rechazada',
  invitation_cancelled: 'Invitación cancelada',
  barbershop_invitation: 'Invitación',
  reservation_reminder: 'Recordatorio',
};

export const NOTIFICATIONS_EMPTY_STATE = {
  title: 'No tienes notificaciones nuevas',
  description: 'Cuando haya novedades sobre tus reservas o espacios, las encontrarás aquí.',
} as const;

type NotificationLike = {
  isRead: boolean;
  createdAt: string;
};

type IdentifiableNotification = {
  id: string;
};

type NotificationContext = {
  invitationId: string | null;
  reservationId: string | null;
  type: string;
};

type NotificationPresentationContext = NotificationContext & {
  paymentId: string | null;
};

export type NotificationPresentationKind =
  'general' | 'invitation' | 'payment' | 'reminder' | 'reservation';

export type ReservationNavigationContext = {
  assignedBarberId: string;
  barbershopId: string;
  isAdmin: boolean;
  isClientOwner: boolean;
  ownActiveBarberId: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CLIENT_RESERVATION_TYPES = new Set([
  'reservation_created',
  'reservation_rescheduled',
  'reservation_cancelled',
  'payment_confirmed',
  'payment_refunded',
  'reservation_reminder',
]);

const BARBER_RESERVATION_TYPES = new Set([
  'reservation_created',
  'reservation_rescheduled',
  'reservation_cancelled',
]);

const ADMIN_RESERVATION_TYPES = new Set([
  ...BARBER_RESERVATION_TYPES,
  'yape_payment_pending',
  'payment_confirmed',
  'payment_refunded',
  'refund_required',
]);

export function getNotificationTypeLabel(type: string) {
  return NOTIFICATION_TYPE_LABELS[type] ?? 'Actualización';
}

export function getNotificationPresentation(notification: NotificationPresentationContext): {
  kind: NotificationPresentationKind;
  label: string;
  contextLabel: string | null;
} {
  const label = getNotificationTypeLabel(notification.type);

  if (notification.invitationId) {
    return { kind: 'invitation', label, contextLabel: 'Invitación de equipo' };
  }

  if (notification.type === 'reservation_reminder') {
    return {
      kind: 'reminder',
      label,
      contextLabel: notification.reservationId ? 'Próxima cita' : null,
    };
  }

  if (notification.paymentId || label.includes('Pago') || label === 'Reembolso') {
    return {
      kind: 'payment',
      label,
      contextLabel: notification.reservationId ? 'Pago de una cita' : 'Pago relacionado',
    };
  }

  return notification.reservationId
    ? { kind: 'reservation', label, contextLabel: 'Cita relacionada' }
    : { kind: 'general', label, contextLabel: null };
}

export function countUnreadNotifications(notifications: readonly NotificationLike[]) {
  return notifications.reduce((count, notification) => count + (notification.isRead ? 0 : 1), 0);
}

export function excludeNotificationsById<T extends IdentifiableNotification>(
  notifications: readonly T[],
  excludedIds: ReadonlySet<string>,
): T[] {
  if (excludedIds.size === 0) return [...notifications];
  return notifications.filter((notification) => !excludedIds.has(notification.id));
}

export function sortNotificationsNewestFirst<T extends NotificationLike>(
  notifications: readonly T[],
): T[] {
  return [...notifications].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export function getNotificationReadActions(isRead: boolean) {
  return {
    canMarkRead: !isRead,
    canMarkUnread: isRead,
  };
}

export function getNotificationHref(
  notification: NotificationContext,
  reservationContexts: ReadonlyMap<string, ReservationNavigationContext>,
) {
  if (notification.invitationId) return '/invitations';

  const reservationId = notification.reservationId;
  if (!reservationId || !UUID_PATTERN.test(reservationId)) return null;

  const context = reservationContexts.get(reservationId);
  if (!context || !UUID_PATTERN.test(context.barbershopId)) return null;

  if (context.isClientOwner && CLIENT_RESERVATION_TYPES.has(notification.type)) {
    return `/reservations/${reservationId}`;
  }

  const isAssignedBarber =
    context.ownActiveBarberId === context.assignedBarberId &&
    UUID_PATTERN.test(context.assignedBarberId);
  if (isAssignedBarber && BARBER_RESERVATION_TYPES.has(notification.type)) {
    return `/barbershops/${context.barbershopId}/barbers/${context.assignedBarberId}/appointments/${reservationId}`;
  }

  if (context.isAdmin && ADMIN_RESERVATION_TYPES.has(notification.type)) {
    return `/barbershops/${context.barbershopId}/appointments/${reservationId}`;
  }

  return null;
}
