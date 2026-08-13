import { supabase } from '@/infrastructure/supabase/client';

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
