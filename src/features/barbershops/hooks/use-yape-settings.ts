import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getBarbershopErrorMessage } from '../errors';
import { getYapeSettings } from '../queries';
import type { MembershipRole, YapeSettings } from '../types';

export function useYapeSettings(userId: string, barbershopId: string | null) {
  const [settings, setSettings] = useState<YapeSettings | null>(null);
  const [role, setRole] = useState<MembershipRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!barbershopId) {
      setError('El identificador de la barbería no es válido.');
      setIsLoading(false);
      return;
    }

    setError(null);

    try {
      const result = await getYapeSettings(userId, barbershopId);
      setRole(result.role);
      setSettings(result.settings);
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

  return { settings, role, isLoading, error, reload: load };
}
