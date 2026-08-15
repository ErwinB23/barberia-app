export type GoogleOAuthPlatform = 'native' | 'web';
export type GoogleOAuthResult = 'redirecting' | 'callback-received' | 'cancelled';

type GoogleOAuthCredentials = {
  provider: 'google';
  options: {
    redirectTo: string;
    queryParams: { prompt: 'select_account' };
    skipBrowserRedirect?: true;
  };
};

type GoogleOAuthAuthorizationResult = {
  data: { url: string | null };
  error: unknown | null;
};

type GoogleOAuthBrowserResult = {
  type: string;
  url?: string;
};

type GoogleOAuthDependencies = {
  signInWithOAuth: (credentials: GoogleOAuthCredentials) => Promise<GoogleOAuthAuthorizationResult>;
  openAuthSessionAsync: (url: string, redirectTo: string) => Promise<GoogleOAuthBrowserResult>;
};

export class GoogleOAuthError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = 'GoogleOAuthError';
    this.code = code;
  }
}

export function getGoogleOAuthCallbackUrl(authCallbackUrl: string) {
  const callbackUrl = new URL(authCallbackUrl);
  callbackUrl.searchParams.set('source', 'google');
  return callbackUrl.toString();
}

export function createGoogleOAuthCredentials(
  redirectTo: string,
  platform: GoogleOAuthPlatform,
): GoogleOAuthCredentials {
  return {
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { prompt: 'select_account' },
      ...(platform === 'native' ? { skipBrowserRedirect: true as const } : {}),
    },
  };
}

export async function startGoogleOAuth(
  platform: GoogleOAuthPlatform,
  authCallbackUrl: string,
  dependencies: GoogleOAuthDependencies,
): Promise<GoogleOAuthResult> {
  const redirectTo = getGoogleOAuthCallbackUrl(authCallbackUrl);
  const { data, error } = await dependencies.signInWithOAuth(
    createGoogleOAuthCredentials(redirectTo, platform),
  );

  if (error) {
    throw error;
  }

  if (!data.url) {
    throw new GoogleOAuthError('oauth_url_missing');
  }

  if (platform === 'web') {
    return 'redirecting';
  }

  const browserResult = await dependencies.openAuthSessionAsync(data.url, redirectTo);

  if (browserResult.type === 'success' && browserResult.url) {
    return 'callback-received';
  }

  if (browserResult.type === 'cancel' || browserResult.type === 'dismiss') {
    return 'cancelled';
  }

  throw new GoogleOAuthError('oauth_browser_failed');
}
