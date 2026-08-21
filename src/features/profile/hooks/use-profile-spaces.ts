import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { buildProfileSpaces, type ProfileSpace } from '../profile-domain';
import { loadOwnProfileSpaces } from '../services/profile-service';

export function useProfileSpaces(userId: string) {
  const [spaces, setSpaces] = useState<ProfileSpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);

    try {
      setSpaces(buildProfileSpaces(await loadOwnProfileSpaces(userId)));
    } catch {
      setSpaces([]);
      setError('No pudimos cargar tus espacios en este momento.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { spaces, isLoading, error, reload: load };
}
