import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';

import { AuthLoadingScreen } from '@/features/auth/components/auth-loading-screen';
import { AuthProvider } from '@/features/auth/context/auth-provider';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useColorScheme } from '@/theme/hooks/use-color-scheme';

function RootNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={session !== null}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
