import type { Session, User } from '@supabase/supabase-js';

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
  signUp: (input: SignUpInput) => Promise<SignUpResult>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
};
