import { supabase } from '@/infrastructure/supabase/client';
import type { Json } from '@/infrastructure/supabase/database.types';

import type { ReservationItemInput } from './booking-domain';
import type { AvailableSlot, PaymentMethod } from './types';

export async function getAvailableSlots(
  barberId: string,
  date: string,
  serviceIds: string[],
): Promise<AvailableSlot[]> {
  const { data, error } = await supabase.rpc('get_available_slots', {
    p_barber_id: barberId,
    p_date: date,
    p_service_ids: serviceIds,
  });

  if (error) throw error;
  return data.map((slot) => ({
    barberId,
    startsAt: slot.starts_at,
    endsAt: slot.ends_at,
  }));
}

export async function createReservation(input: {
  barberId: string;
  items: ReservationItemInput[];
  paymentMethod: PaymentMethod;
  startsAt: string;
}) {
  const { data, error } = await supabase.rpc('create_reservation', {
    p_barber_id: input.barberId,
    p_items: input.items as Json,
    p_payment_method: input.paymentMethod,
    p_starts_at: input.startsAt,
  });

  if (error) throw error;
  return data;
}
