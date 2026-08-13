import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';

import { getBarberOperationalAccess, type BarberOperationalAccess } from '../barber-domain';
import { getBarberErrorMessage, type BarberOperation } from '../errors';
import { getBarberManagementRole, getOwnBarberProfile } from '../queries';
import type { MembershipRole, OwnBarberProfile } from '../types';

export function useBarberProfileResource<T>(
  barbershopId: string | null,
  barberId: string | null,
  loadResource: (access: BarberOperationalAccess) => Promise<T>,
  operation: BarberOperation = 'barbers',
) {
  const { user } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [role, setRole] = useState<MembershipRole | null>(null);
  const [ownProfile, setOwnProfile] = useState<OwnBarberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !barbershopId || !barberId) {
      setData(null);
      setRole(null);
      setOwnProfile(null);
      setError('El perfil solicitado no es válido.');
      setIsLoading(false);
      return;
    }

    setError(null);
    try {
      const [nextRole, nextOwnProfile] = await Promise.all([
        getBarberManagementRole(user.id, barbershopId),
        getOwnBarberProfile(barbershopId),
      ]);
      const access = getBarberOperationalAccess({
        role: nextRole,
        targetBarberId: barberId,
        ownProfile: nextOwnProfile,
      });
      setRole(nextRole);
      setOwnProfile(nextOwnProfile);
      setData(access.canAccess ? await loadResource(access) : null);
      if (!access.canAccess) setError('No tienes permiso para acceder a este perfil de barbero.');
    } catch (loadError) {
      setData(null);
      setRole(null);
      setOwnProfile(null);
      setError(getBarberErrorMessage(loadError, operation));
    } finally {
      setIsLoading(false);
    }
  }, [barberId, barbershopId, loadResource, operation, user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const isOwnProfile = ownProfile?.barberId === barberId;
  const access = getBarberOperationalAccess({ role, targetBarberId: barberId ?? '', ownProfile });
  return { data, role, isOwnProfile, access, isLoading, error, reload: load };
}
