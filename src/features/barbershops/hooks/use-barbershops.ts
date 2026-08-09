import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getBarbershopErrorMessage } from '../errors';
import { getUserBarbershops } from '../queries';
import type { UserBarbershop } from '../types';

export function useBarbershops(userId: string) {
  const hasLoaded = useRef(false);
  const [barbershops, setBarbershops] = useState<UserBarbershop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (hasLoaded.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      setBarbershops(await getUserBarbershops(userId));
      hasLoaded.current = true;
    } catch (loadError) {
      setError(getBarbershopErrorMessage(loadError));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { barbershops, isLoading, isRefreshing, error, reload: load };
}
