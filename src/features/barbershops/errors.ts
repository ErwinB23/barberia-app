const FALLBACK_ERROR = 'No pudimos completar la operación. Inténtalo nuevamente.';

const ERROR_MESSAGES: Record<string, string> = {
  '22023': 'Revisa los datos ingresados e inténtalo nuevamente.',
  '23503': 'No pudimos relacionar la operación con tu perfil.',
  '23514': 'Uno de los valores no cumple las reglas permitidas.',
  '42501': 'No tienes permiso para realizar esta acción.',
  P0002: 'La barbería solicitada no está disponible.',
};

const PUBLICATION_ERROR_MESSAGES: Record<string, string> = {
  'Complete the required barbershop information':
    'Completa el teléfono y la dirección de la barbería antes de publicarla.',
  'Configure barbershop opening hours first':
    'Configura al menos un intervalo en el horario general antes de publicar.',
  'At least one active service is required': 'Activa al menos un servicio antes de publicar.',
  'At least one active barber with a configured schedule is required':
    'Necesitas al menos un barbero activo con horario individual antes de publicar.',
};

export function getBarbershopErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return FALLBACK_ERROR;
  }

  const code = error.code;
  return typeof code === 'string' ? (ERROR_MESSAGES[code] ?? FALLBACK_ERROR) : FALLBACK_ERROR;
}

export function getPublicationErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = error.message;
    if (typeof message === 'string' && PUBLICATION_ERROR_MESSAGES[message]) {
      return PUBLICATION_ERROR_MESSAGES[message];
    }
  }

  return getBarbershopErrorMessage(error);
}
