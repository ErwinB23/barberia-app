import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { TextInput } from 'react-native';

import { getAuthErrorMessage } from '@/features/auth/auth-errors';
import {
  getPasswordResetDestination,
  PASSWORD_RESET_SUCCESS_MESSAGE,
} from '@/features/auth/auth-flow';
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
  const [isComplete, setIsComplete] = useState(false);
  const passwordConfirmationInputRef = useRef<TextInput>(null);

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
      setIsComplete(true);
    } catch (error) {
      setRequestError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <AuthScreen
        description="Ya puedes continuar con tu cuenta de forma segura."
        title="Contraseña actualizada"
        variant="status"
      >
        <StatusMessage message={PASSWORD_RESET_SUCCESS_MESSAGE} tone="success" />
        <ActionButton
          label="Continuar"
          onPress={() => router.replace(getPasswordResetDestination(Boolean(session)))}
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      description="Elige una contraseña nueva y confírmala para recuperar el acceso."
      title="Nueva contraseña"
    >
      {!session ? (
        <>
          <StatusMessage message="El enlace no es válido o ha vencido. Solicita uno nuevo." />
          <AuthFooter href="../../forgot-password" label="Solicitar otro enlace" />
        </>
      ) : (
        <>
          {requestError ? <StatusMessage message={requestError} /> : null}
          <AuthFormField
            autoCapitalize="none"
            autoComplete="new-password"
            blurOnSubmit={false}
            editable={!isSubmitting}
            error={errors.password}
            helperText="Mínimo 8 caracteres."
            label="Nueva contraseña"
            onChangeText={(value) => {
              setPassword(value);
              clearFieldError('password');
            }}
            onSubmitEditing={() => passwordConfirmationInputRef.current?.focus()}
            returnKeyType="next"
            secureTextEntry
            textContentType="newPassword"
            value={password}
          />
          <AuthFormField
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!isSubmitting}
            error={errors.passwordConfirmation}
            inputRef={passwordConfirmationInputRef}
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
            isLoading={isSubmitting}
            label="Actualizar contraseña"
            onPress={() => void submit()}
          />
        </>
      )}
    </AuthScreen>
  );
}
