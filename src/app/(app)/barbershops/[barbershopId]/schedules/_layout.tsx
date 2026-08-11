import { Stack } from 'expo-router/stack';

import { useTheme } from '@/theme/hooks/use-theme';

export default function SchedulesLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Horarios' }} />
      <Stack.Screen name="hours/new" options={{ title: 'Nuevo intervalo' }} />
      <Stack.Screen name="hours/[hourId]/edit" options={{ title: 'Editar intervalo' }} />
      <Stack.Screen name="closures/index" options={{ title: 'Cierres excepcionales' }} />
      <Stack.Screen name="closures/new" options={{ title: 'Nuevo cierre' }} />
    </Stack>
  );
}
