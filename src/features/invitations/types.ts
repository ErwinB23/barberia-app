import type { Tables } from '@/infrastructure/supabase/database.types';

import type { InvitationChannel, InvitationRole, InvitationStatus } from './invitation-domain';

export type InvitationRow = Pick<
  Tables<'barbershop_invitations'>,
  | 'id'
  | 'barbershop_id'
  | 'email'
  | 'role'
  | 'channel'
  | 'status'
  | 'expires_at'
  | 'accepted_at'
  | 'responded_at'
  | 'created_at'
  | 'updated_at'
>;

export type Invitation = {
  id: string;
  barbershopId: string;
  role: InvitationRole;
  channel: InvitationChannel;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminInvitation = Invitation & {
  recipientEmail: string;
};

export type RecipientInvitation = Invitation & {
  barbershopName: string | null;
};

export type MembershipRole = Tables<'barbershop_memberships'>['role'];
