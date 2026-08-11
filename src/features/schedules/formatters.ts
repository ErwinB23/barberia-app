const LIMA_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
  hour12: false,
  timeZone: 'America/Lima',
});

export function formatLimaDateTime(value: string) {
  return LIMA_DATE_TIME_FORMATTER.format(new Date(value));
}

export function getClosureTimingLabel(startsAt: string, now = new Date()) {
  return new Date(startsAt) <= now ? 'En curso' : 'Programado';
}
