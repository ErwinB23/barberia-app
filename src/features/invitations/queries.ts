import { supabase } from '@/infrastructure/supabase/client';

import { mapAdminInvitation, mapRecipientInvitation } from './mappers';
import type { AdminInvitation, MembershipRole, RecipientInvitation } from './types';

const INVITATION_COLUMNS = `
  id,
  barbershop_id,
  role,
  channel,
  status,
  expires_at,
  accepted_at,
  responded_at,
  created_at,
  updated_at
`;

export async function getInvitationManagementRole(
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

export async function getAdminInvitations(barbershopId: string): Promise<AdminInvitation[]> {
  const { data, error } = await supabase
    .from('barbershop_invitations')
    .select(`${INVITATION_COLUMNS}, email`)
    .eq('barbershop_id', barbershopId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapAdminInvitation);
}

export async function getRecipientInvitations(): Promise<RecipientInvitation[]> {
  const { data, error } = await supabase
    .from('barbershop_invitations')
    .select(
      `${INVITATION_COLUMNS}, barbershop:barbershops!barbershop_invitations_barbershop_id_fkey(name)`,
    )
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapRecipientInvitation);
}

export async function getPendingInvitationCount(): Promise<number> {
  const { count, error } = await supabase
    .from('barbershop_invitations')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString());
  if (error) throw error;
  return count ?? 0;
}
