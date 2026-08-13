import { supabase } from '@/infrastructure/supabase/client';

import {
  normalizeYapeSettingsForm,
  type NormalizedBarbershopForm,
  type ParsedBarbershopSettings,
  type YapeSettingsFormValues,
} from './validation';

export async function createBarbershop(input: NormalizedBarbershopForm) {
  const { data, error } = await supabase.rpc('create_barbershop', {
    p_name: input.name,
    p_description: input.description,
    p_phone: input.phone,
    p_address: input.address,
    p_location_reference: input.locationReference,
    p_logo_url: input.logoUrl,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function updateBarbershop(barbershopId: string, input: NormalizedBarbershopForm) {
  const { error } = await supabase.rpc('update_barbershop', {
    p_barbershop_id: barbershopId,
    p_name: input.name,
    p_description: input.description,
    p_phone: input.phone,
    p_address: input.address,
    p_location_reference: input.locationReference,
    p_logo_url: input.logoUrl,
  });

  if (error) {
    throw error;
  }
}

export async function updateBarbershopSettings(
  barbershopId: string,
  input: ParsedBarbershopSettings,
) {
  const { error } = await supabase.rpc('update_barbershop_settings', {
    p_barbershop_id: barbershopId,
    p_min_booking_notice_minutes: input.minBookingNoticeMinutes,
    p_max_booking_days: input.maxBookingDays,
    p_slot_interval_minutes: input.slotIntervalMinutes,
    p_appointment_buffer_minutes: input.appointmentBufferMinutes,
    p_cancellation_notice_minutes: input.cancellationNoticeMinutes,
    p_late_cancellation_refund_policy: input.lateCancellationRefundPolicy,
  });

  if (error) {
    throw error;
  }
}

export async function updateYapeSettings(barbershopId: string, input: YapeSettingsFormValues) {
  const normalized = normalizeYapeSettingsForm(input);
  const { error } = await supabase.rpc('update_yape_settings', {
    p_barbershop_id: barbershopId,
    p_yape_holder_name: normalized.holderName,
    p_yape_phone: normalized.phone,
    p_yape_qr_url: normalized.qrUrl,
  });

  if (error) {
    throw error;
  }
}

export async function publishBarbershop(barbershopId: string) {
  const { error } = await supabase.rpc('publish_barbershop', {
    p_barbershop_id: barbershopId,
  });

  if (error) throw error;
}

export async function pauseBarbershop(barbershopId: string) {
  const { error } = await supabase.rpc('pause_barbershop', {
    p_barbershop_id: barbershopId,
  });

  if (error) throw error;
}

export async function unpublishBarbershop(barbershopId: string) {
  const { error } = await supabase.rpc('unpublish_barbershop', {
    p_barbershop_id: barbershopId,
  });

  if (error) throw error;
}
