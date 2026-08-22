import type { OwnBarberProfile } from '@/features/barbers/types';
import type { PublicationRequirement } from '@/features/barbershops/publication';
import type {
  BarbershopStatus,
  MembershipRole,
  UserBarbershop,
} from '@/features/barbershops/types';
import type { ReservationStatus } from '@/features/reservations/types';

type AdminHomeAppointmentBase = {
  id: string;
  barbershopId: string;
  startsAt: string;
  endsAt: string;
  status: ReservationStatus;
};

type AdminHomeContext = Pick<UserBarbershop, 'role' | 'barbershop'>;

type AdminHomeLoaders<
  TodayAppointment extends AdminHomeAppointmentBase,
  UpcomingAppointment extends AdminHomeAppointmentBase,
> = {
  getContext: () => Promise<AdminHomeContext | null>;
  getTodayAppointments: () => Promise<TodayAppointment[]>;
  getUpcomingAppointments: () => Promise<UpcomingAppointment[]>;
  getPendingYapeCount: () => Promise<number>;
  getPendingInvitationCount: () => Promise<number>;
  getPublicationReadiness: (context: AdminHomeContext) => Promise<PublicationRequirement[]>;
  getUnreadNotificationCount: () => Promise<number>;
  getOwnBarberProfile: () => Promise<OwnBarberProfile | null>;
};

export type AdminHomeSummary = {
  total: number;
  confirmed: number;
  inProgress: number;
  completed: number;
};

export type AdminAttentionItem = {
  kind: 'pending_yape' | 'pending_invitations' | 'publication_readiness';
  count: number;
};

export type AdminAttentionState = {
  items: AdminAttentionItem[];
  isAllClear: boolean;
  hasUnavailableData: boolean;
};

export type AdminHomeUnavailableSection =
  | 'todaySummary'
  | 'upcomingAppointments'
  | 'pendingYape'
  | 'pendingInvitations'
  | 'publicationReadiness'
  | 'notifications'
  | 'ownBarberProfile';

export function buildAdminTodaySummary<T extends AdminHomeAppointmentBase>(
  appointments: readonly T[],
  barbershopId: string,
): AdminHomeSummary {
  const ownAppointments = appointments.filter(
    (appointment) => appointment.barbershopId === barbershopId,
  );

  return {
    total: ownAppointments.length,
    confirmed: ownAppointments.filter(({ status }) => status === 'confirmed').length,
    inProgress: ownAppointments.filter(({ status }) => status === 'in_progress').length,
    completed: ownAppointments.filter(({ status }) => status === 'completed').length,
  };
}

export function selectAdminUpcomingAppointments<T extends AdminHomeAppointmentBase>(
  appointments: readonly T[],
  barbershopId: string,
  now = new Date(),
  limit = 4,
): T[] {
  const nowTime = now.getTime();

  return appointments
    .filter(
      (appointment) =>
        appointment.barbershopId === barbershopId &&
        (appointment.status === 'confirmed' || appointment.status === 'in_progress') &&
        new Date(appointment.endsAt).getTime() > nowTime,
    )
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
    .slice(0, Math.max(limit, 0));
}

export function buildAdminAttentionState(input: {
  pendingYapeCount: number | null;
  pendingInvitationCount: number | null;
  publicationStatus: BarbershopStatus;
  publicationReadiness: PublicationRequirement[] | null;
}): AdminAttentionState {
  const items: AdminAttentionItem[] = [];

  if ((input.pendingYapeCount ?? 0) > 0) {
    items.push({ kind: 'pending_yape', count: input.pendingYapeCount ?? 0 });
  }
  if ((input.pendingInvitationCount ?? 0) > 0) {
    items.push({ kind: 'pending_invitations', count: input.pendingInvitationCount ?? 0 });
  }
  if (
    input.publicationStatus === 'unpublished' &&
    input.publicationReadiness?.some(({ isComplete }) => !isComplete)
  ) {
    items.push({
      kind: 'publication_readiness',
      count: input.publicationReadiness.filter(({ isComplete }) => !isComplete).length,
    });
  }

  const hasUnavailableData =
    input.pendingYapeCount === null ||
    input.pendingInvitationCount === null ||
    (input.publicationStatus === 'unpublished' && input.publicationReadiness === null);

  return {
    items,
    hasUnavailableData,
    isAllClear: items.length === 0 && !hasUnavailableData,
  };
}

