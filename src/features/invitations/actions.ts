import { supabase } from '@/infrastructure/supabase/client';

import type { ParsedInvitationForm } from './invitation-domain';

const expiredInvitationError = () =>
  Object.assign(new Error('Invitation expired before it could be accepted.'), {
    code: 'INVITATION_EXPIRED',
  });

const invitationEmailDeliveryError = () =>
  Object.assign(new Error('Invitation email delivery failed.'), {
    code: 'INVITATION_EMAIL_DELIVERY_FAILED',
  });

export async function sendBarbershopInvitation(barbershopId: string, values: ParsedInvitationForm) {
  const { data, error } = await supabase.rpc('send_barbershop_invitation', {
    p_barbershop_id: barbershopId,
    p_email: values.email,
    p_role: values.role,
    p_channel: values.channel,
  });
  if (error) throw error;
  if (data === null) throw expiredInvitationError();
  return data;
}

export async function sendInvitationEmail(invitationId: string) {
  const { data, error } = await supabase.functions.invoke('send-invitation-email', {
    body: { invitation_id: invitationId },
  });

  if (error || !data || typeof data !== 'object' || data.ok !== true) {
    throw invitationEmailDeliveryError();
  }
}

export async function acceptBarbershopInvitation(invitationId: string) {
  const { data, error } = await supabase.rpc('accept_barbershop_invitation', {
    p_invitation_id: invitationId,
  });
  if (error) throw error;
  return data;
}

export async function rejectBarbershopInvitation(invitationId: string) {
  const { error } = await supabase.rpc('reject_barbershop_invitation', {
    p_invitation_id: invitationId,
  });
  if (error) throw error;
}

export async function cancelBarbershopInvitation(invitationId: string) {
  const { error } = await supabase.rpc('cancel_barbershop_invitation', {
    p_invitation_id: invitationId,
  });
  if (error) throw error;
}
