import { Stack } from 'expo-router/stack';

import { useTheme } from '@/theme/hooks/use-theme';

export default function ServicesLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Servicios' }} />
      <Stack.Screen name="new" options={{ title: 'Nuevo servicio' }} />
      <Stack.Screen name="[serviceId]/index" options={{ title: 'Servicio' }} />
      <Stack.Screen name="[serviceId]/edit" options={{ title: 'Editar servicio' }} />
      <Stack.Screen name="[serviceId]/styles/new" options={{ title: 'Nuevo estilo' }} />
      <Stack.Screen name="[serviceId]/styles/[styleId]/edit" options={{ title: 'Editar estilo' }} />
    </Stack>
  );
}
