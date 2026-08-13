import { supabase } from '@/infrastructure/supabase/client';

import { getNotificationHref, sortNotificationsNewestFirst } from './notifications-domain';
import type { UserNotification } from './types';

const NOTIFICATION_COLUMNS = `
  id,
  type,
  title,
  message,
  is_read,
  read_at,
  created_at,
  barbershop_id,
  reservation_id,
  payment_id,
  invitation_id
`;

async function getOwnedReservationIds(userId: string, reservationIds: string[]) {
  if (reservationIds.length === 0) return new Set<string>();

  const { data, error } = await supabase
    .from('reservations')
    .select('id')
    .eq('client_id', userId)
    .in('id', reservationIds);

  if (error) throw error;
  return new Set(data.map((reservation) => reservation.id));
}

export async function getNotifications(userId: string): Promise<UserNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  const reservationIds = [
    ...new Set(data.flatMap((notification) => notification.reservation_id ?? [])),
  ];
  const ownedReservationIds = await getOwnedReservationIds(userId, reservationIds);

  return sortNotificationsNewestFirst(
    data.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.is_read,
      readAt: notification.read_at,
      createdAt: notification.created_at,
      barbershopId: notification.barbershop_id,
      reservationId: notification.reservation_id,
      paymentId: notification.payment_id,
      invitationId: notification.invitation_id,
      href: getNotificationHref(
        {
          reservationId: notification.reservation_id,
          invitationId: notification.invitation_id,
        },
        ownedReservationIds,
      ),
    })),
  );
}

export async function getUnreadNotificationCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count ?? 0;
}
