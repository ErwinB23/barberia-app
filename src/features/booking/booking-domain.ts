export type BookingPreviewService = {
  id: string;
  price: number;
  durationMinutes: number;
};

export type BarberServiceAssignment = {
  barberId: string;
  serviceId: string;
};

export type BookingStyleReference = {
  id: string;
  serviceId: string;
};

export type ReservationItemInput = {
  service_id: string;
  style_id: string | null;
};

export function toggleServiceSelection(selectedServiceIds: string[], serviceId: string) {
  return selectedServiceIds.includes(serviceId)
    ? selectedServiceIds.filter((selectedId) => selectedId !== serviceId)
    : [...selectedServiceIds, serviceId];
}

export function reconcileStyleSelections(
  selectedStyles: Record<string, string>,
  selectedServiceIds: string[],
) {
  const activeServiceIds = new Set(selectedServiceIds);

  return Object.fromEntries(
    Object.entries(selectedStyles).filter(([serviceId]) => activeServiceIds.has(serviceId)),
  );
}

export function calculateBookingPreview(
  selectedServiceIds: string[],
  services: BookingPreviewService[],
) {
  const selectedIds = new Set(selectedServiceIds);
  const totals = services.reduce(
    (preview, service) => {
      if (selectedIds.has(service.id)) {
        preview.totalPrice += service.price;
        preview.totalDurationMinutes += service.durationMinutes;
      }
      return preview;
    },
    { totalPrice: 0, totalDurationMinutes: 0 },
  );

  return {
    totalPrice: Math.round(totals.totalPrice * 100) / 100,
    totalDurationMinutes: totals.totalDurationMinutes,
  };
}

export function formatPen(amount: number) {
  return `S/ ${amount.toFixed(2)}`;
}

export function getEligibleBarberIds(
  selectedServiceIds: string[],
  activeBarberIds: string[],
  assignments: BarberServiceAssignment[],
) {
  const requiredServiceIds = new Set(selectedServiceIds);
  const assignedByBarber = new Map<string, Set<string>>();

  for (const assignment of assignments) {
    const serviceIds = assignedByBarber.get(assignment.barberId) ?? new Set<string>();
    serviceIds.add(assignment.serviceId);
    assignedByBarber.set(assignment.barberId, serviceIds);
  }

  return activeBarberIds.filter((barberId) => {
    const assignedServiceIds = assignedByBarber.get(barberId);
    return [...requiredServiceIds].every((serviceId) => assignedServiceIds?.has(serviceId));
  });
}

export function buildReservationItems(
  selectedServiceIds: string[],
  selectedStyles: Record<string, string>,
  styles: BookingStyleReference[],
): ReservationItemInput[] {
  const validStyles = new Map(styles.map((style) => [style.id, style.serviceId]));

  return selectedServiceIds.map((serviceId) => {
    const selectedStyleId = selectedStyles[serviceId];
    const styleId =
      selectedStyleId && validStyles.get(selectedStyleId) === serviceId ? selectedStyleId : null;

    return { service_id: serviceId, style_id: styleId };
  });
}

export function isValidDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function formatLimaTime(isoDate: string) {
  return new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'America/Lima',
  }).format(new Date(isoDate));
}

export function formatLimaDate(isoDate: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Lima',
  }).format(new Date(isoDate));
}

export function getTodayInLima() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Lima',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

const WEEKDAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const WEEKDAYS_MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0] as const;

export function getWeekdayLabel(weekday: number) {
  return WEEKDAY_LABELS[weekday] ?? 'Día';
}
