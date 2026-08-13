import { supabase } from '@/infrastructure/supabase/client';

import type { PaymentMethod } from './types';

export async function getRescheduleAvailableSlots(
  reservationId: string,
  barberId: string,
  date: string,
) {
  const { data, error } = await supabase.rpc('get_reschedule_available_slots', {
    p_reservation_id: reservationId,
    p_new_barber_id: barberId,
    p_date: date,
  });

  if (error) throw error;
  return data.map((slot) => ({
    barberId,
    startsAt: slot.starts_at,
    endsAt: slot.ends_at,
  }));
}

export async function cancelReservation(reservationId: string) {
  const { error } = await supabase.rpc('cancel_reservation', {
    p_reservation_id: reservationId,
  });
  if (error) throw error;
}

export async function rescheduleReservation(input: {
  reservationId: string;
  barberId: string;
  startsAt: string;
}) {
  const { error } = await supabase.rpc('reschedule_reservation', {
    p_new_barber_id: input.barberId,
    p_new_starts_at: input.startsAt,
    p_reservation_id: input.reservationId,
  });
  if (error) throw error;
}

export async function changePaymentMethod(reservationId: string, method: PaymentMethod) {
  const { error } = await supabase.rpc('change_payment_method', {
    p_method: method,
    p_reservation_id: reservationId,
  });
  if (error) throw error;
}

export async function startReservation(reservationId: string) {
  const { error } = await supabase.rpc('start_reservation', {
    p_reservation_id: reservationId,
  });
  if (error) throw error;
}

export async function completeReservation(reservationId: string) {
  const { error } = await supabase.rpc('complete_reservation', {
    p_reservation_id: reservationId,
  });
  if (error) throw error;
}

export async function markReservationNoShow(reservationId: string) {
  const { error } = await supabase.rpc('mark_no_show', {
    p_reservation_id: reservationId,
  });
  if (error) throw error;
}

export async function confirmCashPayment(reservationId: string) {
  const { error } = await supabase.rpc('confirm_cash_payment', {
    p_reservation_id: reservationId,
  });
  if (error) throw error;
}

export async function confirmYapePayment(input: {
  reservationId: string;
  reference: string;
  note: string;
}) {
  const { error } = await supabase.rpc('confirm_yape_payment', {
    p_payment_note: input.note || undefined,
    p_reservation_id: input.reservationId,
    p_yape_reference: input.reference || undefined,
  });
  if (error) throw error;
}

export async function refundPayment(reservationId: string) {
  const { error } = await supabase.rpc('refund_payment', {
    p_reservation_id: reservationId,
  });
  if (error) throw error;
}
