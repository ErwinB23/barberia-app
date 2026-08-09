import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

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
        description="Tu cuenta fue creada y necesita confirmar el correo antes del primer acceso."
        title="Revisa tu correo"
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
    <AuthScreen
      description="Crea tu cuenta personal. Los roles y permisos se asignarán de forma segura por barbería."
      title="Crear cuenta"
    >
      {requestError ? <StatusMessage message={requestError} /> : null}
      <View style={styles.formSection}>
        <ThemedText style={styles.sectionLabel} themeColor="primary">
          DATOS PERSONALES
        </ThemedText>
        <AuthFormField
          autoCapitalize="words"
          autoComplete="name"
          error={errors.fullName}
          label="Nombre completo"
          maxLength={120}
          onChangeText={(value) => {
            setFullName(value);
            clearFieldError('fullName');
          }}
          textContentType="name"
          value={fullName}
        />
        <AuthFormField
          autoComplete="tel"
          error={errors.phone}
          keyboardType="phone-pad"
          label="Teléfono"
          maxLength={30}
          onChangeText={(value) => {
            setPhone(value);
            clearFieldError('phone');
          }}
          textContentType="telephoneNumber"
          value={phone}
        />
      </View>
      <View style={styles.formSection}>
        <ThemedText style={styles.sectionLabel} themeColor="primary">
          ACCESO
        </ThemedText>
        <AuthFormField
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
          keyboardType="email-address"
          label="Correo electrónico"
          onChangeText={(value) => {
            setEmail(value);
            clearFieldError('email');
          }}
          textContentType="emailAddress"
          value={email}
        />
        <AuthFormField
          autoCapitalize="none"
          autoComplete="new-password"
          error={errors.password}
          label="Contraseña"
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
    fontSize: TypeScale.caption,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
