import { supabase } from '@/infrastructure/supabase/client';

import type { HourFormValues, ParsedClosureForm, Weekday } from './schedule-domain';

function createNotFoundError() {
  return Object.assign(new Error('Schedule item not found'), { code: 'PGRST116' });
}

export async function createBarbershopHour(
  barbershopId: string,
  weekday: Weekday,
  values: HourFormValues,
) {
  const { error } = await supabase.from('barbershop_hours').insert({
    barbershop_id: barbershopId,
    weekday,
    start_time: values.startTime,
    end_time: values.endTime,
  });

  if (error) {
    throw error;
  }
}

export async function updateBarbershopHour(
  barbershopId: string,
  hourId: string,
  weekday: Weekday,
  values: HourFormValues,
) {
  const { data, error } = await supabase
    .from('barbershop_hours')
    .update({ weekday, start_time: values.startTime, end_time: values.endTime })
    .eq('id', hourId)
    .eq('barbershop_id', barbershopId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw createNotFoundError();
  }
}

export async function deleteBarbershopHour(barbershopId: string, hourId: string) {
  const { data, error } = await supabase
    .from('barbershop_hours')
    .delete()
    .eq('id', hourId)
    .eq('barbershop_id', barbershopId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw createNotFoundError();
  }
}

export async function createBarbershopClosure(
  barbershopId: string,
  userId: string,
  values: ParsedClosureForm,
) {
  const { error } = await supabase.from('barbershop_closures').insert({
    barbershop_id: barbershopId,
    starts_at: values.startsAt,
    ends_at: values.endsAt,
    reason: values.reason,
    created_by: userId,
  });

  if (error) {
    throw error;
  }
}

export async function deleteBarbershopClosure(barbershopId: string, closureId: string) {
  const { data, error } = await supabase
    .from('barbershop_closures')
    .delete()
    .eq('id', closureId)
    .eq('barbershop_id', barbershopId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw createNotFoundError();
  }
}
