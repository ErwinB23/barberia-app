import { Stack } from 'expo-router/stack';

import { useTheme } from '@/theme/hooks/use-theme';

export default function AppLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Inicio' }} />
      <Stack.Screen name="profile" options={{ title: 'Mi perfil' }} />
      <Stack.Screen name="barbershops" options={{ headerShown: false }} />
    </Stack>
  );
}
