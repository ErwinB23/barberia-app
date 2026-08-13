import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';

import { getInvitationErrorMessage } from '../errors';
import { getAdminInvitations, getInvitationManagementRole } from '../queries';
import type { AdminInvitation, MembershipRole } from '../types';

export function useAdminInvitations(barbershopId: string | null) {
  const { user } = useAuth();
  const hasLoaded = useRef(false);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [role, setRole] = useState<MembershipRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !barbershopId) {
      setInvitations([]);
      setRole(null);
      setError('El identificador de la barbería no es válido.');
      setIsLoading(false);
      return;
    }

    if (hasLoaded.current) setIsRefreshing(true);
    setError(null);
    try {
      const nextRole = await getInvitationManagementRole(user.id, barbershopId);
      setRole(nextRole);
      setInvitations(nextRole === 'administrator' ? await getAdminInvitations(barbershopId) : []);
      hasLoaded.current = true;
    } catch (loadError) {
      setInvitations([]);
      setError(getInvitationErrorMessage(loadError, 'load'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [barbershopId, user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { invitations, role, isLoading, isRefreshing, error, reload: load };
}
