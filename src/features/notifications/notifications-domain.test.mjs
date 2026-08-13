import assert from 'node:assert/strict';
import test from 'node:test';

const domain = await import('./notifications-domain.ts').catch(() => ({}));

const notifications = [
  {
    id: 'older-unread',
    type: 'reservation_created',
    isRead: false,
    createdAt: '2026-08-12T10:00:00.000Z',
  },
  {
    id: 'newer-read',
    type: 'payment_confirmed',
    isRead: true,
    createdAt: '2026-08-13T10:00:00.000Z',
  },
];

test('mapea tipos existentes sin perder un fallback comprensible', () => {
  assert.equal(typeof domain.getNotificationTypeLabel, 'function');
  if (typeof domain.getNotificationTypeLabel !== 'function') return;

  assert.equal(domain.getNotificationTypeLabel('reservation_created'), 'Reserva');
  assert.equal(domain.getNotificationTypeLabel('yape_payment_pending'), 'Pago Yape');
  assert.equal(domain.getNotificationTypeLabel('payment_refunded'), 'Reembolso');
  assert.equal(domain.getNotificationTypeLabel('invitation_accepted'), 'Invitación aceptada');
  assert.equal(domain.getNotificationTypeLabel('invitation_rejected'), 'Invitación rechazada');
  assert.equal(domain.getNotificationTypeLabel('invitation_cancelled'), 'Invitación cancelada');
  assert.equal(domain.getNotificationTypeLabel('reservation_reminder'), 'Recordatorio');
  assert.equal(domain.getNotificationTypeLabel('future_event'), 'Actualización');
});

test('cuenta no leídas y ordena las más recientes primero', () => {
  assert.equal(typeof domain.countUnreadNotifications, 'function');
  assert.equal(typeof domain.sortNotificationsNewestFirst, 'function');
  if (
    typeof domain.countUnreadNotifications !== 'function' ||
    typeof domain.sortNotificationsNewestFirst !== 'function'
  ) {
    return;
  }

  assert.equal(domain.countUnreadNotifications(notifications), 1);
  assert.deepEqual(
    domain.sortNotificationsNewestFirst(notifications).map((notification) => notification.id),
    ['newer-read', 'older-unread'],
  );
});

test('ofrece únicamente la acción de lectura opuesta al estado actual', () => {
  assert.equal(typeof domain.getNotificationReadActions, 'function');
  if (typeof domain.getNotificationReadActions !== 'function') return;

  assert.deepEqual(domain.getNotificationReadActions(false), {
    canMarkRead: true,
    canMarkUnread: false,
  });
  assert.deepEqual(domain.getNotificationReadActions(true), {
    canMarkRead: false,
    canMarkUnread: true,
  });
});

test('solo crea navegación contextual hacia rutas seguras existentes', () => {
  assert.equal(typeof domain.getNotificationHref, 'function');
  if (typeof domain.getNotificationHref !== 'function') return;

  assert.equal(
    domain.getNotificationHref({ invitationId: 'invitation-a', reservationId: null }, new Set()),
    '/invitations',
  );
  assert.equal(
    domain.getNotificationHref(
      { invitationId: null, reservationId: 'reservation-own' },
      new Set(['reservation-own']),
    ),
    '/reservations/reservation-own',
  );
  assert.equal(
    domain.getNotificationHref(
      { invitationId: null, reservationId: 'reservation-staff' },
      new Set(),
    ),
    null,
  );
});
