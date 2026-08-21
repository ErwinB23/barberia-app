export function getClientFirstName(fullName: string | null | undefined): string | null {
  const normalizedName = fullName?.trim();
  return normalizedName ? (normalizedName.split(/\s+/)[0] ?? null) : null;
}

export function selectUpcomingReservation<T extends { status: string; startsAt: string }>(
  reservations: T[],
  now = new Date(),
): T | null {
  const nowTime = now.getTime();

  return (
    reservations
      .filter(
        (reservation) =>
          reservation.status === 'in_progress' ||
          (reservation.status === 'confirmed' &&
            new Date(reservation.startsAt).getTime() >= nowTime),
      )
      .sort((left, right) => left.startsAt.localeCompare(right.startsAt))[0] ?? null
  );
}

export function getReservationServicesSummary(items: { serviceName: string }[]): string | null {
  if (items.length === 0) return null;

  const visibleNames = items.slice(0, 2).map(({ serviceName }) => serviceName);
  const remainingCount = items.length - visibleNames.length;
  return `${visibleNames.join(', ')}${remainingCount > 0 ? ` +${remainingCount}` : ''}`;
}

export function selectAvailableBarbershops<T extends { status: string }>(
  barbershops: T[],
  limit: number,
): T[] {
  return barbershops.filter(({ status }) => status === 'published').slice(0, Math.max(limit, 0));
}

export function selectHomeFavorites<T extends { isPrimary: boolean; barbershop: object | null }>(
  favorites: T[],
  limit: number,
): (T & { barbershop: NonNullable<T['barbershop']> })[] {
  return favorites
    .filter(
      (favorite): favorite is T & { barbershop: NonNullable<T['barbershop']> } =>
        favorite.barbershop !== null,
    )
    .sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary))
    .slice(0, Math.max(limit, 0));
}

type HomeReservation = {
  startsAt: string;
  status: string;
};

type HomeBarbershop = {
  status: string;
};

type HomeFavorite = {
  barbershop: object | null;
  isPrimary: boolean;
};

type ClientHomeLoaders<
  Reservation extends HomeReservation,
  Barbershop extends HomeBarbershop,
  Favorite extends HomeFavorite,
> = {
  getReservations: () => Promise<Reservation[]>;
  getBarbershops: () => Promise<Barbershop[]>;
  getFavorites: () => Promise<Favorite[]>;
  getUnreadNotificationCount: () => Promise<number>;
};

export async function loadClientHomeData<
  Reservation extends HomeReservation,
  Barbershop extends HomeBarbershop,
  Favorite extends HomeFavorite,
>(loaders: ClientHomeLoaders<Reservation, Barbershop, Favorite>, now = new Date()) {
  const [reservations, barbershops, favorites, unreadNotificationCount] = await Promise.all([
    loaders.getReservations(),
    loaders.getBarbershops(),
    loaders.getFavorites(),
    loaders.getUnreadNotificationCount().catch(() => null),
  ]);

  return {
    upcomingReservation: selectUpcomingReservation(reservations, now),
    availableBarbershops: selectAvailableBarbershops(barbershops, 4),
    favorites: selectHomeFavorites(favorites, 3),
    unreadNotificationCount,
  };
}
