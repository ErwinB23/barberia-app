const INVITATION_DATE_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatInvitationDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : INVITATION_DATE_FORMATTER.format(date);
}