export function getAdminBarbershopStatusCopy(status: BarbershopStatus) {
  return {
    published: {
      label: 'Publicada',
      description: 'La barbería está visible y puede recibir nuevas reservas.',
    },
    paused: {
      label: 'Pausada',
      description: 'Las nuevas reservas están pausadas. Las citas existentes se conservan.',
    },
    unpublished: {
      label: 'No publicada',
      description: 'La barbería no aparece en Explorar ni recibe nuevas reservas.',
    },
  }[status];
}

export function getAdminHomeRoutes(barbershopId: string, ownBarberId: string | null) {
  const base = `/barbershops/${encodeURIComponent(barbershopId)}`;

  return {
    clientHome: '/',
    notifications: '/notifications',
    agenda: `${base}/appointments`,
    appointment: (reservationId: string) =>
      `${base}/appointments/${encodeURIComponent(reservationId)}`,
    services: `${base}/services`,
    barbers: `${base}/barbers`,
    schedules: `${base}/schedules`,
    closures: `${base}/schedules/closures`,
    invitations: `${base}/invitations`,
    edit: `${base}/edit`,
    settings: `${base}/settings`,
    paymentSettings: `${base}/payment-settings`,
    publication: `${base}/publication`,
    ownBarberHome: ownBarberId ? `${base}/barbers/${encodeURIComponent(ownBarberId)}/home` : null,
  } as const;
}

function fulfilledValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === 'fulfilled' ? result.value : null;
}

export async function loadAdminHomeData<
  TodayAppointment extends AdminHomeAppointmentBase,
  UpcomingAppointment extends AdminHomeAppointmentBase,
>(
  loaders: AdminHomeLoaders<TodayAppointment, UpcomingAppointment>,
  barbershopId: string,
  now = new Date(),
) {
  const context = await loaders.getContext();
  if (!context) return null;

  if (!isAdministrator(context.role)) {
    const [notificationsResult, ownBarberResult] = await Promise.allSettled([
      loaders.getUnreadNotificationCount(),
      loaders.getOwnBarberProfile(),
    ] as const);
    const unavailableSections: AdminHomeUnavailableSection[] = [];
    if (notificationsResult.status === 'rejected') unavailableSections.push('notifications');
    if (ownBarberResult.status === 'rejected') unavailableSections.push('ownBarberProfile');

    return {
      context,
      summary: null,
      upcomingAppointments: null,
      pendingYapeCount: null,
      pendingInvitationCount: null,
      publicationReadiness: null,
      unreadNotificationCount: fulfilledValue(notificationsResult),
      ownBarberProfile: fulfilledValue(ownBarberResult),
      unavailableSections,
    };
  }

  const results = await Promise.allSettled([
    loaders.getTodayAppointments(),
    loaders.getUpcomingAppointments(),
    loaders.getPendingYapeCount(),
    loaders.getPendingInvitationCount(),
    loaders.getPublicationReadiness(context),
    loaders.getUnreadNotificationCount(),
    loaders.getOwnBarberProfile(),
  ] as const);
  const [
    todayResult,
    upcomingResult,
    pendingYapeResult,
    pendingInvitationsResult,
    readinessResult,
    notificationsResult,
    ownBarberResult,
  ] = results;
  const todayAppointments = fulfilledValue(todayResult);
  const upcomingAppointments = fulfilledValue(upcomingResult);
  const unavailableSections: AdminHomeUnavailableSection[] = [];

  if (todayResult.status === 'rejected') unavailableSections.push('todaySummary');
  if (upcomingResult.status === 'rejected') unavailableSections.push('upcomingAppointments');
  if (pendingYapeResult.status === 'rejected') unavailableSections.push('pendingYape');
  if (pendingInvitationsResult.status === 'rejected') {
    unavailableSections.push('pendingInvitations');
  }
  if (readinessResult.status === 'rejected') unavailableSections.push('publicationReadiness');
  if (notificationsResult.status === 'rejected') unavailableSections.push('notifications');
  if (ownBarberResult.status === 'rejected') unavailableSections.push('ownBarberProfile');

  return {
    context,
    summary: todayAppointments ? buildAdminTodaySummary(todayAppointments, barbershopId) : null,
    upcomingAppointments: upcomingAppointments
      ? selectAdminUpcomingAppointments(upcomingAppointments, barbershopId, now, 4)
      : null,
    pendingYapeCount: fulfilledValue(pendingYapeResult),
    pendingInvitationCount: fulfilledValue(pendingInvitationsResult),
    publicationReadiness: fulfilledValue(readinessResult),
    unreadNotificationCount: fulfilledValue(notificationsResult),
    ownBarberProfile: fulfilledValue(ownBarberResult),
    unavailableSections,
  };
}

export function isAdministrator(role: MembershipRole) {
  return role === 'administrator';
}
