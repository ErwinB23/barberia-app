import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getAuthErrorMessage } from '@/features/auth/auth-errors';
import { AuthFooter } from '@/features/auth/components/auth-footer';
import { AuthFormField } from '@/features/auth/components/auth-form-field';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { getLoginSubmissionState, type LoginSubmission } from '@/features/auth/login-submission';
import {
  normalizeLoginInput,
  validateLoginForm,
  type LoginFormErrors,
} from '@/features/auth/validation';
import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

export function LoginScreen() {
  const theme = useTheme();
  const { signIn, signInWithGoogle, initializationError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<LoginSubmission>(null);
  const activeSubmissionRef = useRef<LoginSubmission>(null);
  const { isBusy, isGoogleLoading, isPasswordLoading } = getLoginSubmissionState(activeSubmission);

  const beginSubmission = (submission: Exclude<LoginSubmission, null>) => {
    if (activeSubmissionRef.current) {
      return false;
    }

    activeSubmissionRef.current = submission;
    setActiveSubmission(submission);
    return true;
  };

  const finishSubmission = () => {
    activeSubmissionRef.current = null;
    setActiveSubmission(null);
  };

  const submit = async () => {
    if (activeSubmissionRef.current) {
      return;
    }

    const input = normalizeLoginInput({ email, password });
    const nextErrors = validateLoginForm(input);

    setErrors(nextErrors);
    setRequestError(null);
    setOauthNotice(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!beginSubmission('password')) {
      return;
    }

    try {
      await signIn(input);
    } catch (error) {
      setRequestError(getAuthErrorMessage(error));
    } finally {
      finishSubmission();
    }
  };

  const submitGoogle = async () => {
    if (!beginSubmission('google')) {
      return;
    }

    setErrors({});
    setRequestError(null);
    setOauthNotice(null);

    try {
      const result = await signInWithGoogle();

      if (result === 'cancelled') {
        setOauthNotice('El acceso con Google fue cancelado.');
      }
    } catch (error) {
      setRequestError(getAuthErrorMessage(error));
    } finally {
      finishSubmission();
    }
  };

  const visibleError = requestError ?? initializationError;

  return (
    <AuthScreen
      description="Accede para administrar tu cuenta y tus próximas experiencias en la barbería."
      title="Bienvenido"
    >
      {visibleError ? <StatusMessage message={visibleError} /> : null}
      {oauthNotice ? (
        <ThemedText accessibilityLiveRegion="polite" style={styles.oauthNotice}>
          {oauthNotice}
        </ThemedText>
      ) : null}
      <AuthFormField
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
        editable={!isBusy}
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
        editable={!isBusy}
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
      <ActionButton
        disabled={isBusy}
        isLoading={isPasswordLoading}
        label="Iniciar sesión"
        onPress={() => void submit()}
      />
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.divider}
      >
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        <ThemedText style={styles.dividerLabel} themeColor="textSecondary">
          o
        </ThemedText>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
      </View>
      <ActionButton
        disabled={isBusy}
        isLoading={isGoogleLoading}
        label="Continuar con Google"
        onPress={() => void submitGoogle()}
        variant="secondary"
      />
      <AuthFooter
        href="./forgot-password"
        label="Recuperar contraseña"
        prompt="¿No recuerdas tu contraseña?"
      />
      <AuthFooter href="./register" label="Crear cuenta" prompt="¿Aún no tienes una cuenta?" />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  oauthNotice: {
    fontSize: TypeScale.label,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerLabel: {
    fontSize: TypeScale.label,
  },
});
