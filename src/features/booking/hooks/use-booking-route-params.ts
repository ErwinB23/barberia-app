import { useLocalSearchParams } from 'expo-router';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuid(value: string | undefined) {
  return typeof value === 'string' && UUID_PATTERN.test(value) ? value : null;
}

export function useBookingRouteParams() {
  const params = useLocalSearchParams<{
    barbershopId?: string;
    reservationId?: string;
    created?: string;
  }>();

  return {
    barbershopId: uuid(params.barbershopId),
    reservationId: uuid(params.reservationId),
    created: params.created === '1',
  };
}
