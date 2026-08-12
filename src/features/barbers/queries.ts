import { supabase } from '@/infrastructure/supabase/client';

import { getSelectedServiceIds } from './barber-domain';
import {
  mapBarberBlock,
  mapBarbers,
  mapBarberSchedule,
  mapBarbershopHour,
  mapServices,
} from './mappers';
import type {
  Barber,
  BarberBlock,
  BarberSchedule,
  BarberServiceOption,
  BarbershopHour,
  MembershipRole,
  OwnBarberProfile,
} from './types';

const BARBER_COLUMNS = 'id, barbershop_id, display_name, bio, photo_url, is_active';
const ASSIGNMENT_COLUMNS = 'barber_id, service_id';
const SCHEDULE_COLUMNS = 'id, barbershop_id, barber_id, weekday, start_time, end_time';
const BLOCK_COLUMNS = 'id, barbershop_id, barber_id, starts_at, ends_at, reason';

export async function getBarberManagementRole(
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
  if (error) throw error;
  return data?.role ?? null;
}

export async function getOwnBarberProfile(barbershopId: string): Promise<OwnBarberProfile | null> {
  const { data, error } = await supabase
    .rpc('get_own_barber_profile', { p_barbershop_id: barbershopId })
    .maybeSingle();
  if (error) throw error;
  return data ? { barberId: data.barber_id, isActive: data.is_active } : null;
}

export async function getBarbers(barbershopId: string): Promise<Barber[]> {
  const [barbersResult, assignmentsResult, servicesResult] = await Promise.all([
    supabase
      .from('barbers')
      .select(BARBER_COLUMNS)
      .eq('barbershop_id', barbershopId)
      .order('display_name'),
    supabase.from('barber_services').select(ASSIGNMENT_COLUMNS).eq('barbershop_id', barbershopId),
    supabase
      .from('services')
      .select('id, barbershop_id, name, is_active')
      .eq('barbershop_id', barbershopId),
  ]);
  if (barbersResult.error) throw barbersResult.error;
  if (assignmentsResult.error) throw assignmentsResult.error;
  if (servicesResult.error) throw servicesResult.error;
  return mapBarbers(barbersResult.data, assignmentsResult.data, servicesResult.data);
}

export async function getBarber(barbershopId: string, barberId: string): Promise<Barber | null> {
  const barbers = await getBarbers(barbershopId);
  return barbers.find((barber) => barber.id === barberId) ?? null;
}

export async function getBarberServiceOptions(
  barbershopId: string,
  barberId: string,
): Promise<BarberServiceOption[]> {
  const [servicesResult, assignmentsResult] = await Promise.all([
    supabase
      .from('services')
      .select('id, barbershop_id, name, is_active')
      .eq('barbershop_id', barbershopId)
      .order('name'),
    supabase
      .from('barber_services')
      .select(ASSIGNMENT_COLUMNS)
      .eq('barbershop_id', barbershopId)
      .eq('barber_id', barberId),
  ]);
  if (servicesResult.error) throw servicesResult.error;
  if (assignmentsResult.error) throw assignmentsResult.error;
  const assignedIds = new Set(
    getSelectedServiceIds(
      assignmentsResult.data.map((assignment) => ({ serviceId: assignment.service_id })),
    ),
  );
  return mapServices(servicesResult.data).map((service) => ({
    ...service,
    isAssigned: assignedIds.has(service.id),
  }));
}

export async function getBarberSchedule(
  barbershopId: string,
  barberId: string,
): Promise<BarberSchedule[]> {
  const { data, error } = await supabase
    .from('barber_schedules')
    .select(SCHEDULE_COLUMNS)
    .eq('barbershop_id', barbershopId)
    .eq('barber_id', barberId)
    .order('weekday')
    .order('start_time');
  if (error) throw error;
  return data.map(mapBarberSchedule);
}

export async function getBarbershopHours(barbershopId: string): Promise<BarbershopHour[]> {
  const { data, error } = await supabase
    .from('barbershop_hours')
    .select('id, barbershop_id, weekday, start_time, end_time')
    .eq('barbershop_id', barbershopId)
    .order('weekday')
    .order('start_time');
  if (error) throw error;
  return data.map(mapBarbershopHour);
}

export async function getUpcomingBarberBlocks(
  barbershopId: string,
  barberId: string,
): Promise<BarberBlock[]> {
  const { data, error } = await supabase
    .from('barber_blocks')
    .select(BLOCK_COLUMNS)
    .eq('barbershop_id', barbershopId)
    .eq('barber_id', barberId)
    .gte('ends_at', new Date().toISOString())
    .order('starts_at');
  if (error) throw error;
  return data.map(mapBarberBlock);
}
