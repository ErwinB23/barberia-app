export type BarberOperation = 'barbers' | 'services' | 'schedules' | 'blocks';

const FALLBACK = 'No pudimos completar la operación. Inténtalo nuevamente.';
const COMMON: Record<string, string> = {
  '42501': 'No tienes permiso para gestionar barberos de esta barbería.',
  PGRST116: 'El elemento solicitado ya no está disponible.',
  P0002: 'El barbero activo solicitado no está disponible.',
  '22023': 'Los datos enviados no cumplen el formato requerido.',
};
const BY_OPERATION: Record<BarberOperation, Record<string, string>> = {
  barbers: {
    '23514': 'No se puede desactivar al barbero mientras tenga reservas activas futuras.',
  },
  services: {
    '23505': 'El servicio ya está asignado.',
    '23514':
      'No se puede quitar el servicio porque una reserva futura activa depende de esta asignación.',
  },
  schedules: {
    '23P01': 'El intervalo se superpone con otro horario del barbero.',
    '23505': 'Ese intervalo ya existe.',
    '23514': 'El horario debe caber en el horario general y no puede invalidar reservas futuras.',
  },
  blocks: {
    '23P01': 'No se puede crear el bloqueo porque se superpone con una reserva activa.',
    '23514': 'El bloqueo no cumple las fechas, horas o longitud de motivo permitidas.',
  },
};

export function getBarberErrorMessage(error: unknown, operation: BarberOperation) {
  if (!error || typeof error !== 'object' || !('code' in error) || typeof error.code !== 'string')
    return FALLBACK;
  return BY_OPERATION[operation][error.code] ?? COMMON[error.code] ?? FALLBACK;
}
