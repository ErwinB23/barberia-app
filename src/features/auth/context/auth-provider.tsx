import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';

import { getAuthErrorMessage } from '@/features/auth/auth-errors';
import { AuthContext } from '@/features/auth/context/auth-context';
import { useAuthAutoRefresh } from '@/features/auth/hooks/use-auth-auto-refresh';
import {
  signInWithPassword,
  signOutCurrentSession,
  signUpWithPassword,
} from '@/features/auth/services/auth-service';
import type { SignInInput, SignUpInput } from '@/features/auth/types';
import { supabase } from '@/infrastructure/supabase/client';

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useAuthAutoRefresh();

  useEffect(() => {
    let isMounted = true;
    let hasReceivedAuthEvent = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      hasReceivedAuthEvent = true;
      setSession(nextSession);
      setInitializationError(null);
      setIsLoading(false);
    });

    const loadInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!isMounted || hasReceivedAuthEvent) {
          return;
        }

        if (error) {
          setInitializationError(getAuthErrorMessage(error));
        } else {
          setSession(data.session);
        }
      } catch (error) {
        if (isMounted && !hasReceivedAuthEvent) {
          setInitializationError(getAuthErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (input: SignInInput) => {
    await signInWithPassword(input);
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    return signUpWithPassword(input);
  }, []);

  const signOut = useCallback(async () => {
    await signOutCurrentSession();
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      initializationError,
      signIn,
      signUp,
      signOut,
    }),
    [initializationError, isLoading, session, signIn, signOut, signUp],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
