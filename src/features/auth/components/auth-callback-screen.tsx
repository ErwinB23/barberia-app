import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { getAuthErrorMessage } from '@/features/auth/auth-errors';
import { getAuthCallbackDestination } from '@/features/auth/auth-callback';
import { AuthFooter } from '@/features/auth/components/auth-footer';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { completeSupabaseAuthCallback } from '@/features/auth/services/auth-service';
import { StatusMessage } from '@/shared/components/ui/status-message';

export function AuthCallbackScreen() {
  const router = useRouter();
  const linkingUrl = Linking.useLinkingURL();
  const processingUrl = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const processCallback = async () => {
      const url = linkingUrl ?? (await Linking.getInitialURL());

      if (!isMounted || !url || processingUrl.current === url) return;

      processingUrl.current = url;
      setError(null);

      try {
        const intent = await completeSupabaseAuthCallback(url);
        if (isMounted) router.replace(getAuthCallbackDestination(intent));
      } catch (callbackError) {
        if (isMounted) setError(getAuthErrorMessage(callbackError));
      }
    };

    void processCallback();

    return () => {
      isMounted = false;
    };
  }, [linkingUrl, router]);

  return (
    <AuthScreen
      description="Estamos validando el enlace de autenticación de forma segura."
      title={error ? 'No pudimos validar el enlace' : 'Validando enlace'}
    >
      {error ? (
        <StatusMessage message={error} />
      ) : (
        <StatusMessage message="Un momento…" tone="success" />
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
