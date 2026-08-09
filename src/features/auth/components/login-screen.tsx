import { useState } from 'react';

import { getAuthErrorMessage } from '@/features/auth/auth-errors';
import { AuthFooter } from '@/features/auth/components/auth-footer';
import { AuthFormField } from '@/features/auth/components/auth-form-field';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  normalizeLoginInput,
  validateLoginForm,
  type LoginFormErrors,
} from '@/features/auth/validation';
import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';

export function LoginScreen() {
  const { signIn, initializationError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const input = normalizeLoginInput({ email, password });
    const nextErrors = validateLoginForm(input);

    setErrors(nextErrors);
    setRequestError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(input);
    } catch (error) {
      setRequestError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleError = requestError ?? initializationError;

  return (
    <AuthScreen
      description="Accede para administrar tu cuenta y tus próximas experiencias en la barbería."
      title="Bienvenido"
    >
      {visibleError ? <StatusMessage message={visibleError} /> : null}
      <AuthFormField
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
        keyboardType="email-address"
        label="Correo electrónico"
        onChangeText={(value) => {
          setEmail(value);
          setErrors((current) => ({ ...current, email: undefined }));
          setRequestError(null);
        }}
        placeholder="nombre@correo.com"
        returnKeyType="next"
        textContentType="emailAddress"
        value={email}
      />
      <AuthFormField
        autoCapitalize="none"
        autoComplete="current-password"
        error={errors.password}
        label="Contraseña"
        onChangeText={(value) => {
          setPassword(value);
          setErrors((current) => ({ ...current, password: undefined }));
          setRequestError(null);
        }}
        onSubmitEditing={() => void submit()}
        returnKeyType="done"
        secureTextEntry
        textContentType="password"
        value={password}
      />
      <ActionButton isLoading={isSubmitting} label="Iniciar sesión" onPress={() => void submit()} />
      <AuthFooter href="./register" label="Crear cuenta" prompt="¿Aún no tienes una cuenta?" />
    </AuthScreen>
  );
}
