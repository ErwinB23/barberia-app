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

export const BOOKING_FLOW_STEPS = [
  { key: 'services', label: 'Servicios' },
  { key: 'professional', label: 'Profesional' },
  { key: 'schedule', label: 'Horario' },
  { key: 'confirm', label: 'Confirmar' },
] as const;

export type BookingFlowStep = (typeof BOOKING_FLOW_STEPS)[number]['key'];

type BookingStepSelection = {
  selectedServiceCount: number;
  eligibleBarberCount: number;
  hasSelectedSlot: boolean;
};

type SlotWithStart = {
  startsAt: string;
};

const SLOT_PERIODS = [
  { key: 'morning', label: 'Mañana' },
  { key: 'afternoon', label: 'Tarde' },
  { key: 'night', label: 'Noche' },
] as const;

export function getNextBookingStep(step: BookingFlowStep): BookingFlowStep {
  const index = BOOKING_FLOW_STEPS.findIndex((candidate) => candidate.key === step);
  return BOOKING_FLOW_STEPS[Math.min(index + 1, BOOKING_FLOW_STEPS.length - 1)].key;
}

export function getPreviousBookingStep(step: BookingFlowStep): BookingFlowStep {
  const index = BOOKING_FLOW_STEPS.findIndex((candidate) => candidate.key === step);
  return BOOKING_FLOW_STEPS[Math.max(index - 1, 0)].key;
}

export function canContinueBookingStep(step: BookingFlowStep, selection: BookingStepSelection) {
  if (step === 'services') return selection.selectedServiceCount > 0;
  if (step === 'professional') return selection.eligibleBarberCount > 0;
  if (step === 'schedule') return selection.hasSelectedSlot;
  return selection.selectedServiceCount > 0 && selection.hasSelectedSlot;
}

export function getBookingDateRange(startDate: string, maxBookingDays: number) {
  if (!isValidDateInput(startDate)) return [];

  const [year, month, day] = startDate.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  const dayCount = Math.max(0, Math.floor(maxBookingDays));

  return Array.from({ length: dayCount + 1 }, (_, offset) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + offset);
    return date.toISOString().slice(0, 10);
  });
}

export function groupAvailableSlotsByPeriod<T extends SlotWithStart>(slots: T[]) {
  const grouped = new Map<(typeof SLOT_PERIODS)[number]['key'], T[]>(
    SLOT_PERIODS.map((period) => [period.key, []]),
  );

  for (const slot of [...slots].sort((left, right) =>
    left.startsAt.localeCompare(right.startsAt),
  )) {
    const hour = Number(
      new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        hourCycle: 'h23',
        timeZone: 'America/Lima',
      }).format(new Date(slot.startsAt)),
    );
    const key = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'night';
    grouped.get(key)?.push(slot);
  }

  return SLOT_PERIODS.map((period) => ({ ...period, slots: grouped.get(period.key) ?? [] })).filter(
    (period) => period.slots.length > 0,
  );
}

export function canStartBookingSubmission({
  isSubmitting,
  selectedServiceCount,
  hasSelectedSlot,
}: {
  isSubmitting: boolean;
  selectedServiceCount: number;
  hasSelectedSlot: boolean;
}) {
  return !isSubmitting && selectedServiceCount > 0 && hasSelectedSlot;
}

export function getCreatedReservationHref(reservationId: string) {
  return `/reservations/${encodeURIComponent(reservationId)}?created=1` as const;
}

type PublicBarbershopSearchable = {
  name: string;
  description: string | null;
  address: string | null;
  locationReference?: string | null;
};

type NamedService = {
  id: string;
  name: string;
};

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-PE');
}

export function filterPublicBarbershops<T extends PublicBarbershopSearchable>(
  barbershops: T[],
  query: string,
) {
  const normalizedQuery = normalizeSearchText(query.trim());
  if (!normalizedQuery) return barbershops;

  return barbershops.filter((barbershop) =>
    [
      barbershop.name,
      barbershop.description,
      barbershop.address,
      barbershop.locationReference,
    ].some((value) => value && normalizeSearchText(value).includes(normalizedQuery)),
  );
}

export function getBarberServiceSummary(
  barberId: string,
  services: NamedService[],
  assignments: BarberServiceAssignment[],
  visibleLimit = 3,
) {
  const assignedServiceIds = new Set(
    assignments
      .filter((assignment) => assignment.barberId === barberId)
      .map((assignment) => assignment.serviceId),
  );
  const assignedServices = services.filter((service) => assignedServiceIds.has(service.id));

  if (assignedServices.length === 0) return 'Servicios por confirmar';

  const visibleNames = assignedServices.slice(0, visibleLimit).map((service) => service.name);
  const hiddenCount = assignedServices.length - visibleNames.length;
  return hiddenCount > 0
    ? `${visibleNames.join(', ')} y ${hiddenCount} más`
    : visibleNames.join(', ');
}

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
