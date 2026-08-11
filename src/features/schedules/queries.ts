import { supabase } from '@/infrastructure/supabase/client';

import { mapBarbershopClosure, mapBarbershopHour } from './mappers';
import type { BarbershopClosure, BarbershopHour, MembershipRole } from './types';

const HOUR_COLUMNS = 'id, barbershop_id, weekday, start_time, end_time, created_at, updated_at';
const CLOSURE_COLUMNS =
  'id, barbershop_id, starts_at, ends_at, reason, created_by, created_at, updated_at';

export async function getScheduleManagementRole(
  userId: string,
  barbershopId: string,
): Promise<MembershipRole | null> {
  const { data, error } = await supabase
    .from('barbershop_memberships')
    .select('role')
    .eq('barbershop_id', barbershopId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.role ?? null;
}

export async function getBarbershopHours(barbershopId: string): Promise<BarbershopHour[]> {
  const { data, error } = await supabase
    .from('barbershop_hours')
    .select(HOUR_COLUMNS)
    .eq('barbershop_id', barbershopId)
    .order('weekday')
    .order('start_time');

  if (error) {
    throw error;
  }

  return data.map(mapBarbershopHour);
}

export async function getBarbershopHour(
  barbershopId: string,
  hourId: string,
): Promise<BarbershopHour | null> {
  const { data, error } = await supabase
    .from('barbershop_hours')
    .select(HOUR_COLUMNS)
    .eq('id', hourId)
    .eq('barbershop_id', barbershopId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapBarbershopHour(data) : null;
}

export async function getUpcomingBarbershopClosures(
  barbershopId: string,
): Promise<BarbershopClosure[]> {
  const { data, error } = await supabase
    .from('barbershop_closures')
    .select(CLOSURE_COLUMNS)
    .eq('barbershop_id', barbershopId)
    .gte('ends_at', new Date().toISOString())
    .order('starts_at');

  if (error) {
    throw error;
  }

  return data.map(mapBarbershopClosure);
}
