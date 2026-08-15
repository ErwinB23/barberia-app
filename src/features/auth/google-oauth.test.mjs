import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createGoogleOAuthCredentials,
  getGoogleOAuthCallbackUrl,
  startGoogleOAuth,
} from './google-oauth.ts';
import { getLoginSubmissionState } from './login-submission.ts';

test('construye callbacks Google seguros para web y para el scheme nativo real', () => {
  assert.equal(
    getGoogleOAuthCallbackUrl('http://localhost:8081/auth/callback'),
    'http://localhost:8081/auth/callback?source=google',
  );
  assert.equal(
    getGoogleOAuthCallbackUrl('barberiaapp://auth/callback'),
    'barberiaapp://auth/callback?source=google',
  );
});

test('web deja que Supabase redirija y native delega la apertura al navegador seguro', () => {
  const redirectTo = 'barberiaapp://auth/callback?source=google';

  assert.deepEqual(createGoogleOAuthCredentials(redirectTo, 'web'), {
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { prompt: 'select_account' },
    },
  });
  assert.deepEqual(createGoogleOAuthCredentials(redirectTo, 'native'), {
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { prompt: 'select_account' },
      skipBrowserRedirect: true,
    },
  });
});

test('en web inicia OAuth sin abrir un flujo paralelo de navegador', async () => {
  const calls = [];

  const result = await startGoogleOAuth('web', 'http://localhost:8081/auth/callback', {
    signInWithOAuth: async (credentials) => {
      calls.push(['oauth', credentials]);
      return { data: { url: 'https://accounts.google.com/oauth' }, error: null };
    },
    openAuthSessionAsync: async () => {
      calls.push(['browser']);
      return { type: 'cancel' };
    },
  });

  assert.equal(result, 'redirecting');
  assert.equal(calls.length, 1);
});

test('en native entrega el callback a Expo Router y representa cancelación sin error falso', async () => {
  const browserResults = [
    { type: 'success', url: 'barberiaapp://auth/callback?source=google&code=oauth-code' },
    { type: 'cancel' },
  ];
  const calls = [];
  const dependencies = {
    signInWithOAuth: async () => ({
      data: { url: 'https://project.supabase.co/auth/v1/authorize' },
      error: null,
    }),
    openAuthSessionAsync: async (url, redirectTo) => {
      calls.push([url, redirectTo]);
      return browserResults.shift();
    },
  };

  assert.equal(
    await startGoogleOAuth('native', 'barberiaapp://auth/callback', dependencies),
    'callback-received',
  );
  assert.equal(
    await startGoogleOAuth('native', 'barberiaapp://auth/callback', dependencies),
    'cancelled',
  );
  assert.deepEqual(calls[0], [
    'https://project.supabase.co/auth/v1/authorize',
    'barberiaapp://auth/callback?source=google',
  ]);
});

test('propaga errores de Supabase y rechaza respuestas nativas incompletas', async () => {
  const providerError = { code: 'provider_disabled' };

  await assert.rejects(
    startGoogleOAuth('web', 'http://localhost:8081/auth/callback', {
      signInWithOAuth: async () => ({ data: { url: null }, error: providerError }),
      openAuthSessionAsync: async () => ({ type: 'cancel' }),
    }),
    (error) => error === providerError,
  );

  await assert.rejects(
    startGoogleOAuth('native', 'barberiaapp://auth/callback', {
      signInWithOAuth: async () => ({ data: { url: null }, error: null }),
      openAuthSessionAsync: async () => ({ type: 'cancel' }),
    }),
    (error) => error?.code === 'oauth_url_missing',
  );
});

test('expone loading separado y bloquea intentos dobles durante cualquier acceso', () => {
  assert.deepEqual(getLoginSubmissionState(null), {
    isBusy: false,
    isPasswordLoading: false,
    isGoogleLoading: false,
  });
  assert.deepEqual(getLoginSubmissionState('password'), {
    isBusy: true,
    isPasswordLoading: true,
    isGoogleLoading: false,
  });
  assert.deepEqual(getLoginSubmissionState('google'), {
    isBusy: true,
    isPasswordLoading: false,
    isGoogleLoading: true,
  });
});
