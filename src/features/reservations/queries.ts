import { supabase } from '@/infrastructure/supabase/client';
import type { Database } from '@/infrastructure/supabase/database.types';

import type {
  AppointmentBarberOption,
  ClientReservation,
  ClientReservationItem,
  ClientReservationPayment,
  ClientYapeSettings,
  OperationalAgenda,
  OperationalAppointment,
  OperationalRole,
} from './types';
import {
  mapReservationDescriptionSnapshots,
  mapReservationServiceDescriptionSnapshots,
} from './reservation-domain';

type ReservationRow = Database['public']['Tables']['reservations']['Row'];

const RESERVATION_COLUMNS =
  'id, barbershop_id, barbershop_name_snapshot, barber_id, barber_display_name_snapshot, starts_at, ends_at, status, total_price, total_duration_minutes, reschedule_count, is_late_reschedule, is_late_cancellation, is_refund_eligible, refund_policy_at_late_action, cancelled_at';

async function getReservationRows(userId: string, reservationId?: string) {
  let query = supabase
    .from('reservations')
    .select(RESERVATION_COLUMNS)
    .eq('client_id', userId)
    .order('starts_at', { ascending: false });

  if (reservationId) query = query.eq('id', reservationId);

  const { data, error } = await query;
  if (error) throw error;
  return data as Pick<
    ReservationRow,
    | 'id'
    | 'barbershop_id'
    | 'barbershop_name_snapshot'
    | 'barber_id'
    | 'barber_display_name_snapshot'
    | 'starts_at'
    | 'ends_at'
    | 'status'
    | 'total_price'
    | 'total_duration_minutes'
    | 'reschedule_count'
    | 'is_late_reschedule'
    | 'is_late_cancellation'
    | 'is_refund_eligible'
    | 'refund_policy_at_late_action'
    | 'cancelled_at'
  >[];
}

async function getReservationItems(reservationIds: string[]) {
  if (reservationIds.length === 0) return new Map<string, ClientReservationItem[]>();

  const { data, error } = await supabase
    .from('reservation_services')
    .select(
      'id, reservation_id, service_id, service_name_snapshot, style_id, style_name_snapshot, price_at_booking, duration_at_booking',
    )
    .in('reservation_id', reservationIds)
    .order('created_at');
  if (error) throw error;
  const itemsByReservation = new Map<string, ClientReservationItem[]>();

  for (const item of data) {
    const items = itemsByReservation.get(item.reservation_id) ?? [];
    const description = mapReservationServiceDescriptionSnapshots(item);
    items.push({
      id: item.id,
      serviceId: item.service_id,
      serviceName: description.serviceName,
      styleId: item.style_id,
      styleName: description.styleName,
      priceAtBooking: Number(item.price_at_booking),
      durationAtBooking: item.duration_at_booking,
    });
    itemsByReservation.set(item.reservation_id, items);
  }
  return itemsByReservation;
}

async function getReservationPayments(reservationIds: string[]) {
  if (reservationIds.length === 0) return new Map<string, ClientReservationPayment>();

  const { data, error } = await supabase
    .from('payments')
    .select('id, reservation_id, method, status, amount, confirmed_at, refunded_at')
    .in('reservation_id', reservationIds);
  if (error) throw error;

  return new Map(
    data.map((payment) => [
      payment.reservation_id,
      {
        id: payment.id,
        method: payment.method,
        status: payment.status,
        amount: Number(payment.amount),
        confirmedAt: payment.confirmed_at,
        refundedAt: payment.refunded_at,
      },
    ]),
  );
}

async function enrichReservations(
  rows: Awaited<ReturnType<typeof getReservationRows>>,
): Promise<ClientReservation[]> {
  const reservationIds = rows.map((row) => row.id);
  const [itemsByReservation, paymentsByReservation] = await Promise.all([
    getReservationItems(reservationIds),
    getReservationPayments(reservationIds),
  ]);

  return rows.map((row) => {
    const description = mapReservationDescriptionSnapshots(row);
    return {
      id: row.id,
      barbershopId: row.barbershop_id,
      barbershopName: description.barbershopName,
      barberId: row.barber_id,
      barberName: description.barberName,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: row.status,
      totalPrice: Number(row.total_price),
      totalDurationMinutes: row.total_duration_minutes,
      rescheduleCount: row.reschedule_count,
      isLateReschedule: row.is_late_reschedule,
      isLateCancellation: row.is_late_cancellation,
      isRefundEligible: row.is_refund_eligible,
      refundPolicy: row.refund_policy_at_late_action,
      cancelledAt: row.cancelled_at,
      items: itemsByReservation.get(row.id) ?? [],
      payment: paymentsByReservation.get(row.id) ?? null,
      yapeSettings: null,
    };
  });
}

export async function getClientReservations(userId: string) {
  return enrichReservations(await getReservationRows(userId));
}

