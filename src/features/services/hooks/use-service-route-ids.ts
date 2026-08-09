import { useLocalSearchParams } from 'expo-router';

import { isValidCatalogId } from '../validation';

export function useServiceRouteIds() {
  const { barbershopId, serviceId, styleId, saved } = useLocalSearchParams<{
    barbershopId?: string;
    serviceId?: string;
    styleId?: string;
    saved?: string;
  }>();

  return {
    barbershopId:
      typeof barbershopId === 'string' && isValidCatalogId(barbershopId) ? barbershopId : null,
    serviceId: typeof serviceId === 'string' && isValidCatalogId(serviceId) ? serviceId : null,
    styleId: typeof styleId === 'string' && isValidCatalogId(styleId) ? styleId : null,
    saved: typeof saved === 'string' ? saved : null,
  };
}
