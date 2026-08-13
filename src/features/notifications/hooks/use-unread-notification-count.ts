import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getNotificationErrorMessage } from '../errors';
import { getUnreadNotificationCount } from '../queries';

export function useUnreadNotificationCount(userId: string | null) {
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let isActive = true;
      setError(null);

      void getUnreadNotificationCount(userId)
        .then((nextCount) => {
          if (isActive) setCount(nextCount);
        })
        .catch((loadError: unknown) => {
          if (isActive) {
            setCount(0);
            setError(getNotificationErrorMessage(loadError));
          }
        });

      return () => {
        isActive = false;
      };
    }, [userId]),
  );

  return { count, error };
}
