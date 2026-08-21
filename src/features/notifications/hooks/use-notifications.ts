import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getNotificationErrorMessage } from '../errors';
import { setNotificationReadStateLocally } from '../notification-open-flow';
import { getNotifications } from '../queries';
import type { UserNotification } from '../types';

export function useNotifications(userId: string | null) {
  const hasLoaded = useRef(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    if (hasLoaded.current) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      setNotifications(await getNotifications(userId));
      hasLoaded.current = true;
    } catch (loadError) {
      setError(getNotificationErrorMessage(loadError));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  const updateReadStateLocally = useCallback((notificationId: string, isRead: boolean) => {
    setNotifications((currentNotifications) =>
      setNotificationReadStateLocally(currentNotifications, notificationId, isRead),
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return {
    notifications,
    isLoading,
    isRefreshing,
    error,
    reload: load,
    updateReadStateLocally,
  };
}
