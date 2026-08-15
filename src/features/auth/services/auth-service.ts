import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { completeAuthCallbackOnce, type AuthCallbackIntent } from '@/features/auth/auth-callback';
import { requiresEmailConfirmation } from '@/features/auth/auth-flow';
import { startGoogleOAuth, type GoogleOAuthPlatform } from '@/features/auth/google-oauth';
import { supabase } from '@/infrastructure/supabase/client';

import type { SignInInput, SignUpInput, SignUpResult } from '@/features/auth/types';

export function getAuthCallbackUrl() {
  return Linking.createURL('auth/callback');
}

export async function signInWithPassword(input: SignInInput) {
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    throw error;
  }
}

export async function signInWithGoogle() {
  const platform: GoogleOAuthPlatform = process.env.EXPO_OS === 'web' ? 'web' : 'native';

  return startGoogleOAuth(platform, getAuthCallbackUrl(), {
    signInWithOAuth: (credentials) => supabase.auth.signInWithOAuth(credentials),
    openAuthSessionAsync: WebBrowser.openAuthSessionAsync,
  });
}

export async function signUpWithPassword(input: SignUpInput): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: getAuthCallbackUrl(),
      data: {
        full_name: input.fullName,
        phone: input.phone,
      },
    },
  });

  if (error) {
    throw error;
  }

  return {
    requiresEmailConfirmation: requiresEmailConfirmation(data.session),
  };
}

export async function requestPasswordResetEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthCallbackUrl(),
  });

  if (error) {
    throw error;
  }
}

export async function completeSupabaseAuthCallback(url: string): Promise<AuthCallbackIntent> {
  return completeAuthCallbackOnce(url, {
    exchangeCodeForSession: async (code) => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    },
    setSession: async ({ accessToken, refreshToken }) => {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
    },
  });
}

export async function updateCurrentUserPassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw error;
  }
}

export async function signOutCurrentSession() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
