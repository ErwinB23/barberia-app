import { Stack } from 'expo-router/stack';

import { useTheme } from '@/theme/hooks/use-theme';

export default function BarbersLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Barberos' }} />
      <Stack.Screen name="[barberId]/index" options={{ title: 'Perfil del barbero' }} />
      <Stack.Screen name="[barberId]/edit" options={{ title: 'Editar perfil público' }} />
      <Stack.Screen name="[barberId]/services" options={{ title: 'Servicios asignados' }} />
      <Stack.Screen name="[barberId]/schedule/index" options={{ title: 'Horario individual' }} />
      <Stack.Screen name="[barberId]/schedule/new" options={{ title: 'Nuevo intervalo' }} />
      <Stack.Screen
        name="[barberId]/schedule/[scheduleId]/edit"
        options={{ title: 'Editar intervalo' }}
      />
      <Stack.Screen name="[barberId]/blocks/index" options={{ title: 'Bloqueos' }} />
      <Stack.Screen name="[barberId]/blocks/new" options={{ title: 'Nuevo bloqueo' }} />
    </Stack>
  );
}
