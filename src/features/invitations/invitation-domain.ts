import type { Enums } from '@/infrastructure/supabase/database.types';

export type InvitationRole = Enums<'membership_role'>;
export type InvitationChannel = Enums<'invitation_channel'>;
export type InvitationStatus = Enums<'invitation_status'>;
export type InvitationAudience = 'administrator' | 'recipient';

export type InvitationFormValues = {
  email: string;
  role: string;
  channel: string;
};

export type ParsedInvitationForm = {
  email: string;
  role: InvitationRole;
  channel: InvitationChannel;
};

export type InvitationFormErrors = Partial<Record<keyof InvitationFormValues, string>>;

export const INVITATION_ROLES = [
  'barber',
  'administrator',
] as const satisfies readonly InvitationRole[];
export const INVITATION_CHANNELS = ['app', 'email'] as const satisfies readonly InvitationChannel[];
export const INVITATION_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'expired',
  'cancelled',
] as const satisfies readonly InvitationStatus[];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_LABELS: Record<InvitationRole, string> = {
  barber: 'Barbero',
  administrator: 'Administrador',
};

const CHANNEL_LABELS: Record<InvitationChannel, string> = {
  app: 'En la app',
  email: 'Por email',
};

const STATUS_LABELS: Record<InvitationStatus, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Expirada',
  cancelled: 'Cancelada',
};

export function isInvitationRole(value: string): value is InvitationRole {
  return INVITATION_ROLES.some((role) => role === value);
}

export function isInvitationChannel(value: string): value is InvitationChannel {
  return INVITATION_CHANNELS.some((channel) => channel === value);
}

export function getInvitationRoleLabel(role: InvitationRole) {
  return ROLE_LABELS[role];
}

export function getInvitationChannelLabel(channel: InvitationChannel) {
  return CHANNEL_LABELS[channel];
}

export function getInvitationStatusLabel(status: InvitationStatus) {
  return STATUS_LABELS[status];
}

export function parseInvitationForm(values: InvitationFormValues): {
  values: ParsedInvitationForm | null;
  errors: InvitationFormErrors;
} {
  const email = values.email.trim().toLowerCase();
  const errors: InvitationFormErrors = {};

  if (email.length > 320 || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }
  if (!isInvitationRole(values.role)) {
    errors.role = 'Selecciona un rol válido.';
  }
  if (!isInvitationChannel(values.channel)) {
    errors.channel = 'Selecciona un canal válido.';
  }

  if (Object.keys(errors).length > 0) {
    return { values: null, errors };
  }

  return {
    values: {
      email,
      role: values.role as InvitationRole,
      channel: values.channel as InvitationChannel,
    },
    errors,
  };
}

export function getEffectiveInvitationStatus(
  status: InvitationStatus,
  expiresAt: string,
  now = new Date(),
): InvitationStatus {
  const expirationTime = Date.parse(expiresAt);
  return status === 'pending' && Number.isFinite(expirationTime) && expirationTime <= now.getTime()
    ? 'expired'
    : status;
}

export function getInvitationActions(
  status: InvitationStatus,
  expiresAt: string,
  audience: InvitationAudience,
  now = new Date(),
) {
  const isPending = getEffectiveInvitationStatus(status, expiresAt, now) === 'pending';
  return {
    canAccept: isPending && audience === 'recipient',
    canReject: isPending && audience === 'recipient',
    canCancel: isPending && audience === 'administrator',
  };
}
