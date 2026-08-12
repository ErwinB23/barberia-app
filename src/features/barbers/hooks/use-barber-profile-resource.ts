import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';

import { getBarberErrorMessage } from '../errors';
import { getBarberManagementRole, getOwnBarberProfile } from '../queries';
import type { MembershipRole, OwnBarberProfile } from '../types';

export function useBarberProfileResource<T>(
  barbershopId: string | null,
  barberId: string | null,
  loadResource: () => Promise<T>,
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
      const canEdit =
        nextRole === 'administrator' ||
        (nextOwnProfile?.isActive === true && nextOwnProfile.barberId === barberId);
      setRole(nextRole);
      setOwnProfile(nextOwnProfile);
      setData(canEdit ? await loadResource() : null);
      if (!canEdit) setError('No tienes permiso para editar este perfil de barbero.');
    } catch (loadError) {
      setData(null);
      setError(getBarberErrorMessage(loadError, 'barbers'));
    } finally {
      setIsLoading(false);
    }
  }, [barberId, barbershopId, loadResource, user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const isOwnProfile = ownProfile?.barberId === barberId;
  return { data, role, isOwnProfile, isLoading, error, reload: load };
}
