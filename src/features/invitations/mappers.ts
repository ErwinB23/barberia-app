import type { AdminInvitation, Invitation, InvitationRow, RecipientInvitation } from './types';

type RecipientInvitationRow = Omit<InvitationRow, 'email'> & {
  barbershop: { name: string } | null;
};

function mapInvitation(row: Omit<InvitationRow, 'email'>): Invitation {
  return {
    id: row.id,
    barbershopId: row.barbershop_id,
    role: row.role,
    channel: row.channel,
    status: row.status,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    respondedAt: row.responded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAdminInvitation(row: InvitationRow): AdminInvitation {
  return { ...mapInvitation(row), recipientEmail: row.email };
}

export function mapRecipientInvitation(row: RecipientInvitationRow): RecipientInvitation {
  return { ...mapInvitation(row), barbershopName: row.barbershop?.name ?? null };
}
