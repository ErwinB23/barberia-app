import { useState } from 'react';

import { getAuthErrorMessage } from '@/features/auth/auth-errors';
import { RECOVERY_REQUEST_SUCCESS_MESSAGE } from '@/features/auth/auth-flow';
import { AuthFooter } from '@/features/auth/components/auth-footer';
import { AuthFormField } from '@/features/auth/components/auth-form-field';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  normalizeRecoveryRequestInput,
  validateRecoveryRequestForm,
  type RecoveryRequestFormErrors,
} from '@/features/auth/validation';
import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';

export function ForgotPasswordScreen() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<RecoveryRequestFormErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submit = async () => {
    const input = normalizeRecoveryRequestInput({ email });
    const nextErrors = validateRecoveryRequestForm(input);

    setEmail(input.email);
    setErrors(nextErrors);
    setRequestError(null);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      await requestPasswordReset(input.email);
      setIsSubmitted(true);
    } catch (error) {
      setRequestError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreen
      description="Te enviaremos instrucciones seguras para recuperar el acceso a tu cuenta."
      title="Olvidé mi contraseña"
    >
      {isSubmitted ? (
        <StatusMessage message={RECOVERY_REQUEST_SUCCESS_MESSAGE} tone="success" />
      ) : null}
      {requestError ? <StatusMessage message={requestError} /> : null}
      <AuthFormField
        autoCapitalize="none"
        autoComplete="email"
        editable={!isSubmitting}
        error={errors.email}
        keyboardType="email-address"
        label="Correo electrónico"
        onChangeText={(value) => {
          setEmail(value);
          setErrors({});
          setRequestError(null);
          setIsSubmitted(false);
        }}
        onSubmitEditing={() => void submit()}
        placeholder="nombre@correo.com"
        returnKeyType="done"
        textContentType="emailAddress"
        value={email}
      />
      <ActionButton
        isLoading={isSubmitting}
        label={isSubmitted ? 'Enviar nuevamente' : 'Enviar enlace'}
        onPress={() => void submit()}
      />
      <AuthFooter
        href="./login"
        label="Volver a iniciar sesión"
        prompt="¿Ya recuperaste el acceso?"
      />
    </AuthScreen>
  );
}
