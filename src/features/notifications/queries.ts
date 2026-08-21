import { supabase } from '@/infrastructure/supabase/client';

import {
  getNotificationHref,
  sortNotificationsNewestFirst,
  type ReservationNavigationContext,
} from './notifications-domain';
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

async function getReservationNavigationContexts(
  userId: string,
  reservationIds: string[],
): Promise<Map<string, ReservationNavigationContext>> {
  if (reservationIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('reservations')
    .select('id, barbershop_id, barber_id, client_id')
    .in('id', reservationIds);

  if (error) throw error;
  if (data.length === 0) return new Map();

  const barbershopIds = [...new Set(data.map((reservation) => reservation.barbershop_id))];
  const [membershipsResult, ownBarberProfiles] = await Promise.all([
    supabase
      .from('barbershop_memberships')
      .select('barbershop_id, role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('barbershop_id', barbershopIds),
    Promise.all(
      barbershopIds.map(async (barbershopId) => {
        const { data: ownProfile, error: ownProfileError } = await supabase
          .rpc('get_own_barber_profile', { p_barbershop_id: barbershopId })
          .maybeSingle();
        if (ownProfileError) throw ownProfileError;

        return [barbershopId, ownProfile?.is_active ? ownProfile.barber_id : null] as const;
      }),
    ),
  ]);

  if (membershipsResult.error) throw membershipsResult.error;

  const administeredBarbershopIds = new Set(
    membershipsResult.data
      .filter((membership) => membership.role === 'administrator')
      .map((membership) => membership.barbershop_id),
  );
  const ownActiveBarberIds = new Map(ownBarberProfiles);

  return new Map(
    data.map((reservation) => [
      reservation.id,
      {
        assignedBarberId: reservation.barber_id,
        barbershopId: reservation.barbershop_id,
        isAdmin: administeredBarbershopIds.has(reservation.barbershop_id),
        isClientOwner: reservation.client_id === userId,
        ownActiveBarberId: ownActiveBarberIds.get(reservation.barbershop_id) ?? null,
      },
    ]),
  );
}

export async function getNotifications(userId: string): Promise<UserNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_COLUMNS)
    .eq('user_id', userId)
    .is('dismissed_at', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  const reservationIds = [
    ...new Set(data.flatMap((notification) => notification.reservation_id ?? [])),
  ];
  const reservationContexts = await getReservationNavigationContexts(userId, reservationIds);

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
          type: notification.type,
          reservationId: notification.reservation_id,
          invitationId: notification.invitation_id,
        },
        reservationContexts,
      ),
    })),
  );
}

export async function getUnreadNotificationCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .is('dismissed_at', null);

  if (error) throw error;
  return count ?? 0;
}
