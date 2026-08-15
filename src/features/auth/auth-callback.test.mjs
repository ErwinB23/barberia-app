import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AUTH_CALLBACK_COPY,
  completeAuthCallback,
  completeAuthCallbackOnce,
  finishAuthCallback,
  getAuthCallbackRouteAction,
  getAuthCallbackDestination,
  parseAuthCallbackUrl,
} from './auth-callback.ts';
import { getPasswordResetDestination, PASSWORD_RESET_SUCCESS_MESSAGE } from './auth-flow.ts';

test('reconoce un callback implícito de recuperación sin exponer parámetros ajenos', () => {
  const callback = parseAuthCallbackUrl(
    'barberiaapp://auth/callback#access_token=access&refresh_token=refresh&type=recovery',
  );

  assert.deepEqual(callback, {
    kind: 'tokens',
    accessToken: 'access',
    refreshToken: 'refresh',
    intent: 'password-recovery',
  });
  assert.equal(getAuthCallbackDestination(callback.intent), '/auth/reset-password');
});

test('reconoce confirmación de email y código PKCE para completar el acceso', () => {
  const confirmation = parseAuthCallbackUrl(
    'https://app.example.com/auth/callback#access_token=access&refresh_token=refresh&type=signup',
  );
  const pkce = parseAuthCallbackUrl(
    'https://app.example.com/auth/callback?code=verification-code&type=signup',
  );

  assert.equal(confirmation.kind, 'tokens');
  assert.equal(confirmation.intent, 'complete-sign-in');
  assert.deepEqual(pkce, {
    kind: 'code',
    code: 'verification-code',
    intent: 'complete-sign-in',
  });
  assert.equal(getAuthCallbackDestination(confirmation.intent), '/');
});

test('completa el callback de Google sin alterar confirmación ni recuperación', async () => {
  const google = parseAuthCallbackUrl(
    'https://app.example.com/auth/callback?source=google&code=google-code',
  );
  const confirmation = parseAuthCallbackUrl(
    'https://app.example.com/auth/callback?code=confirmation-code&type=signup',
  );
  const recovery = parseAuthCallbackUrl(
    'barberiaapp://auth/callback?source=google&code=recovery-code&type=recovery',
  );

  assert.equal(google.kind, 'code');
  assert.equal(google.intent, 'oauth-sign-in');
  assert.equal(confirmation.kind, 'code');
  assert.equal(confirmation.intent, 'complete-sign-in');
  assert.equal(recovery.kind, 'code');
  assert.equal(recovery.intent, 'password-recovery');
  assert.equal(getAuthCallbackDestination(google.intent), '/');

  const exchangedCodes = [];
  const intent = await completeAuthCallback(
    'https://app.example.com/auth/callback?source=google&code=google-code',
    {
      exchangeCodeForSession: async (code) => exchangedCodes.push(code),
      setSession: async () => undefined,
    },
  );

  assert.equal(intent, 'oauth-sign-in');
  assert.deepEqual(exchangedCodes, ['google-code']);
});

test('distingue un callback vacío de un enlace real incompleto', () => {
  assert.deepEqual(parseAuthCallbackUrl('barberiaapp://auth/callback'), { kind: 'empty' });
  assert.deepEqual(parseAuthCallbackUrl('https://app.example.com/auth/callback?source=manual'), {
    kind: 'empty',
  });
  assert.deepEqual(
    parseAuthCallbackUrl('https://app.example.com/auth/callback?token_hash=incomplete'),
    { kind: 'invalid' },
  );
});

test('conserva solo el código seguro de un error real del proveedor', () => {
  assert.deepEqual(
    parseAuthCallbackUrl(
      'barberiaapp://auth/callback#error=access_denied&error_code=otp_expired&error_description=detalle-interno',
    ),
    { kind: 'error', errorCode: 'otp_expired' },
  );
});

test('completa el callback con las APIs oficiales sin persistir tokens manualmente', async () => {
  const calls = [];
  const intent = await completeAuthCallback(
    'barberiaapp://auth/callback#access_token=access&refresh_token=refresh&type=recovery',
    {
      exchangeCodeForSession: async (code) => calls.push(['code', code]),
      setSession: async (session) => calls.push(['session', session]),
    },
  );

  assert.equal(intent, 'password-recovery');
  assert.deepEqual(calls, [['session', { accessToken: 'access', refreshToken: 'refresh' }]]);
});

