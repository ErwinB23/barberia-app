import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { isSafeRemoteImageUrl } from '../barber-domain';
import type { Barber } from '../types';

export function BarberCard({ barber, onOpen }: { barber: Barber; onOpen: () => void }) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);
  const initial = barber.displayName.trim().charAt(0).toUpperCase();
  const services = barber.services.map((service) => service.name).join(' · ');

  return (
    <Pressable
      accessibilityHint="Abre la administración de este barbero"
      accessibilityLabel={`${barber.displayName}, ${barber.isActive ? 'activo' : 'inactivo'}`}
      accessibilityRole="button"
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={onOpen}
      style={({ pressed }) => [
        isFocused ? { boxShadow: `0 0 0 2px ${theme.focus}` } : null,
        getPressedScaleStyle(pressed, reduceMotion, 0.992),
      ]}
    >
      <SurfaceCard style={styles.card}>
        {isSafeRemoteImageUrl(barber.photoUrl) ? (
          <Image
            accessibilityLabel={`Foto de ${barber.displayName}`}
            source={{ uri: barber.photoUrl! }}
            style={styles.avatar}
          />
        ) : (
          <View
            style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.surfaceMuted }]}
          >
            <ThemedText style={styles.initial}>{initial}</ThemedText>
          </View>
        )}
        <View style={styles.copy}>
          <View style={styles.nameRow}>
            <ThemedText numberOfLines={2} style={styles.name}>
              {barber.displayName}
            </ThemedText>
            <ThemedText
              accessibilityLabel={`Estado: ${barber.isActive ? 'activo' : 'inactivo'}`}
              style={[
                styles.status,
                { color: barber.isActive ? theme.success : theme.textSecondary },
              ]}
            >
              {barber.isActive ? 'Activo' : 'Inactivo'}
            </ThemedText>
          </View>
          <ThemedText numberOfLines={2} style={styles.services} themeColor="textSecondary">
            {services || 'Sin servicios asignados'}
          </ThemedText>
        </View>
        <AppIcon
          color={theme.textSecondary}
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={20}
        />
      </SurfaceCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  avatar: { width: 56, height: 56, borderRadius: Radius.pill },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: TypeScale.title, fontWeight: '800' },
  copy: { minWidth: 0, flex: 1, gap: Spacing.two },
  nameRow: { gap: Spacing.one },
  name: { fontSize: TypeScale.body, fontWeight: '700' },
  status: { fontSize: TypeScale.caption, fontWeight: '700' },
  services: { fontSize: TypeScale.caption, lineHeight: 18 },
});
