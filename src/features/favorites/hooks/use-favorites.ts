import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getFavoriteErrorMessage } from '../errors';
import { getFavoriteBarbershops } from '../queries';
import type { FavoriteBarbershop } from '../types';

export function useFavorites(userId: string | null) {
  const hasLoaded = useRef(false);
  const [favorites, setFavorites] = useState<FavoriteBarbershop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    if (hasLoaded.current) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      setFavorites(await getFavoriteBarbershops(userId));
      hasLoaded.current = true;
    } catch (loadError) {
      setError(getFavoriteErrorMessage(loadError));
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

  return { favorites, isLoading, isRefreshing, error, reload: load };
}
