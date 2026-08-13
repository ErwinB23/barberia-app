type ErrorLike = { message?: unknown; code?: unknown };

export function getBookingErrorMessage(error: unknown) {
  const candidate = error && typeof error === 'object' ? (error as ErrorLike) : null;
  const message = typeof candidate?.message === 'string' ? candidate.message.toLowerCase() : '';

  if (message.includes('maximum of two active future reservations')) {
    return 'Ya tienes dos reservas futuras activas. Gestiona una antes de crear otra.';
  }
  if (
    message.includes('no longer available') ||
    message.includes('slot is not available') ||
    message.includes('time is not available') ||
    message.includes('barber is not available')
  ) {
    return 'Ese horario acaba de dejar de estar disponible. Elige otro turno.';
  }
  if (message.includes('barber') && message.includes('service')) {
    return 'El barbero ya no puede realizar todos los servicios seleccionados.';
  }
  if (message.includes('booking notice') || message.includes('booking horizon')) {
    return 'La fecha no cumple la anticipación permitida por la barbería.';
  }
  if (message.includes('published') || message.includes('not accepting')) {
    return 'La barbería no está aceptando reservas en este momento.';
  }
  if (message.includes('style')) {
    return 'Uno de los estilos seleccionados ya no está disponible para ese servicio.';
  }

  return 'No pudimos completar la reserva. Actualiza la disponibilidad e inténtalo nuevamente.';
}

export function getBookingLoadErrorMessage() {
  return 'No pudimos cargar la información de reservas. Revisa tu conexión e inténtalo nuevamente.';
}
