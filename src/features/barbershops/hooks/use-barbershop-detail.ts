import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getBarbershopErrorMessage } from '../errors';
import { getBarbershopDetail } from '../queries';
import type { BarbershopDetail } from '../types';

export function useBarbershopDetail(userId: string, barbershopId: string | null) {
  const [detail, setDetail] = useState<BarbershopDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!barbershopId) {
      setDetail(null);
      setError('El identificador de la barbería no es válido.');
      setIsLoading(false);
      return;
    }

    setError(null);

    try {
      const nextDetail = await getBarbershopDetail(userId, barbershopId);
      setDetail(nextDetail);
      if (!nextDetail) {
        setError('La barbería solicitada no está disponible para tu cuenta.');
      }
    } catch (loadError) {
      setError(getBarbershopErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [barbershopId, userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { detail, isLoading, error, reload: load };
}
