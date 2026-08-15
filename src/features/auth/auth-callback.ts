export type AuthCallbackIntent = 'complete-sign-in' | 'password-recovery';

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

    return { kind: 'invalid' };
  } catch {
    return { kind: 'invalid' };
  }
}

export function getAuthCallbackDestination(intent: AuthCallbackIntent) {
  return intent === 'password-recovery' ? './reset-password' : '/';
}

export async function completeAuthCallback(url: string, handlers: AuthCallbackHandlers) {
  const callback = parseAuthCallbackUrl(url);

  if (callback.kind === 'error') {
    throw new AuthCallbackError(callback.errorCode ?? 'auth_callback_error');
  }

  if (callback.kind === 'invalid') {
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
