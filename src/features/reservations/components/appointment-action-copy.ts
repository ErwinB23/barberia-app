export type AppointmentAction = 'start' | 'complete' | 'no_show' | 'cash' | 'yape' | 'refund';

export const APPOINTMENT_ACTION_COPY: Record<
  AppointmentAction,
  { label: string; confirmation: string; confirmLabel: string; success: string }
> = {
  start: {
    label: 'Iniciar atención',
    confirmation: 'La cita pasará a En atención.',
    confirmLabel: 'Sí, iniciar atención',
    success: 'La atención fue iniciada.',
  },
  complete: {
    label: 'Completar atención',
    confirmation: 'La cita pasará a Completada y no tendrá otra transición operativa.',
    confirmLabel: 'Sí, completar atención',
    success: 'La cita fue completada.',
  },
  no_show: {
    label: 'Marcar como no asistió',
    confirmation: 'Confirma que terminó la tolerancia y el cliente no se presentó.',
    confirmLabel: 'Sí, marcar como no asistió',
    success: 'La cita fue marcada como No asistió.',
  },
  cash: {
    label: 'Confirmar pago en efectivo',
    confirmation: 'Confirma que recibiste el importe completo en efectivo.',
    confirmLabel: 'Sí, confirmar efectivo',
    success: 'El pago en efectivo fue confirmado.',
  },
  yape: {
    label: 'Confirmar pago Yape',
    confirmation: 'Confirma que el pago Yape fue verificado.',
    confirmLabel: 'Sí, confirmar Yape',
    success: 'El pago Yape fue confirmado.',
  },
  refund: {
    label: 'Registrar reembolso',
    confirmation: 'Confirma que el reembolso manual ya fue realizado fuera de la aplicación.',
    confirmLabel: 'Sí, registrar reembolso',
    success: 'El reembolso fue registrado.',
  },
};
