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

type NotificationLike = {
  isRead: boolean;
  createdAt: string;
};

type NotificationContext = {
  invitationId: string | null;
  reservationId: string | null;
};

export function getNotificationTypeLabel(type: string) {
  return NOTIFICATION_TYPE_LABELS[type] ?? 'Actualización';
}

export function countUnreadNotifications(notifications: readonly NotificationLike[]) {
  return notifications.reduce((count, notification) => count + (notification.isRead ? 0 : 1), 0);
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
  ownedReservationIds: ReadonlySet<string>,
) {
  if (notification.invitationId) return '/invitations';
  if (notification.reservationId && ownedReservationIds.has(notification.reservationId)) {
    return `/reservations/${notification.reservationId}`;
  }
  return null;
}
