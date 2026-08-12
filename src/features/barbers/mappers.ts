import { isTimeRangeValid, type Weekday } from './barber-domain';
import type {
  Barber,
  BarberBlock,
  BarberBlockRow,
  BarberRow,
  BarberSchedule,
  BarberScheduleRow,
  BarberService,
  BarberServiceRow,
  BarbershopHour,
  BarbershopHourRow,
  ServiceRow,
} from './types.ts';

function isWeekday(value: number): value is Weekday {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

export function mapServices(rows: ServiceRow[]): BarberService[] {
  return rows.map((row) => ({ id: row.id, name: row.name, isActive: row.is_active }));
}

export function mapBarbers(
  rows: BarberRow[],
  assignments: BarberServiceRow[],
  services: ServiceRow[],
): Barber[] {
  const servicesById = new Map(mapServices(services).map((service) => [service.id, service]));
  return rows.map((row) => ({
    id: row.id,
    barbershopId: row.barbershop_id,
    displayName: row.display_name,
    bio: row.bio,
    photoUrl: row.photo_url,
    isActive: row.is_active,
    services: assignments
      .filter((assignment) => assignment.barber_id === row.id)
      .map((assignment) => servicesById.get(assignment.service_id))
      .filter((service): service is BarberService => Boolean(service))
      .sort((left, right) => left.name.localeCompare(right.name)),
  }));
}

export function mapBarberSchedule(row: BarberScheduleRow): BarberSchedule {
  const startTime = normalizeTime(row.start_time);
  const endTime = normalizeTime(row.end_time);
  if (!isWeekday(row.weekday) || !isTimeRangeValid(startTime, endTime)) {
    throw new Error('Invalid barber schedule received from database');
  }
  return {
    id: row.id,
    barbershopId: row.barbershop_id,
    barberId: row.barber_id,
    weekday: row.weekday,
    startTime,
    endTime,
  };
}

export function mapBarbershopHour(row: BarbershopHourRow): BarbershopHour {
  const startTime = normalizeTime(row.start_time);
  const endTime = normalizeTime(row.end_time);
  if (!isWeekday(row.weekday) || !isTimeRangeValid(startTime, endTime)) {
    throw new Error('Invalid barbershop hour received from database');
  }
  return { id: row.id, weekday: row.weekday, startTime, endTime };
}

export function mapBarberBlock(row: BarberBlockRow): BarberBlock {
  return {
    id: row.id,
    barbershopId: row.barbershop_id,
    barberId: row.barber_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    reason: row.reason,
  };
}
