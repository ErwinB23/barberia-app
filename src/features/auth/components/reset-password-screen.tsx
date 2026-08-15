import { useRouter } from 'expo-router';
import { useState } from 'react';

import { getAuthErrorMessage } from '@/features/auth/auth-errors';
import { AuthFooter } from '@/features/auth/components/auth-footer';
import { AuthFormField } from '@/features/auth/components/auth-form-field';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { validateNewPasswordForm, type NewPasswordFormErrors } from '@/features/auth/validation';
import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';

export function ResetPasswordScreen() {
  const router = useRouter();
  const { session, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<NewPasswordFormErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (field: keyof NewPasswordFormErrors) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setRequestError(null);
  };

  const submit = async () => {
    const nextErrors = validateNewPasswordForm({ password, passwordConfirmation });

    setErrors(nextErrors);
    setRequestError(null);

    if (Object.keys(nextErrors).length > 0 || !session) return;

    setIsSubmitting(true);

    try {
      await updatePassword(password);
      router.replace('/');
    } catch (error) {
      setRequestError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreen
      description="Elige una contraseña nueva para recuperar el acceso a tu cuenta."
      title="Nueva contraseña"
    >
      {!session ? (
        <StatusMessage message="El enlace no es válido o ha vencido. Solicita uno nuevo." />
      ) : null}
      {requestError ? <StatusMessage message={requestError} /> : null}
      <AuthFormField
        autoCapitalize="none"
        autoComplete="new-password"
        editable={Boolean(session) && !isSubmitting}
        error={errors.password}
        label="Nueva contraseña"
        onChangeText={(value) => {
          setPassword(value);
          clearFieldError('password');
        }}
        secureTextEntry
        textContentType="newPassword"
        value={password}
      />
      <AuthFormField
        autoCapitalize="none"
        autoComplete="new-password"
        editable={Boolean(session) && !isSubmitting}
        error={errors.passwordConfirmation}
        label="Confirmar contraseña"
        onChangeText={(value) => {
          setPasswordConfirmation(value);
          clearFieldError('passwordConfirmation');
        }}
        onSubmitEditing={() => void submit()}
        returnKeyType="done"
        secureTextEntry
        textContentType="newPassword"
        value={passwordConfirmation}
      />
      <ActionButton
        disabled={!session}
        isLoading={isSubmitting}
        label="Guardar contraseña"
        onPress={() => void submit()}
      />
      {!session ? (
        <AuthFooter
          href="../../forgot-password"
          label="Solicitar otro enlace"
          prompt="¿Necesitas empezar de nuevo?"
        />
      ) : null}
    </AuthScreen>
  );
}
