import type { ReservationStatus } from '@/features/reservations/types';

type BarberHomeAppointment = {
  id: string;
  barbershopId: string;
  barberId: string;
  startsAt: string;
  endsAt: string;
  status: ReservationStatus;
};

export type BarberHomeSummary = {
  total: number;
  pending: number;
  completed: number;
};

export type BarberHomeEmptyState = 'no_appointments' | 'day_complete' | null;

type BarberHomeLoaders<T extends BarberHomeAppointment> = {
  getAgenda: () => Promise<{ appointments: T[] } | null>;
  getBarbershopName: () => Promise<string | null>;
  getUnreadNotificationCount: () => Promise<number>;
};

const limaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'America/Lima',
});

function getLimaDateKey(value: Date) {
  const parts = limaDateFormatter.formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isOperationalAppointment(appointment: BarberHomeAppointment, now: Date) {
  if (appointment.status === 'in_progress') return true;
  return (
    appointment.status === 'confirmed' && new Date(appointment.endsAt).getTime() > now.getTime()
  );
}

export function buildBarberTodayState<T extends BarberHomeAppointment>(
  appointments: readonly T[],
  barbershopId: string,
  now = new Date(),
) {
  const todayKey = getLimaDateKey(now);
  const todayAppointments = appointments
    .filter(
      (appointment) =>
        appointment.barbershopId === barbershopId &&
        getLimaDateKey(new Date(appointment.startsAt)) === todayKey,
    )
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
  const operationalAppointments = todayAppointments.filter((appointment) =>
    isOperationalAppointment(appointment, now),
  );
  const nextAppointment =
    operationalAppointments.find(({ status }) => status === 'in_progress') ??
    operationalAppointments[0] ??
    null;
  const followingAppointments = operationalAppointments
    .filter(({ id }) => id !== nextAppointment?.id)
    .slice(0, 3);
  const summary: BarberHomeSummary = {
    total: todayAppointments.length,
    pending: todayAppointments.filter(
      ({ status }) => status === 'confirmed' || status === 'in_progress',
    ).length,
    completed: todayAppointments.filter(({ status }) => status === 'completed').length,
  };
  const emptyState: BarberHomeEmptyState = nextAppointment
    ? null
    : todayAppointments.length === 0
      ? 'no_appointments'
      : 'day_complete';

  return { todayAppointments, nextAppointment, followingAppointments, summary, emptyState };
}

export async function loadBarberHomeData<T extends BarberHomeAppointment>(
  loaders: BarberHomeLoaders<T>,
  barbershopId: string,
  now = new Date(),
) {
  const [agenda, barbershopName, unreadNotificationCount] = await Promise.all([
    loaders.getAgenda(),
    loaders.getBarbershopName().catch(() => null),
    loaders.getUnreadNotificationCount().catch(() => null),
  ]);
  if (!agenda) return null;

  return {
    ...buildBarberTodayState(agenda.appointments, barbershopId, now),
    barbershopName,
    unreadNotificationCount,
  };
}

export function getBarberHomeRoutes(barbershopId: string, barberId: string) {
  const base = `/barbershops/${encodeURIComponent(barbershopId)}/barbers/${encodeURIComponent(barberId)}`;

  return {
    clientHome: '/',
    workspace: base,
    agenda: `${base}/appointments`,
    schedule: `${base}/schedule`,
    newBlock: `${base}/blocks/new`,
    appointment: (reservationId: string) =>
      `${base}/appointments/${encodeURIComponent(reservationId)}`,
  } as const;
}
