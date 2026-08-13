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
  if (message.includes('tolerance period has not ended')) {
    return 'Aún no termina la tolerancia de 10 minutos para marcar que el cliente no asistió.';
  }
  if (message.includes('only confirmed reservations can be started')) {
    return 'Solo una reserva confirmada puede iniciar atención.';
  }
  if (message.includes('only reservations in progress can be completed')) {
    return 'Solo una cita en atención puede completarse.';
  }
  if (message.includes('only confirmed reservations can be marked as no-show')) {
    return 'Solo una reserva confirmada puede marcarse como no asistida.';
  }
  if (message.includes('payment method is not cash')) {
    return 'Este pago no está configurado como efectivo.';
  }
  if (message.includes('payment method is not yape')) {
    return 'Este pago no está configurado como Yape.';
  }
  if (message.includes('payment is not pending')) {
    return 'El pago ya no está pendiente.';
  }
  if (message.includes('payment cannot be confirmed')) {
    return 'El estado actual de la cita no permite confirmar el pago.';
  }
  if (message.includes('only cancelled reservations can be refunded')) {
    return 'Solo una reserva cancelada puede registrar un reembolso.';
  }
  if (message.includes('does not allow a refund')) {
    return 'La política snapshot de esta reserva no permite un reembolso.';
  }
  if (message.includes('only paid payments can be refunded')) {
    return 'Solo un pago confirmado puede registrarse como reembolsado.';
  }
  if (message.includes('payment method can only be changed while payment is pending')) {
    return 'El método solo puede cambiarse mientras el pago esté pendiente.';
  }
  if (message.includes('cancelled reservation')) {
    return 'No se puede cambiar el método de pago de una reserva cancelada.';
  }

  return 'No pudimos actualizar la reserva. Revisa su estado e inténtalo nuevamente.';
}
