import { getOwnBarberProfile } from '@/features/barbers/queries';
import {
  getBarbershopPublicationReadiness,
  getOwnBarbershopMembership,
} from '@/features/barbershops/queries';
import { getUnreadNotificationCount } from '@/features/notifications/queries';
import { getAgendaPeriodWindow } from '@/features/reservations/appointment-domain';
import { supabase } from '@/infrastructure/supabase/client';

import { loadAdminHomeData } from './admin-home-domain';
import type { AdminHomeAppointment, AdminHomeTodayAppointment } from './types';

const UPCOMING_RESERVATION_COLUMNS =
  'id, barbershop_id, barber_id, barber_display_name_snapshot, starts_at, ends_at, status';

async function getAdminHomeTodayAppointments(
  barbershopId: string,
  now: Date,
): Promise<AdminHomeTodayAppointment[]> {
  const window = getAgendaPeriodWindow('today', now);
  const { data, error } = await supabase
    .from('reservations')
    .select('id, barbershop_id, starts_at, ends_at, status')
    .eq('barbershop_id', barbershopId)
    .gte('starts_at', window.startInclusive!)
    .lt('starts_at', window.endExclusive!)
    .order('starts_at');

  if (error) throw error;
  return data.map((reservation) => ({
    id: reservation.id,
    barbershopId: reservation.barbershop_id,
    startsAt: reservation.starts_at,
    endsAt: reservation.ends_at,
    status: reservation.status,
  }));
}

async function getReservationServiceNames(barbershopId: string, reservationIds: string[]) {
  if (reservationIds.length === 0) return new Map<string, string[]>();

  const { data, error } = await supabase
    .from('reservation_services')
    .select('reservation_id, service_name_snapshot')
    .eq('barbershop_id', barbershopId)
    .in('reservation_id', reservationIds)
    .order('created_at');

  if (error) throw error;

  const namesByReservation = new Map<string, string[]>();
  for (const item of data) {
    const names = namesByReservation.get(item.reservation_id) ?? [];
    names.push(item.service_name_snapshot);
    namesByReservation.set(item.reservation_id, names);
  }
  return namesByReservation;
}

async function getReservationClientNames(reservationIds: string[]) {
  const contacts = await Promise.all(
    reservationIds.map(async (reservationId) => {
      const { data, error } = await supabase
        .rpc('get_reservation_client_contact', { p_reservation_id: reservationId })
        .maybeSingle();

      if (error) throw error;
      return [reservationId, data?.full_name ?? null] as const;
    }),
  );

  return new Map(contacts);
}

async function getAdminHomeUpcomingAppointments(
  barbershopId: string,
  now: Date,
): Promise<AdminHomeAppointment[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select(UPCOMING_RESERVATION_COLUMNS)
    .eq('barbershop_id', barbershopId)
    .in('status', ['confirmed', 'in_progress'])
    .gt('ends_at', now.toISOString())
    .order('starts_at')
    .limit(4);

  if (error) throw error;

  const reservationIds = data.map(({ id }) => id);
  const [serviceNames, clientNames] = await Promise.all([
    getReservationServiceNames(barbershopId, reservationIds),
    getReservationClientNames(reservationIds),
  ]);

  return data.map((reservation) => ({
    id: reservation.id,
    barbershopId: reservation.barbershop_id,
    barberId: reservation.barber_id,
    barberName: reservation.barber_display_name_snapshot,
    clientName: clientNames.get(reservation.id) ?? null,
    serviceNames: serviceNames.get(reservation.id) ?? [],
    startsAt: reservation.starts_at,
    endsAt: reservation.ends_at,
    status: reservation.status,
  }));
}

async function getAdminPendingYapeCount(barbershopId: string) {
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('reservation_id')
    .eq('barbershop_id', barbershopId)
    .eq('method', 'yape')
    .eq('status', 'pending');

  if (paymentsError) throw paymentsError;
  if (payments.length === 0) return 0;

  const { count, error } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('barbershop_id', barbershopId)
    .in(
      'id',
      payments.map(({ reservation_id }) => reservation_id),
    )
    .in('status', ['confirmed', 'in_progress', 'completed']);

  if (error) throw error;
  return count ?? 0;
}

async function getAdminPendingInvitationCount(barbershopId: string) {
  const { count, error } = await supabase
    .from('barbershop_invitations')
    .select('id', { count: 'exact', head: true })
    .eq('barbershop_id', barbershopId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString());

  if (error) throw error;
  return count ?? 0;
}

export async function getAdminHomeData(input: {
  userId: string;
  barbershopId: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();

  return loadAdminHomeData(
    {
      getContext: () => getOwnBarbershopMembership(input.userId, input.barbershopId),
      getTodayAppointments: () => getAdminHomeTodayAppointments(input.barbershopId, now),
      getUpcomingAppointments: () => getAdminHomeUpcomingAppointments(input.barbershopId, now),
      getPendingYapeCount: () => getAdminPendingYapeCount(input.barbershopId),
      getPendingInvitationCount: () => getAdminPendingInvitationCount(input.barbershopId),
      getPublicationReadiness: (membership) =>
        getBarbershopPublicationReadiness(membership.barbershop),
      getUnreadNotificationCount: () => getUnreadNotificationCount(input.userId),
      getOwnBarberProfile: () => getOwnBarberProfile(input.barbershopId),
    },
    input.barbershopId,
    now,
  );
}
