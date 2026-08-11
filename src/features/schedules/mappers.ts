import { isTimeRangeValid, type Weekday } from './schedule-domain';
import type {
  BarbershopClosure,
  BarbershopClosureRow,
  BarbershopHour,
  BarbershopHourRow,
} from './types.ts';

function isWeekday(value: number): value is Weekday {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}

function normalizeDatabaseTime(value: string) {
  return value.slice(0, 5);
}

export function mapBarbershopHour(row: BarbershopHourRow): BarbershopHour {
  const startTime = normalizeDatabaseTime(row.start_time);
  const endTime = normalizeDatabaseTime(row.end_time);
  if (!isWeekday(row.weekday) || !isTimeRangeValid(startTime, endTime)) {
    throw new Error('Invalid barbershop hour received from database');
  }

  return {
    id: row.id,
    barbershopId: row.barbershop_id,
    weekday: row.weekday,
    startTime,
    endTime,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBarbershopClosure(row: BarbershopClosureRow): BarbershopClosure {
  return {
    id: row.id,
    barbershopId: row.barbershop_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    reason: row.reason,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
