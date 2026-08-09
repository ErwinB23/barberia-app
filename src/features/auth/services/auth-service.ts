import { supabase } from '@/infrastructure/supabase/client';

import type { SignInInput, SignUpInput, SignUpResult } from '@/features/auth/types';

export async function signInWithPassword(input: SignInInput) {
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    throw error;
  }
}

export async function signUpWithPassword(input: SignUpInput): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
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
    requiresEmailConfirmation: data.session === null,
  };
}

export async function signOutCurrentSession() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
