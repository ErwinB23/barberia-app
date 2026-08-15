export type AuthCallbackIntent = 'complete-sign-in' | 'password-recovery';

export const AUTH_CALLBACK_COPY = {
  loading: {
    title: 'Validando enlace...',
    description: 'Estamos validando el enlace de autenticación de forma segura.',
  },
  error: {
    title: 'No pudimos validar este enlace.',
    description: 'Puede haber vencido o ya haber sido utilizado.',
  },
} as const;

export type AuthCallbackParameters =
  | {
      kind: 'tokens';
      accessToken: string;
      refreshToken: string;
      intent: AuthCallbackIntent;
    }
  | {
      kind: 'code';
      code: string;
      intent: AuthCallbackIntent;
    }
  | { kind: 'error'; errorCode: string | null }
  | { kind: 'empty' }
  | { kind: 'invalid' };

export class AuthCallbackError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = 'AuthCallbackError';
    this.code = code;
  }
}

type AuthCallbackHandlers = {
  exchangeCodeForSession: (code: string) => Promise<unknown>;
  setSession: (session: { accessToken: string; refreshToken: string }) => Promise<unknown>;
};

type AuthCallbackNavigationHandlers = {
  platform: 'native' | 'web';
  clearNativeInitialUrl: () => void;
  replace: (destination: AuthCallbackDestination) => void;
};

type AuthCallbackDestination = '/' | '/auth/reset-password';
type EmptyAuthCallbackDestination = '/' | '/login';

export type AuthCallbackRouteAction =
  | { kind: 'process'; url: string }
  | { kind: 'redirect'; destination: EmptyAuthCallbackDestination };

const pendingPkceCallbacks = new Map<string, Promise<AuthCallbackIntent>>();
const completedPkceCallbacks = new Map<string, AuthCallbackIntent>();

const AUTH_CALLBACK_PARAMETER_NAMES = [
  'code',
  'access_token',
  'refresh_token',
  'token_hash',
  'type',
  'error',
  'error_code',
  'error_description',
] as const;

function getCallbackIntent(type: string | null): AuthCallbackIntent {
  return type === 'recovery' ? 'password-recovery' : 'complete-sign-in';
}

export function parseAuthCallbackUrl(url: string): AuthCallbackParameters {
  try {
    const parsedUrl = new URL(url);
    const queryParameters = parsedUrl.searchParams;
    const fragmentParameters = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
    const getParameter = (name: string) =>
      queryParameters.get(name) ?? fragmentParameters.get(name);
    const hasAuthCallbackParameter = AUTH_CALLBACK_PARAMETER_NAMES.some(
      (name) => queryParameters.has(name) || fragmentParameters.has(name),
    );

    if (getParameter('error')) {
      return { kind: 'error', errorCode: getParameter('error_code') };
    }

    const intent = getCallbackIntent(getParameter('type'));
    const code = getParameter('code');

    if (code) {
      return { kind: 'code', code, intent };
    }

    const accessToken = getParameter('access_token');
    const refreshToken = getParameter('refresh_token');

    if (accessToken && refreshToken) {
      return { kind: 'tokens', accessToken, refreshToken, intent };
    }

    return hasAuthCallbackParameter ? { kind: 'invalid' } : { kind: 'empty' };
  } catch {
    return { kind: 'invalid' };
  }
}

export function getAuthCallbackRouteAction(
  url: string | null,
  hasSession: boolean,
): AuthCallbackRouteAction {
  if (!url || parseAuthCallbackUrl(url).kind === 'empty') {
    return { kind: 'redirect', destination: hasSession ? '/' : '/login' };
  }

  return { kind: 'process', url };
}

export function getAuthCallbackDestination(intent: AuthCallbackIntent): AuthCallbackDestination {
  return intent === 'password-recovery' ? '/auth/reset-password' : '/';
}

export async function completeAuthCallback(url: string, handlers: AuthCallbackHandlers) {
  const callback = parseAuthCallbackUrl(url);

  if (callback.kind === 'error') {
    throw new AuthCallbackError(callback.errorCode ?? 'auth_callback_error');
  }

  if (callback.kind === 'invalid' || callback.kind === 'empty') {
    throw new AuthCallbackError('invalid_auth_callback');
  }

  if (callback.kind === 'code') {
    await handlers.exchangeCodeForSession(callback.code);
  } else {
    await handlers.setSession({
      accessToken: callback.accessToken,
      refreshToken: callback.refreshToken,
    });
  }

  return callback.intent;
}

export function completeAuthCallbackOnce(url: string, handlers: AuthCallbackHandlers) {
  const callback = parseAuthCallbackUrl(url);

  if (callback.kind !== 'code') {
    return completeAuthCallback(url, handlers);
  }

  const completedIntent = completedPkceCallbacks.get(callback.code);

  if (completedIntent) {
    return Promise.resolve(completedIntent);
  }

  const pendingCallback = pendingPkceCallbacks.get(callback.code);

  if (pendingCallback) {
    return pendingCallback;
  }

  const completion = completeAuthCallback(url, handlers);
  pendingPkceCallbacks.set(callback.code, completion);

  void completion
    .then((intent) => {
      completedPkceCallbacks.set(callback.code, intent);
    })
    .catch(() => undefined);

  void completion
    .finally(() => {
      if (pendingPkceCallbacks.get(callback.code) === completion) {
        pendingPkceCallbacks.delete(callback.code);
      }
    })
    .catch(() => undefined);

  return completion;
}

export function finishAuthCallback(
  intent: AuthCallbackIntent,
  handlers: AuthCallbackNavigationHandlers,
) {
  if (handlers.platform === 'native') {
    handlers.clearNativeInitialUrl();
  }

  handlers.replace(getAuthCallbackDestination(intent));
}
