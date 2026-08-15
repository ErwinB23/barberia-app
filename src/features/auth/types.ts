import type { Session, User } from '@supabase/supabase-js';

import type { GoogleOAuthResult } from '@/features/auth/google-oauth';

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = SignInInput & {
  fullName: string;
  phone: string;
};

export type SignUpResult = {
  requiresEmailConfirmation: boolean;
};

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  initializationError: string | null;
  signIn: (input: SignInInput) => Promise<void>;
  signInWithGoogle: () => Promise<GoogleOAuthResult>;
  signUp: (input: SignUpInput) => Promise<SignUpResult>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
};
