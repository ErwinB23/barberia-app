import { useCallback } from 'react';

import { useFocusedResource } from '@/features/booking';

import { getAdminHomeData } from '../admin-home-queries';

export function useAdminHome(userId: string, barbershopId: string | null) {
  const load = useCallback(
    () => (barbershopId ? getAdminHomeData({ userId, barbershopId }) : Promise.resolve(null)),
    [barbershopId, userId],
  );

  return useFocusedResource(load);
}
