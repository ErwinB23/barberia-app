import { useLocalSearchParams } from 'expo-router';

import type { Weekday } from '../schedule-domain';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validUuid(value: string | undefined) {
  return typeof value === 'string' && UUID_PATTERN.test(value) ? value : null;
}

function validWeekday(value: string | undefined): Weekday | null {
  if (typeof value !== 'string' || !/^[0-6]$/.test(value)) {
    return null;
  }
  return Number(value) as Weekday;
}

export function useScheduleRouteParams() {
  const { barbershopId, hourId, weekday, saved } = useLocalSearchParams<{
    barbershopId?: string;
    hourId?: string;
    weekday?: string;
    saved?: string;
  }>();

  return {
    barbershopId: validUuid(barbershopId),
    hourId: validUuid(hourId),
    weekday: validWeekday(weekday),
    saved: typeof saved === 'string' ? saved : null,
  };
}
