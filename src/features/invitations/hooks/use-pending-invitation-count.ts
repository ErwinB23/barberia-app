import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getInvitationErrorMessage } from '../errors';
import { getPendingInvitationCount } from '../queries';

export function usePendingInvitationCount(userId: string | null) {
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let isActive = true;
      setError(null);
      void getPendingInvitationCount()
        .then((nextCount) => {
          if (isActive) setCount(nextCount);
        })
        .catch((loadError: unknown) => {
          if (isActive) {
            setCount(0);
            setError(getInvitationErrorMessage(loadError, 'load'));
          }
        });
      return () => {
        isActive = false;
      };
    }, [userId]),
  );

  return { count, error };
}
