import { useEffect } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/infrastructure/supabase/client';

export function useAuthAutoRefresh() {
  useEffect(() => {
    if (process.env.EXPO_OS === 'web') {
      return;
    }

    const updateAutoRefresh = (state: string) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
        return;
      }

      supabase.auth.stopAutoRefresh();
    };

    updateAutoRefresh(AppState.currentState);
    const subscription = AppState.addEventListener('change', updateAutoRefresh);

    return () => {
      subscription.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);
}
