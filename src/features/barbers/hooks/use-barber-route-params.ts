import { useLocalSearchParams } from 'expo-router';

import type { Weekday } from '../barber-domain';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function uuid(value: string | undefined) {
  return typeof value === 'string' && UUID_PATTERN.test(value) ? value : null;
}
function weekday(value: string | undefined): Weekday | null {
  return typeof value === 'string' && /^[0-6]$/.test(value) ? (Number(value) as Weekday) : null;
}

export function useBarberRouteParams() {
  const params = useLocalSearchParams<{
    barbershopId?: string;
    barberId?: string;
    scheduleId?: string;
    weekday?: string;
    saved?: string;
  }>();
  return {
    barbershopId: uuid(params.barbershopId),
    barberId: uuid(params.barberId),
    scheduleId: uuid(params.scheduleId),
    weekday: weekday(params.weekday),
    saved: typeof params.saved === 'string' ? params.saved : null,
  };
}
