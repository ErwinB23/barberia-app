import { Stack } from 'expo-router/stack';

import { useTheme } from '@/theme/hooks/use-theme';

export default function ExploreLayout() {
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
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Explorar' }} />
      <Stack.Screen name="[barbershopId]" options={{ title: 'Barbería' }} />
    </Stack>
  );
}
