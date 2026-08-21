import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { useTheme } from '@/theme/hooks/use-theme';
import { TypeScale } from '@/theme/tokens';

type TabIconProps = {
  color: string;
  focused: boolean;
  filled: ComponentProps<typeof SymbolView>['name'];
  regular: ComponentProps<typeof SymbolView>['name'];
  size: number;
};

function TabIcon({ color, filled, focused, regular, size }: TabIconProps) {
  return <AppIcon color={color} name={focused ? filled : regular} size={size} />;
}

export default function AppLayout() {
  const theme = useTheme();

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        animation: 'none',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        sceneStyle: { backgroundColor: theme.background },
        tabBarActiveTintColor: theme.primary,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: TypeScale.caption - 1,
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          minHeight: 64,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarAccessibilityLabel: 'Inicio',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              color={String(color)}
              filled={{ ios: 'house.fill', android: 'home_filled', web: 'home_filled' }}
              focused={focused}
              regular={{ ios: 'house', android: 'home', web: 'home' }}
              size={size}
            />
          ),
          title: 'Inicio',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          headerShown: false,
          popToTopOnBlur: true,
          tabBarAccessibilityLabel: 'Explorar barberías',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              color={String(color)}
              filled={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              focused={focused}
              regular={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              size={size}
            />
          ),
          title: 'Explorar',
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          headerShown: false,
          popToTopOnBlur: true,
          tabBarAccessibilityLabel: 'Mis reservas',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              color={String(color)}
              filled={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
              focused={focused}
              regular={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
              size={size}
            />
          ),
          title: 'Reservas',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarAccessibilityLabel: 'Mi perfil',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              color={String(color)}
              filled={{ ios: 'person.fill', android: 'person', web: 'person' }}
              focused={focused}
              regular={{ ios: 'person', android: 'person', web: 'person' }}
              size={size}
            />
          ),
          title: 'Perfil',
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{ headerShown: false, href: null, title: 'Favoritas' }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ headerShown: false, href: null, title: 'Notificaciones' }}
      />
      <Tabs.Screen name="invitations" options={{ href: null, title: 'Mis invitaciones' }} />
      <Tabs.Screen
        name="booking"
        options={{ headerShown: false, href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="barbershops"
        options={{ headerShown: false, href: null, tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  );
}
