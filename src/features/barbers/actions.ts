import { supabase } from '@/infrastructure/supabase/client';

import type {
  BarberScheduleFormValues,
  ParsedBarberProfileForm,
  ParsedBlockForm,
  Weekday,
} from './barber-domain';

function notFoundError() {
  return Object.assign(new Error('Barber resource not found'), { code: 'PGRST116' });
}

export async function enableOwnBarberProfile(barbershopId: string) {
  const { data, error } = await supabase.rpc('enable_own_barber_profile', {
    p_barbershop_id: barbershopId,
  });
  if (error) throw error;
  return data;
}

export async function deactivateBarber(barberId: string) {
  const { error } = await supabase.rpc('deactivate_barber', { p_barber_id: barberId });
  if (error) throw error;
}

export async function updateBarberPublicProfile(
  barbershopId: string,
  barberId: string,
  values: ParsedBarberProfileForm,
) {
  const { data, error } = await supabase
    .from('barbers')
    .update({
      display_name: values.displayName,
      bio: values.bio,
      photo_url: values.photoUrl,
    })
    .eq('id', barberId)
    .eq('barbershop_id', barbershopId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFoundError();
}

export async function assignBarberService(
  barbershopId: string,
  barberId: string,
  serviceId: string,
) {
  const { error } = await supabase
    .from('barber_services')
    .insert({ barbershop_id: barbershopId, barber_id: barberId, service_id: serviceId });
  if (error) throw error;
}

export async function unassignBarberService(
  barbershopId: string,
  barberId: string,
  serviceId: string,
) {
  const { data, error } = await supabase
    .from('barber_services')
    .delete()
    .eq('barbershop_id', barbershopId)
    .eq('barber_id', barberId)
    .eq('service_id', serviceId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFoundError();
}

export async function createBarberSchedule(
  barbershopId: string,
  barberId: string,
  weekday: Weekday,
  values: BarberScheduleFormValues,
) {
  const { error } = await supabase.from('barber_schedules').insert({
    barbershop_id: barbershopId,
    barber_id: barberId,
    weekday,
    start_time: values.startTime,
    end_time: values.endTime,
  });
  if (error) throw error;
}

export async function updateBarberSchedule(
  barbershopId: string,
  barberId: string,
  scheduleId: string,
  weekday: Weekday,
  values: BarberScheduleFormValues,
) {
  const { data, error } = await supabase
    .from('barber_schedules')
    .update({ weekday, start_time: values.startTime, end_time: values.endTime })
    .eq('id', scheduleId)
    .eq('barbershop_id', barbershopId)
    .eq('barber_id', barberId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFoundError();
}

export async function deleteBarberSchedule(
  barbershopId: string,
  barberId: string,
  scheduleId: string,
) {
  const { data, error } = await supabase
    .from('barber_schedules')
    .delete()
    .eq('id', scheduleId)
    .eq('barbershop_id', barbershopId)
    .eq('barber_id', barberId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFoundError();
}

export async function createBarberBlock(
  barbershopId: string,
  barberId: string,
  createdBy: string,
  values: ParsedBlockForm,
) {
  const { error } = await supabase.from('barber_blocks').insert({
    barbershop_id: barbershopId,
    barber_id: barberId,
    created_by: createdBy,
    starts_at: values.startsAt,
    ends_at: values.endsAt,
    reason: values.reason,
  });
  if (error) throw error;
}

export async function deleteBarberBlock(barbershopId: string, barberId: string, blockId: string) {
  const { data, error } = await supabase
    .from('barber_blocks')
    .delete()
    .eq('id', blockId)
    .eq('barbershop_id', barbershopId)
    .eq('barber_id', barberId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFoundError();
}
