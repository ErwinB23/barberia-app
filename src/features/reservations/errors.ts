type ErrorLike = { message?: unknown };

export function getReservationErrorMessage(error: unknown) {
  const candidate = error && typeof error === 'object' ? (error as ErrorLike) : null;
  const message = typeof candidate?.message === 'string' ? candidate.message.toLowerCase() : '';

  if (message.includes('rescheduled once') || message.includes('already been rescheduled')) {
    return 'Esta reserva ya utilizó su única reprogramación permitida.';
  }
  if (
    message.includes('cannot be cancelled') ||
    message.includes('not confirmed') ||
    message.includes('only confirmed reservations can be cancelled')
  ) {
    return 'La reserva ya no se puede cancelar en su estado actual.';
  }
  if (message.includes('past') || message.includes('future')) {
    return 'La operación solo está disponible antes del inicio de la cita.';
  }
  if (message.includes('not available') || message.includes('unavailable')) {
    return 'Ese turno ya no está disponible. Consulta nuevamente los horarios.';
  }
  if (message.includes('not authorized') || message.includes('permission')) {
    return 'No tienes permiso para modificar esta reserva.';
  }

  return 'No pudimos actualizar la reserva. Revisa su estado e inténtalo nuevamente.';
}
