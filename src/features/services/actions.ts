import { supabase } from '@/infrastructure/supabase/client';

import type { ParsedServiceForm, ParsedStyleForm } from './validation';

function createNotFoundError() {
  return Object.assign(new Error('Catalog item not found'), { code: 'PGRST116' });
}

async function requireService(barbershopId: string, serviceId: string) {
  const { data, error } = await supabase
    .from('services')
    .select('id')
    .eq('id', serviceId)
    .eq('barbershop_id', barbershopId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw createNotFoundError();
  }
}

export async function createService(barbershopId: string, input: ParsedServiceForm) {
  const { data, error } = await supabase
    .from('services')
    .insert({
      barbershop_id: barbershopId,
      name: input.name,
      description: input.description,
      price: input.price,
      duration_minutes: input.durationMinutes,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function updateService(
  barbershopId: string,
  serviceId: string,
  input: ParsedServiceForm,
) {
  const { data, error } = await supabase
    .from('services')
    .update({
      name: input.name,
      description: input.description,
      price: input.price,
      duration_minutes: input.durationMinutes,
    })
    .eq('id', serviceId)
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

export async function setServiceActive(barbershopId: string, serviceId: string, isActive: boolean) {
  const { data, error } = await supabase
    .from('services')
    .update({ is_active: isActive })
    .eq('id', serviceId)
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

export async function createStyle(barbershopId: string, serviceId: string, input: ParsedStyleForm) {
  await requireService(barbershopId, serviceId);

  const { data, error } = await supabase
    .from('styles')
    .insert({
      service_id: serviceId,
      name: input.name,
      description: input.description,
      image_url: input.imageUrl,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function updateStyle(
  barbershopId: string,
  serviceId: string,
  styleId: string,
  input: ParsedStyleForm,
) {
  await requireService(barbershopId, serviceId);

  const { data, error } = await supabase
    .from('styles')
    .update({
      name: input.name,
      description: input.description,
      image_url: input.imageUrl,
    })
    .eq('id', styleId)
    .eq('service_id', serviceId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw createNotFoundError();
  }
}

export async function setStyleActive(
  barbershopId: string,
  serviceId: string,
  styleId: string,
  isActive: boolean,
) {
  await requireService(barbershopId, serviceId);

  const { data, error } = await supabase
    .from('styles')
    .update({ is_active: isActive })
    .eq('id', styleId)
    .eq('service_id', serviceId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw createNotFoundError();
  }
}
