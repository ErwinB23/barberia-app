import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getInvitationErrorMessage } from '../errors';
import { getRecipientInvitations } from '../queries';
import type { RecipientInvitation } from '../types';

export function useRecipientInvitations(userId: string | null) {
  const hasLoaded = useRef(false);
  const [invitations, setInvitations] = useState<RecipientInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setInvitations([]);
      setIsLoading(false);
      return;
    }
    if (hasLoaded.current) setIsRefreshing(true);
    setError(null);
    try {
      setInvitations(await getRecipientInvitations());
      hasLoaded.current = true;
    } catch (loadError) {
      setInvitations([]);
      setError(getInvitationErrorMessage(loadError, 'load'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { invitations, isLoading, isRefreshing, error, reload: load };
}
