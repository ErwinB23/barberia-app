import { supabase } from '@/infrastructure/supabase/client';
import type { Database } from '@/infrastructure/supabase/database.types';

import type { ClientReservation, ClientReservationItem, ClientReservationPayment } from './types';

type ReservationRow = Database['public']['Tables']['reservations']['Row'];

const RESERVATION_COLUMNS =
  'id, barbershop_id, barber_id, starts_at, ends_at, status, total_price, total_duration_minutes, reschedule_count, is_late_reschedule, is_late_cancellation, is_refund_eligible, refund_policy_at_late_action, cancelled_at';

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
    | 'barber_id'
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

async function getVisibleNames(rows: Awaited<ReturnType<typeof getReservationRows>>) {
  const barbershopIds = [...new Set(rows.map((row) => row.barbershop_id))];
  const barberIds = [...new Set(rows.map((row) => row.barber_id))];
  const [barbershopResult, barberResult] = await Promise.all([
    barbershopIds.length > 0
      ? supabase.from('barbershops').select('id, name').in('id', barbershopIds)
      : Promise.resolve({ data: [], error: null }),
    barberIds.length > 0
      ? supabase.from('barbers').select('id, display_name').in('id', barberIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (barbershopResult.error) throw barbershopResult.error;
  if (barberResult.error) throw barberResult.error;
  return {
    barbershopNames: new Map(barbershopResult.data.map((shop) => [shop.id, shop.name])),
    barberNames: new Map(barberResult.data.map((barber) => [barber.id, barber.display_name])),
  };
}

async function getReservationItems(reservationIds: string[]) {
  if (reservationIds.length === 0) return new Map<string, ClientReservationItem[]>();

  const { data, error } = await supabase
    .from('reservation_services')
    .select('id, reservation_id, service_id, style_id, price_at_booking, duration_at_booking')
    .in('reservation_id', reservationIds)
    .order('created_at');
  if (error) throw error;

  const serviceIds = [...new Set(data.map((item) => item.service_id))];
  const styleIds = [...new Set(data.flatMap((item) => (item.style_id ? [item.style_id] : [])))];
  const [serviceResult, styleResult] = await Promise.all([
    serviceIds.length > 0
      ? supabase.from('services').select('id, name').in('id', serviceIds)
      : Promise.resolve({ data: [], error: null }),
    styleIds.length > 0
      ? supabase.from('styles').select('id, name').in('id', styleIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (serviceResult.error) throw serviceResult.error;
  if (styleResult.error) throw styleResult.error;

  const serviceNames = new Map(serviceResult.data.map((service) => [service.id, service.name]));
  const styleNames = new Map(styleResult.data.map((style) => [style.id, style.name]));
  const itemsByReservation = new Map<string, ClientReservationItem[]>();

  for (const item of data) {
    const items = itemsByReservation.get(item.reservation_id) ?? [];
    items.push({
      id: item.id,
      serviceId: item.service_id,
      serviceName: serviceNames.get(item.service_id) ?? 'Servicio reservado',
      styleId: item.style_id,
      styleName: item.style_id ? (styleNames.get(item.style_id) ?? 'Estilo reservado') : null,
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
  const [names, itemsByReservation, paymentsByReservation] = await Promise.all([
    getVisibleNames(rows),
    getReservationItems(reservationIds),
    getReservationPayments(reservationIds),
  ]);

  return rows.map((row) => ({
    id: row.id,
    barbershopId: row.barbershop_id,
    barbershopName: names.barbershopNames.get(row.barbershop_id) ?? 'Barbería',
    barberId: row.barber_id,
    barberName: names.barberNames.get(row.barber_id) ?? 'Barbero asignado',
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
  }));
}

export async function getClientReservations(userId: string) {
  return enrichReservations(await getReservationRows(userId));
}

export async function getClientReservation(userId: string, reservationId: string) {
  const reservations = await enrichReservations(await getReservationRows(userId, reservationId));
  return reservations[0] ?? null;
}
