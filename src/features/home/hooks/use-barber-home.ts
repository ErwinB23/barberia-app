import { useCallback } from 'react';

import { useFocusedResource } from '@/features/booking';

import { getBarberHomeData } from '../barber-home-queries';

export function useBarberHome(
  userId: string,
  barbershopId: string | null,
  barberId: string | null,
) {
  const load = useCallback(
    () =>
      barbershopId && barberId
        ? getBarberHomeData({ userId, barbershopId, barberId })
        : Promise.resolve(null),
    [barberId, barbershopId, userId],
  );

  return useFocusedResource(load);
}
