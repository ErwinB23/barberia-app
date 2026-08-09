import { useLocalSearchParams } from 'expo-router';

import { isValidUuid } from '../validation';

export function useBarbershopRouteId() {
  const { barbershopId } = useLocalSearchParams<{ barbershopId: string }>();
  return typeof barbershopId === 'string' && isValidUuid(barbershopId) ? barbershopId : null;
}
