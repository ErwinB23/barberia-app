import { Stack } from 'expo-router/stack';

import { useTheme } from '@/theme/hooks/use-theme';

export default function ReservationsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Mis reservas' }} />
      <Stack.Screen name="[reservationId]/index" options={{ title: 'Detalle de reserva' }} />
      <Stack.Screen name="[reservationId]/reschedule" options={{ title: 'Reprogramar' }} />
    </Stack>
  );
}
