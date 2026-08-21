import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import type { BookingBarber } from '../types';

export function PublicBarberCard({
  barber,
  serviceSummary,
}: {
  barber: BookingBarber;
  serviceSummary: string;
}) {
  const theme = useTheme();
  const showPhoto = barber.photoUrl?.startsWith('https://');
  const initial = barber.displayName.trim().charAt(0).toLocaleUpperCase('es-PE');

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.heading}>
        {showPhoto ? (
          <Image
            accessibilityLabel={`Foto de ${barber.displayName}`}
            cachePolicy="memory-disk"
            contentFit="cover"
            recyclingKey={barber.id}
            source={{ uri: barber.photoUrl! }}
            style={[styles.avatar, { backgroundColor: theme.surfaceMuted }]}
            transition={180}
          />
        ) : (
          <View style={[styles.avatar, styles.fallback, { backgroundColor: theme.surfaceMuted }]}>
            {initial ? (
              <ThemedText style={styles.initial} themeColor="primary">
                {initial}
              </ThemedText>
            ) : (
              <AppIcon
                color={theme.primary}
                name={{ ios: 'person', android: 'person', web: 'person' }}
                size={28}
              />
            )}
          </View>
        )}
        <View style={styles.copy}>
          <ThemedText style={styles.name}>{barber.displayName}</ThemedText>
          <ThemedText style={styles.services} themeColor="primary">
            {serviceSummary}
          </ThemedText>
        </View>
      </View>
      {barber.bio ? (
        <ThemedText numberOfLines={4} style={styles.bio} themeColor="textSecondary">
          {barber.bio}
        </ThemedText>
      ) : (
        <ThemedText style={styles.bio} themeColor="textSecondary">
          Sin descripción pública.
        </ThemedText>
      )}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 280,
    flexGrow: 1,
    flexBasis: 320,
    gap: Spacing.three,
    padding: Spacing.four,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: TypeScale.headline,
    fontWeight: '800',
  },
  copy: {
    flex: 1,
    gap: Spacing.one,
  },
  name: {
    fontSize: TypeScale.title,
    fontWeight: '700',
  },
  services: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
    lineHeight: 18,
  },
  bio: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
});
