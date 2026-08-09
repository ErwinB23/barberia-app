const FALLBACK_ERROR = 'No pudimos completar la operación. Inténtalo nuevamente.';

const ERROR_MESSAGES: Record<string, string> = {
  '23505': 'Ya existe un elemento con ese nombre en este catálogo.',
  '23514': 'Uno de los valores no cumple las reglas permitidas.',
  '42501': 'No tienes permiso para realizar esta acción.',
  PGRST116: 'El elemento solicitado no está disponible.',
};

export function getCatalogErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return FALLBACK_ERROR;
  }

  const code = error.code;
  return typeof code === 'string' ? (ERROR_MESSAGES[code] ?? FALLBACK_ERROR) : FALLBACK_ERROR;
}
