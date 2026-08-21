import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { IconButton } from '@/shared/components/ui/icon-button';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

type ClientHomeHeaderProps = {
  firstName: string | null;
  unreadNotificationCount: number | null;
};

export function ClientHomeHeader({ firstName, unreadNotificationCount }: ClientHomeHeaderProps) {
  const notificationLabel =
    unreadNotificationCount === null
      ? 'Notificaciones, contador no disponible'
      : unreadNotificationCount > 0
        ? `Notificaciones, ${unreadNotificationCount} sin leer`
        : 'Notificaciones';

  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <ThemedText accessibilityRole="header" style={styles.title}>
          {firstName ? `Hola, ${firstName}` : 'Hola'}
        </ThemedText>
        <ThemedText style={styles.description} themeColor="textSecondary">
          Tu próxima visita empieza aquí.
        </ThemedText>
      </View>
      <IconButton
        accessibilityHint="Abre tu centro de notificaciones"
        accessibilityLabel={notificationLabel}
        badgeCount={unreadNotificationCount ?? undefined}
        icon={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
        onPress={() => router.push('/notifications')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  copy: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontSize: TypeScale.headline,
    fontWeight: '700',
    letterSpacing: -0.7,
    lineHeight: 36,
  },
  description: {
    fontSize: TypeScale.label,
    lineHeight: 20,
  },
});
