import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

import { getRegistrationPhone } from '@/features/profile/profile-metadata';
import type { ParsedProfileFormValues } from '@/features/profile/profile-domain';
import { loadOwnProfile, updateOwnProfile } from '@/features/profile/services/profile-service';
import type { UserProfile } from '@/features/profile/types';

export function useProfile(user: User) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const registrationPhone = getRegistrationPhone(user.user_metadata);

  useEffect(() => {
    let isActive = true;

    void loadOwnProfile(user.id, registrationPhone)
      .then((nextProfile) => {
        if (isActive) {
          setProfile(nextProfile);
        }
      })
      .catch(() => {
        if (isActive) {
          setProfile(null);
          setError('No pudimos cargar tu perfil.');
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [registrationPhone, reloadKey, user.id]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadKey((currentKey) => currentKey + 1);
  }, []);

  const save = useCallback(
    async (values: ParsedProfileFormValues) => {
      const nextProfile = await updateOwnProfile(user.id, values);
      setProfile(nextProfile);
      return nextProfile;
    },
    [user.id],
  );

  return { profile, isLoading, error, reload, save };
}
