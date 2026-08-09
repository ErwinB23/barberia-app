const FALLBACK_ERROR = 'No pudimos completar la operación. Inténtalo nuevamente.';

const ERROR_MESSAGES: Record<string, string> = {
  '22023': 'Revisa los datos ingresados e inténtalo nuevamente.',
  '23503': 'No pudimos relacionar la operación con tu perfil.',
  '23514': 'Uno de los valores no cumple las reglas permitidas.',
  '42501': 'No tienes permiso para realizar esta acción.',
  P0002: 'La barbería solicitada no está disponible.',
};

export function getBarbershopErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return FALLBACK_ERROR;
  }

  const code = error.code;
  return typeof code === 'string' ? (ERROR_MESSAGES[code] ?? FALLBACK_ERROR) : FALLBACK_ERROR;
}
