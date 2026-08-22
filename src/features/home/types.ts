import type { PublicBarbershop } from '@/features/booking/types';
import type { FavoriteBarbershop } from '@/features/favorites/types';
import type { ClientReservation, ReservationStatus } from '@/features/reservations/types';

export type VisibleHomeFavorite = FavoriteBarbershop & {
  barbershop: NonNullable<FavoriteBarbershop['barbershop']>;
};

export type ClientHomeData = {
  availableBarbershops: PublicBarbershop[];
  favorites: VisibleHomeFavorite[];
  upcomingReservation: ClientReservation | null;
  unreadNotificationCount: number | null;
};

export type AdminHomeTodayAppointment = {
  id: string;
  barbershopId: string;
  startsAt: string;
  endsAt: string;
  status: ReservationStatus;
};

export type AdminHomeAppointment = AdminHomeTodayAppointment & {
  barberId: string;
  barberName: string;
  clientName: string | null;
  serviceNames: string[];
};
