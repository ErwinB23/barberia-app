import { Stack } from 'expo-router/stack';

import { useTheme } from '@/theme/hooks/use-theme';

export const unstable_settings = {
  anchor: 'login',
};

export default function AuthLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.background },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
      }}
    >
      <Stack.Screen name="login" options={{ headerTitle: '', title: 'Iniciar sesión' }} />
      <Stack.Screen name="register" options={{ headerTitle: '', title: 'Crear cuenta' }} />
      <Stack.Screen
        name="forgot-password"
        options={{ headerTitle: '', title: 'Recuperar contraseña' }}
      />
    </Stack>
  );
}
