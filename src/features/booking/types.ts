import type { Database } from '@/infrastructure/supabase/database.types';

export type BarbershopStatus = Database['public']['Enums']['barbershop_status'];
export type PaymentMethod = Database['public']['Enums']['payment_method'];

export type PublicBarbershop = {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  locationReference: string | null;
  status: BarbershopStatus;
};

export type PublicOpeningHour = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
};

export type BookingService = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
};

export type BookingStyle = {
  id: string;
  serviceId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
};

export type BookingBarber = {
  id: string;
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
};

export type BookingRules = {
  maxBookingDays: number;
  minBookingNoticeMinutes: number;
};

export type BookingCatalog = {
  barbershop: PublicBarbershop;
  hours: PublicOpeningHour[];
  services: BookingService[];
  styles: BookingStyle[];
  barbers: BookingBarber[];
  assignments: { barberId: string; serviceId: string }[];
  rules: BookingRules;
  yapeSettings: {
    holderName: string | null;
    phone: string | null;
    qrUrl: string | null;
  } | null;
};

export type PublicBarbershopDetail = Omit<BookingCatalog, 'rules' | 'yapeSettings'>;

export type AvailableSlot = {
  barberId: string;
  startsAt: string;
  endsAt: string;
};
