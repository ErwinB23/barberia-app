import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { IconButton } from '@/shared/components/ui/icon-button';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

type BarberHomeHeaderProps = {
  firstName: string | null;
  barbershopName: string | null;
  unreadNotificationCount: number | null;
};

export function BarberHomeHeader({
  firstName,
  barbershopName,
  unreadNotificationCount,
}: BarberHomeHeaderProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isClientLinkFocused, setIsClientLinkFocused] = useState(false);
  const notificationLabel =
    unreadNotificationCount === null
      ? 'Notificaciones, contador no disponible'
      : unreadNotificationCount > 0
        ? `Notificaciones, ${unreadNotificationCount} sin leer`
        : 'Notificaciones';

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityHint="Regresa a la experiencia Cliente"
        accessibilityRole="link"
        onBlur={() => setIsClientLinkFocused(false)}
        onFocus={() => setIsClientLinkFocused(true)}
        onPress={() => router.replace('/')}
        style={({ pressed }) => [
          styles.clientLink,
          {
            backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
            borderColor: theme.border,
            boxShadow: isClientLinkFocused ? `0 0 0 2px ${theme.focus}` : undefined,
          },
          getPressedScaleStyle(pressed, reduceMotion, 0.985),
        ]}
      >
        <AppIcon
          color={theme.primary}
          name={{ ios: 'house', android: 'home', web: 'home' }}
          size={18}
        />
        <ThemedText style={styles.clientLinkLabel} themeColor="primary">
          Inicio cliente
        </ThemedText>
      </Pressable>

      <View style={styles.headerRow}>
        <View style={styles.copy}>
          <ThemedText accessibilityRole="header" style={styles.title}>
            {firstName ? `Hola, ${firstName}` : 'Hola'}
          </ThemedText>
          <ThemedText style={styles.subtitle} themeColor="textSecondary">
            Tu jornada de hoy
          </ThemedText>
          {barbershopName ? (
            <View style={styles.contextRow}>
              <AppIcon
                color={theme.textSecondary}
                name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
                size={16}
              />
              <ThemedText numberOfLines={1} style={styles.context} themeColor="textSecondary">
                {barbershopName}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <IconButton
          accessibilityHint="Abre el centro de notificaciones compartido"
          accessibilityLabel={notificationLabel}
          badgeCount={unreadNotificationCount ?? undefined}
          icon={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
          onPress={() => router.push('/notifications')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  clientLink: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
  },
  clientLinkLabel: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  copy: {
    minWidth: 0,
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontSize: TypeScale.headline,
    fontWeight: '700',
    letterSpacing: -0.7,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: TypeScale.body,
    lineHeight: 23,
  },
  contextRow: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  context: {
    minWidth: 0,
    flex: 1,
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
});
