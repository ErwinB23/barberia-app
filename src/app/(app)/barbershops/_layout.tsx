import { Stack } from 'expo-router/stack';

import { useTheme } from '@/theme/hooks/use-theme';

export default function BarbershopsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Mis barberías' }} />
      <Stack.Screen name="create" options={{ title: 'Nueva barbería' }} />
      <Stack.Screen name="[barbershopId]/index" options={{ title: 'Administración' }} />
      <Stack.Screen name="[barbershopId]/edit" options={{ title: 'Datos generales' }} />
      <Stack.Screen name="[barbershopId]/settings" options={{ title: 'Ajustes generales' }} />
      <Stack.Screen
        name="[barbershopId]/payment-settings"
        options={{ title: 'Configuración Yape' }}
      />
      <Stack.Screen name="[barbershopId]/services" options={{ headerShown: false }} />
      <Stack.Screen name="[barbershopId]/schedules" options={{ headerShown: false }} />
      <Stack.Screen name="[barbershopId]/barbers" options={{ headerShown: false }} />
      <Stack.Screen name="[barbershopId]/invitations" options={{ headerShown: false }} />
    </Stack>
  );
}
