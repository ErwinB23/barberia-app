import { supabase } from '@/infrastructure/supabase/client';

import { mapService, mapStyle } from './mappers';
import type { CatalogService, CatalogStyle, MembershipRole } from './types';

const SERVICE_COLUMNS =
  'id, barbershop_id, name, description, price, duration_minutes, is_active, created_at, updated_at';
const STYLE_COLUMNS =
  'id, service_id, name, description, image_url, is_active, created_at, updated_at';

export async function getServiceManagementRole(
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

export async function getServices(barbershopId: string): Promise<CatalogService[]> {
  const { data, error } = await supabase
    .from('services')
    .select(SERVICE_COLUMNS)
    .eq('barbershop_id', barbershopId)
    .order('is_active', { ascending: false })
    .order('name');

  if (error) {
    throw error;
  }

  return data.map(mapService);
}

export async function getService(
  barbershopId: string,
  serviceId: string,
): Promise<CatalogService | null> {
  const { data, error } = await supabase
    .from('services')
    .select(SERVICE_COLUMNS)
    .eq('id', serviceId)
    .eq('barbershop_id', barbershopId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapService(data) : null;
}

export async function getServiceStyles(
  barbershopId: string,
  serviceId: string,
): Promise<{ service: CatalogService | null; styles: CatalogStyle[] }> {
  const service = await getService(barbershopId, serviceId);
  if (!service) {
    return { service: null, styles: [] };
  }

  const { data, error } = await supabase
    .from('styles')
    .select(STYLE_COLUMNS)
    .eq('service_id', serviceId)
    .order('is_active', { ascending: false })
    .order('name');

  if (error) {
    throw error;
  }

  return { service, styles: data.map(mapStyle) };
}

export async function getStyle(
  barbershopId: string,
  serviceId: string,
  styleId: string,
): Promise<{ service: CatalogService | null; style: CatalogStyle | null }> {
  const service = await getService(barbershopId, serviceId);
  if (!service) {
    return { service: null, style: null };
  }

  const { data, error } = await supabase
    .from('styles')
    .select(STYLE_COLUMNS)
    .eq('id', styleId)
    .eq('service_id', serviceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return { service, style: data ? mapStyle(data) : null };
}
