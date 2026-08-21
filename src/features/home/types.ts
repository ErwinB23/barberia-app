import type { PublicBarbershop } from '@/features/booking/types';
import type { FavoriteBarbershop } from '@/features/favorites/types';
import type { ClientReservation } from '@/features/reservations/types';

export type VisibleHomeFavorite = FavoriteBarbershop & {
  barbershop: NonNullable<FavoriteBarbershop['barbershop']>;
};

export type ClientHomeData = {
  availableBarbershops: PublicBarbershop[];
  favorites: VisibleHomeFavorite[];
  upcomingReservation: ClientReservation | null;
  unreadNotificationCount: number | null;
};