test('intercambia un callback PKCE y rechaza enlaces inválidos', async () => {
  const calls = [];
  const handlers = {
    exchangeCodeForSession: async (code) => calls.push(code),
    setSession: async () => undefined,
  };

  assert.equal(
    await completeAuthCallback('https://app.example.com/auth/callback?code=pkce-code', handlers),
    'complete-sign-in',
  );
  assert.deepEqual(calls, ['pkce-code']);
  await assert.rejects(
    completeAuthCallback('barberiaapp://auth/callback', handlers),
    /invalid_auth_callback/,
  );
});

test('procesa una sola vez el mismo callback PKCE mientras está en curso', async () => {
  const calls = [];
  let releaseExchange;
  const exchangeStarted = new Promise((resolve) => {
    releaseExchange = resolve;
  });
  const handlers = {
    exchangeCodeForSession: async (code) => {
      calls.push(code);
      await exchangeStarted;
    },
    setSession: async () => undefined,
  };
  const url = 'https://app.example.com/auth/callback?code=single-use-code&type=recovery';

  const firstCompletion = completeAuthCallbackOnce(url, handlers);
  const secondCompletion = completeAuthCallbackOnce(url, handlers);

  assert.equal(firstCompletion, secondCompletion);
  assert.deepEqual(calls, ['single-use-code']);
  releaseExchange();
  assert.deepEqual(await Promise.all([firstCompletion, secondCompletion]), [
    'password-recovery',
    'password-recovery',
  ]);
});

test('no vuelve a intercambiar un callback PKCE ya consumido', async () => {
  const calls = [];
  const handlers = {
    exchangeCodeForSession: async (code) => calls.push(code),
    setSession: async () => undefined,
  };
  const url = 'https://app.example.com/auth/callback?code=consumed-code&type=recovery';

  assert.equal(await completeAuthCallbackOnce(url, handlers), 'password-recovery');
  assert.equal(await completeAuthCallbackOnce(url, handlers), 'password-recovery');
  assert.deepEqual(calls, ['consumed-code']);
});

test('redirige un callback vacío según la sesión sin mostrar un error falso', () => {
  assert.deepEqual(getAuthCallbackRouteAction('https://app.example.com/auth/callback', true), {
    kind: 'redirect',
    destination: '/',
  });
  assert.deepEqual(getAuthCallbackRouteAction('https://app.example.com/auth/callback', false), {
    kind: 'redirect',
    destination: '/login',
  });
  assert.deepEqual(getAuthCallbackRouteAction(null, false), {
    kind: 'redirect',
    destination: '/login',
  });
});

test('mantiene como procesable un enlace real para poder mostrar errores legítimos', () => {
  const url = 'https://app.example.com/auth/callback?code=invalid-code&type=recovery';

  assert.deepEqual(getAuthCallbackRouteAction(url, false), { kind: 'process', url });
});

test('abandona el callback consumido antes de navegar al restablecimiento', () => {
  const calls = [];

  finishAuthCallback('password-recovery', {
    platform: 'native',
    clearNativeInitialUrl: () => calls.push('clear'),
    replace: (destination) => calls.push(destination),
  });

  assert.deepEqual(calls, ['clear', '/auth/reset-password']);
  assert.equal(getAuthCallbackDestination('password-recovery'), '/auth/reset-password');
});

test('en web limpia el callback mediante replace sin depender de clearInitialURL', () => {
  const calls = [];

  finishAuthCallback('password-recovery', {
    platform: 'web',
    clearNativeInitialUrl: () => calls.push('clear'),
    replace: (destination) => calls.push(destination),
  });

  assert.deepEqual(calls, ['/auth/reset-password']);
});

test('el restablecimiento exitoso nunca vuelve al callback consumido', () => {
  assert.equal(getPasswordResetDestination(true), '/');
  assert.equal(getPasswordResetDestination(false), '/login');
  assert.notEqual(getPasswordResetDestination(true), '/auth/callback');
  assert.notEqual(getPasswordResetDestination(false), '/auth/callback');
});

test('mantiene textos coherentes para loading, error y éxito', () => {
  assert.deepEqual(AUTH_CALLBACK_COPY.loading, {
    title: 'Validando enlace...',
    description: 'Estamos validando el enlace de autenticación de forma segura.',
  });
  assert.deepEqual(AUTH_CALLBACK_COPY.error, {
    title: 'No pudimos validar este enlace.',
    description: 'Puede haber vencido o ya haber sido utilizado.',
  });
  assert.equal(PASSWORD_RESET_SUCCESS_MESSAGE, 'Contraseña actualizada correctamente.');
});
