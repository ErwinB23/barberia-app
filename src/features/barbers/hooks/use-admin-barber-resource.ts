import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';

import { getBarberErrorMessage, type BarberOperation } from '../errors';
import { getBarberManagementRole } from '../queries';
import type { MembershipRole } from '../types';

export function useAdminBarberResource<T>(
  barbershopId: string | null,
  loadResource: () => Promise<T>,
  operation: BarberOperation,
) {
  const { user } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [role, setRole] = useState<MembershipRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !barbershopId) {
      setData(null);
      setRole(null);
      setError('El identificador de la barbería no es válido.');
      setIsLoading(false);
      return;
    }
    setError(null);
    try {
      const nextRole = await getBarberManagementRole(user.id, barbershopId);
      setRole(nextRole);
      if (nextRole !== 'administrator') {
        setData(null);
        return;
      }
      setData(await loadResource());
    } catch (loadError) {
      setData(null);
      setError(getBarberErrorMessage(loadError, operation));
    } finally {
      setIsLoading(false);
    }
  }, [barbershopId, loadResource, operation, user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  return { data, role, isLoading, error, reload: load };
}
