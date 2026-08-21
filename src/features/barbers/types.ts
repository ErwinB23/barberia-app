import type { Enums, Tables } from '../../infrastructure/supabase/database.types.ts';

import type { Weekday } from './barber-domain';

export type MembershipRole = Enums<'membership_role'>;

export type BarberRow = Pick<
  Tables<'barbers'>,
  'id' | 'barbershop_id' | 'display_name' | 'bio' | 'photo_url' | 'is_active'
>;
export type BarberServiceRow = Pick<Tables<'barber_services'>, 'barber_id' | 'service_id'>;
export type ServiceRow = Pick<
  Tables<'services'>,
  'id' | 'barbershop_id' | 'name' | 'duration_minutes' | 'price' | 'is_active'
>;
export type BarberScheduleRow = Pick<
  Tables<'barber_schedules'>,
  'id' | 'barbershop_id' | 'barber_id' | 'weekday' | 'start_time' | 'end_time'
>;
export type BarbershopHourRow = Pick<
  Tables<'barbershop_hours'>,
  'id' | 'barbershop_id' | 'weekday' | 'start_time' | 'end_time'
>;
export type BarberBlockRow = Pick<
  Tables<'barber_blocks'>,
  'id' | 'barbershop_id' | 'barber_id' | 'starts_at' | 'ends_at' | 'reason'
>;

export type BarberService = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
};

export type Barber = {
  id: string;
  barbershopId: string;
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  isActive: boolean;
  services: BarberService[];
};

export type BarberSchedule = {
  id: string;
  barbershopId: string;
  barberId: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
};

export type BarbershopHour = {
  id: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
};

export type BarberBlock = {
  id: string;
  barbershopId: string;
  barberId: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
};

export type BarberServiceOption = BarberService & { isAssigned: boolean };

export type OwnBarberProfile = {
  barberId: string;
  isActive: boolean;
};
