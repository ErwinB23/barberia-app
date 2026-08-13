export type InvitationOperation = 'load' | 'send' | 'accept' | 'reject' | 'cancel';

const FALLBACK = 'No pudimos completar la operación. Inténtalo nuevamente.';

const COMMON: Record<string, string> = {
  '42501': 'No tienes permiso para realizar esta acción.',
  P0002: 'La invitación ya no está disponible.',
};

const BY_OPERATION: Record<InvitationOperation, Record<string, string>> = {
  load: {},
  send: {
    '22023': 'Revisa el correo, el rol y el canal seleccionados.',
    '23505': 'Ya existe una invitación pendiente para ese correo y rol.',
  },
  accept: {
    INVITATION_EXPIRED: 'La invitación venció antes de que pudiera aceptarse.',
    '22023': 'La invitación venció, ya fue respondida o los datos del perfil no son válidos.',
    '23505': 'Ya eres miembro activo de esta barbería. La promoción de rol aún no está soportada.',
  },
  reject: {
    '22023': 'La invitación venció o ya fue respondida.',
  },
  cancel: {
    P0002: 'La invitación pendiente ya no está disponible para cancelar.',
  },
};

export function getInvitationErrorMessage(error: unknown, operation: InvitationOperation) {
  if (!error || typeof error !== 'object' || !('code' in error) || typeof error.code !== 'string') {
    return FALLBACK;
  }
  return BY_OPERATION[operation][error.code] ?? COMMON[error.code] ?? FALLBACK;
}