export async function getClientReservation(userId: string, reservationId: string) {
  const reservations = await enrichReservations(await getReservationRows(userId, reservationId));
  const reservation = reservations[0];
  if (!reservation || reservation.payment?.method !== 'yape') return reservation ?? null;

  const { data, error } = await supabase
    .rpc('get_reservation_yape_settings', { p_reservation_id: reservation.id })
    .maybeSingle();
  if (error) throw error;

  const yapeSettings: ClientYapeSettings | null = data
    ? {
        holderName: data.yape_holder_name,
        phone: data.yape_phone,
        qrUrl: data.yape_qr_url,
      }
    : null;
  return { ...reservation, yapeSettings };
}

async function getOperationalRole(
  userId: string,
  barbershopId: string,
  barberId: string | null,
): Promise<OperationalRole | null> {
  const { data: membership, error: membershipError } = await supabase
    .from('barbershop_memberships')
    .select('role')
    .eq('barbershop_id', barbershopId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (membershipError) throw membershipError;

  if (!membership) return null;
  if (!barberId) return membership.role === 'administrator' ? 'administrator' : null;

  const { data: ownProfile, error: ownProfileError } = await supabase
    .rpc('get_own_barber_profile', { p_barbershop_id: barbershopId })
    .maybeSingle();
  if (ownProfileError) throw ownProfileError;

  return ownProfile?.barber_id === barberId && ownProfile.is_active ? 'barber' : null;
}

async function getOperationalRows(barbershopId: string, barberId: string | null, id?: string) {
  let query = supabase
    .from('reservations')
    .select(RESERVATION_COLUMNS)
    .eq('barbershop_id', barbershopId)
    .order('starts_at', { ascending: false })
    .limit(300);

  if (barberId) query = query.eq('barber_id', barberId);
  if (id) query = query.eq('id', id);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function getReservationClientContacts(reservationIds: string[]) {
  const contacts = await Promise.all(
    reservationIds.map(async (reservationId) => {
      const { data, error } = await supabase
        .rpc('get_reservation_client_contact', { p_reservation_id: reservationId })
        .maybeSingle();
      if (error) throw error;

      return [
        reservationId,
        {
          fullName: data?.full_name ?? null,
          phone: data?.phone ?? null,
        },
      ] as const;
    }),
  );

  return new Map(contacts);
}

async function enrichOperationalAppointments(
  rows: Awaited<ReturnType<typeof getOperationalRows>>,
): Promise<OperationalAppointment[]> {
  const reservationIds = rows.map((row) => row.id);
  const [itemsByReservation, paymentsByReservation, contactsByReservation] = await Promise.all([
    getReservationItems(reservationIds),
    getReservationPayments(reservationIds),
    getReservationClientContacts(reservationIds),
  ]);

  return rows.map((row) => {
    const description = mapReservationDescriptionSnapshots(row);
    return {
      id: row.id,
      barbershopId: row.barbershop_id,
      barbershopName: description.barbershopName,
      barberId: row.barber_id,
      barberName: description.barberName,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: row.status,
      totalPrice: Number(row.total_price),
      totalDurationMinutes: row.total_duration_minutes,
      isRefundEligible: row.is_refund_eligible,
      clientContact: contactsByReservation.get(row.id) ?? { fullName: null, phone: null },
      items: itemsByReservation.get(row.id) ?? [],
      payment: paymentsByReservation.get(row.id) ?? null,
    };
  });
}

async function getAppointmentBarbers(
  barbershopId: string,
  barberId: string | null,
): Promise<AppointmentBarberOption[]> {
  let query = supabase
    .from('barbers')
    .select('id, display_name')
    .eq('barbershop_id', barbershopId)
    .order('display_name');

  if (barberId) query = query.eq('id', barberId);

  const { data, error } = await query;
  if (error) throw error;
  return data.map((barber) => ({ id: barber.id, displayName: barber.display_name }));
}

export async function getOperationalAgenda(input: {
  userId: string;
  barbershopId: string;
  barberId: string | null;
}): Promise<OperationalAgenda | null> {
  const role = await getOperationalRole(input.userId, input.barbershopId, input.barberId);
  if (!role) return null;

  const [appointments, barbers] = await Promise.all([
    getOperationalRows(input.barbershopId, input.barberId).then(enrichOperationalAppointments),
    getAppointmentBarbers(input.barbershopId, input.barberId),
  ]);
  return { role, appointments, barbers };
}

export async function getOperationalAppointment(input: {
  userId: string;
  barbershopId: string;
  barberId: string | null;
  reservationId: string;
}): Promise<{ role: OperationalRole; appointment: OperationalAppointment } | null> {
  const role = await getOperationalRole(input.userId, input.barbershopId, input.barberId);
  if (!role) return null;

  const appointments = await enrichOperationalAppointments(
    await getOperationalRows(input.barbershopId, input.barberId, input.reservationId),
  );
  const appointment = appointments[0];
  return appointment ? { role, appointment } : null;
}
