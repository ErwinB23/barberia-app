import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { getAuthErrorMessage } from '@/features/auth/auth-errors';
import { AuthFooter } from '@/features/auth/components/auth-footer';
import { AuthFormField } from '@/features/auth/components/auth-form-field';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  normalizeRegisterInput,
  validateRegisterForm,
  type RegisterFormErrors,
} from '@/features/auth/validation';
import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

export function RegisterScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const phoneInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const passwordConfirmationInputRef = useRef<TextInput>(null);

  const clearFieldError = (field: keyof RegisterFormErrors) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setRequestError(null);
  };

  const submit = async () => {
    const input = normalizeRegisterInput({
      fullName,
      phone,
      email,
      password,
      passwordConfirmation,
    });
    const nextErrors = validateRegisterForm(input);

    setErrors(nextErrors);
    setRequestError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUp({
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        password: input.password,
      });

      if (result.requiresEmailConfirmation) {
        setConfirmationEmail(input.email);
      }
    } catch (error) {
      setRequestError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmationEmail) {
    return (
      <AuthScreen
        description="Te enviamos un enlace para confirmar tu cuenta."
        title="Revisa tu correo"
        variant="status"
      >
        <StatusMessage
          message={`Enviamos un enlace de confirmación a ${confirmationEmail}. Después de confirmar, vuelve e inicia sesión.`}
          tone="success"
        />
        <AuthFooter
          href="./login"
          label="Volver a iniciar sesión"
          prompt="Cuando hayas confirmado tu correo"
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen description="Completa tus datos para crear tu cuenta." title="Crear cuenta">
      {requestError ? <StatusMessage message={requestError} /> : null}
      <View style={styles.formSection}>
        <ThemedText style={styles.sectionLabel}>Datos personales</ThemedText>
        <AuthFormField
          autoCapitalize="words"
          autoComplete="name"
          blurOnSubmit={false}
          editable={!isSubmitting}
          error={errors.fullName}
          label="Nombre completo"
          maxLength={120}
          onChangeText={(value) => {
            setFullName(value);
            clearFieldError('fullName');
          }}
          onSubmitEditing={() => phoneInputRef.current?.focus()}
          returnKeyType="next"
          textContentType="name"
          value={fullName}
        />
        <AuthFormField
          autoComplete="tel"
          blurOnSubmit={false}
          editable={!isSubmitting}
          error={errors.phone}
          inputRef={phoneInputRef}
          keyboardType="phone-pad"
          label="Teléfono"
          maxLength={30}
          onChangeText={(value) => {
            setPhone(value);
            clearFieldError('phone');
          }}
          onSubmitEditing={() => emailInputRef.current?.focus()}
          returnKeyType="next"
          textContentType="telephoneNumber"
          value={phone}
        />
      </View>
      <View style={styles.formSection}>
        <ThemedText style={styles.sectionLabel}>Acceso</ThemedText>
        <AuthFormField
          autoCapitalize="none"
          autoComplete="email"
          blurOnSubmit={false}
          editable={!isSubmitting}
          error={errors.email}
          inputRef={emailInputRef}
          keyboardType="email-address"
          label="Correo electrónico"
          onChangeText={(value) => {
            setEmail(value);
            clearFieldError('email');
          }}
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          returnKeyType="next"
          textContentType="emailAddress"
          value={email}
        />
        <AuthFormField
          autoCapitalize="none"
          autoComplete="new-password"
          blurOnSubmit={false}
          editable={!isSubmitting}
          error={errors.password}
          helperText="Mínimo 8 caracteres."
          inputRef={passwordInputRef}
          label="Contraseña"
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
      </View>
      <ActionButton isLoading={isSubmitting} label="Crear cuenta" onPress={() => void submit()} />
      <AuthFooter href="./login" label="Iniciar sesión" prompt="¿Ya tienes una cuenta?" />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  formSection: {
    gap: Spacing.three,
  },
  sectionLabel: {
    fontSize: TypeScale.body,
    fontWeight: '700',
  },
});
