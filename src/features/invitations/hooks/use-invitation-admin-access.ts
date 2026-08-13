import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';

import { getInvitationErrorMessage } from '../errors';
import { getInvitationManagementRole } from '../queries';
import type { MembershipRole } from '../types';

export function useInvitationAdminAccess(barbershopId: string | null) {
  const { user } = useAuth();
  const [role, setRole] = useState<MembershipRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !barbershopId) {
      setRole(null);
      setError('El identificador de la barbería no es válido.');
      setIsLoading(false);
      return;
    }
    setError(null);
    try {
      setRole(await getInvitationManagementRole(user.id, barbershopId));
    } catch (loadError) {
      setRole(null);
      setError(getInvitationErrorMessage(loadError, 'load'));
    } finally {
      setIsLoading(false);
    }
  }, [barbershopId, user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { role, isLoading, error, reload: load };
}
