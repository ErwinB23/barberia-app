import type { Enums, Tables } from '../../infrastructure/supabase/database.types.ts';

import type { Weekday } from './schedule-domain';

export type MembershipRole = Enums<'membership_role'>;

export type BarbershopHourRow = Pick<
  Tables<'barbershop_hours'>,
  'id' | 'barbershop_id' | 'weekday' | 'start_time' | 'end_time' | 'created_at' | 'updated_at'
>;

export type BarbershopClosureRow = Pick<
  Tables<'barbershop_closures'>,
  | 'id'
  | 'barbershop_id'
  | 'starts_at'
  | 'ends_at'
  | 'reason'
  | 'created_by'
  | 'created_at'
  | 'updated_at'
>;

export type BarbershopHour = {
  id: string;
  barbershopId: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
};

export type BarbershopClosure = {
  id: string;
  barbershopId: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
