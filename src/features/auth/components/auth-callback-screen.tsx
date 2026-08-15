import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { getAuthErrorMessage } from '@/features/auth/auth-errors';
import {
  AUTH_CALLBACK_COPY,
  finishAuthCallback,
  getAuthCallbackRouteAction,
} from '@/features/auth/auth-callback';
import { AuthFooter } from '@/features/auth/components/auth-footer';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { completeSupabaseAuthCallback } from '@/features/auth/services/auth-service';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';

export function AuthCallbackScreen() {
  const router = useRouter();
  const linkingUrl = Linking.useLinkingURL();
  const { session } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const processCallback = async () => {
      const action = getAuthCallbackRouteAction(linkingUrl, Boolean(session));

      if (!isMounted) return;

      if (action.kind === 'redirect') {
        router.replace(action.destination);
        return;
      }

      setError(null);

      try {
        const intent = await completeSupabaseAuthCallback(action.url);
        if (isMounted) {
          finishAuthCallback(intent, {
            platform: Platform.OS === 'web' ? 'web' : 'native',
            clearNativeInitialUrl: Linking.clearInitialURL,
            replace: router.replace,
          });
        }
      } catch (callbackError) {
        if (isMounted) setError(getAuthErrorMessage(callbackError));
      }
    };

    void processCallback();

    return () => {
      isMounted = false;
    };
  }, [linkingUrl, router, session]);

  return (
    <AuthScreen
      description={
        error ? AUTH_CALLBACK_COPY.error.description : AUTH_CALLBACK_COPY.loading.description
      }
      title={error ? AUTH_CALLBACK_COPY.error.title : AUTH_CALLBACK_COPY.loading.title}
    >
      {error ? (
        <StatusMessage message={error} />
      ) : (
        <ThemedText themeColor="textSecondary">Validando enlace...</ThemedText>
      )}
      {error ? (
        <AuthFooter
          href="../../forgot-password"
          label="Solicitar recuperación"
          prompt="Si el enlace venció"
        />
      ) : null}
      <AuthFooter href="/login" label="Volver al acceso" prompt="También puedes" />
    </AuthScreen>
  );
}
