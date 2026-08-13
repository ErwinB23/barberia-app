import { supabase } from '@/infrastructure/supabase/client';

import { mapMembershipRows } from './mappers';
import { buildPublicationReadiness } from './publication';
import type {
  BarbershopDetail,
  BarbershopSettings,
  MembershipRole,
  UserBarbershop,
  YapeSettings,
} from './types';

const BARBERSHOP_SUMMARY_COLUMNS = `
  id,
  name,
  status,
  phone,
  address,
  description,
  location_reference,
  logo_url,
  created_at,
  updated_at
`;

const MEMBERSHIP_WITH_BARBERSHOP_QUERY = `
  id,
  role,
  barbershop:barbershops!barbershop_memberships_barbershop_id_fkey (
    ${BARBERSHOP_SUMMARY_COLUMNS}
  )
`;

export async function getUserBarbershops(userId: string): Promise<UserBarbershop[]> {
  const { data, error } = await supabase
    .from('barbershop_memberships')
    .select(MEMBERSHIP_WITH_BARBERSHOP_QUERY)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('joined_at', { ascending: false });

  if (error) {
    throw error;
  }

  return mapMembershipRows(data);
}

async function getOwnBarbershopMembership(
  userId: string,
  barbershopId: string,
): Promise<UserBarbershop | null> {
  const { data, error } = await supabase
    .from('barbershop_memberships')
    .select(MEMBERSHIP_WITH_BARBERSHOP_QUERY)
    .eq('barbershop_id', barbershopId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? (mapMembershipRows([data])[0] ?? null) : null;
}

async function getBarbershopSettings(barbershopId: string): Promise<BarbershopSettings> {
  const { data, error } = await supabase
    .from('barbershop_settings')
    .select(
      `barbershop_id, min_booking_notice_minutes, max_booking_days, slot_interval_minutes,
       appointment_buffer_minutes, cancellation_notice_minutes,
       late_cancellation_refund_policy, created_at, updated_at`,
    )
    .eq('barbershop_id', barbershopId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function getPublicationReadiness(
  barbershop: UserBarbershop['barbershop'],
): Promise<BarbershopDetail['publicationReadiness']> {
  const [hoursResult, servicesResult, barbersResult] = await Promise.all([
    supabase.from('barbershop_hours').select('id').eq('barbershop_id', barbershop.id).limit(1),
    supabase
      .from('services')
      .select('id')
      .eq('barbershop_id', barbershop.id)
      .eq('is_active', true)
      .limit(1),
    supabase.from('barbers').select('id').eq('barbershop_id', barbershop.id).eq('is_active', true),
  ]);

  if (hoursResult.error) throw hoursResult.error;
  if (servicesResult.error) throw servicesResult.error;
  if (barbersResult.error) throw barbersResult.error;

  const activeBarberIds = barbersResult.data.map((barber) => barber.id);
  let hasScheduledActiveBarber = false;

  if (activeBarberIds.length > 0) {
    const { data, error } = await supabase
      .from('barber_schedules')
      .select('id')
      .eq('barbershop_id', barbershop.id)
      .in('barber_id', activeBarberIds)
      .limit(1);

    if (error) throw error;
    hasScheduledActiveBarber = data.length > 0;
  }

  return buildPublicationReadiness({
    phone: barbershop.phone,
    address: barbershop.address,
    hasOpeningHours: hoursResult.data.length > 0,
    hasActiveService: servicesResult.data.length > 0,
    hasActiveBarber: activeBarberIds.length > 0,
    hasScheduledActiveBarber,
  });
}

export async function getBarbershopDetail(
  userId: string,
  barbershopId: string,
): Promise<BarbershopDetail | null> {
  const membership = await getOwnBarbershopMembership(userId, barbershopId);

  if (!membership) {
    return null;
  }

  const [settings, publicationReadiness] =
    membership.role === 'administrator'
      ? await Promise.all([
          getBarbershopSettings(barbershopId),
          getPublicationReadiness(membership.barbershop),
        ])
      : [null, null];

  return { ...membership, settings, publicationReadiness };
}

async function getOwnMembershipRole(
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

export async function getYapeSettings(
  userId: string,
  barbershopId: string,
): Promise<{ role: MembershipRole | null; settings: YapeSettings | null }> {
  const role = await getOwnMembershipRole(userId, barbershopId);

  if (role !== 'administrator') {
    return { role, settings: null };
  }

  const { data, error } = await supabase
    .from('barbershop_payment_settings')
    .select('barbershop_id, yape_holder_name, yape_phone, yape_qr_url, updated_at')
    .eq('barbershop_id', barbershopId)
    .single();

  if (error) {
    throw error;
  }

  return { role, settings: data };
}
