type ScheduleOperation = 'hours' | 'closures';

const FALLBACK_ERROR = 'No pudimos completar la operación. Inténtalo nuevamente.';

const COMMON_MESSAGES: Record<string, string> = {
  '42501': 'No tienes permiso para gestionar los horarios de esta barbería.',
  PGRST116: 'El elemento solicitado no está disponible.',
};

const HOURS_MESSAGES: Record<string, string> = {
  '23P01': 'El intervalo se superpone con otro horario del mismo día.',
  '23505': 'Ese intervalo ya existe para este día.',
  '23514':
    'El cambio no cumple las reglas del horario o dejaría fuera un horario de barbero existente.',
};

const CLOSURE_MESSAGES: Record<string, string> = {
  '23P01': 'No se puede crear el cierre porque se superpone con una reserva activa.',
  '23514': 'El cierre no cumple las fechas, horas o longitud de motivo permitidas.',
};

export function getScheduleErrorMessage(error: unknown, operation: ScheduleOperation) {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return FALLBACK_ERROR;
  }

  const code = error.code;
  if (typeof code !== 'string') {
    return FALLBACK_ERROR;
  }

  const operationMessages = operation === 'hours' ? HOURS_MESSAGES : CLOSURE_MESSAGES;
  return operationMessages[code] ?? COMMON_MESSAGES[code] ?? FALLBACK_ERROR;
}
