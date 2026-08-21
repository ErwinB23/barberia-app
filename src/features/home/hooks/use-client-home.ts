import { useCallback } from 'react';

import { useFocusedResource } from '@/features/booking';

import { getClientHomeData } from '../queries';

export function useClientHome(userId: string) {
  const load = useCallback(() => getClientHomeData(userId), [userId]);
  return useFocusedResource(load);
}
