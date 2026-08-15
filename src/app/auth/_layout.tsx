import { Stack } from 'expo-router/stack';

import { useTheme } from '@/theme/hooks/use-theme';

export default function AuthCallbackLayout() {
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
      <Stack.Screen name="callback" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ title: 'Nueva contraseña' }} />
    </Stack>
  );
}
