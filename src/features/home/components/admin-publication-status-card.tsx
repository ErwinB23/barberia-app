import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { BarbershopStatusBadge } from '@/features/barbershops/components/barbershop-status-badge';
import type { PublicationRequirement } from '@/features/barbershops/publication';
import type { BarbershopStatus } from '@/features/barbershops/types';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { getAdminBarbershopStatusCopy } from '../admin-home-domain';

export function AdminPublicationStatusCard({
  status,
  readiness,
  publicationHref,
}: {
  status: BarbershopStatus;
  readiness: readonly PublicationRequirement[] | null;
  publicationHref: string;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);
  const copy = getAdminBarbershopStatusCopy(status);
  const completeCount = readiness?.filter(({ isComplete }) => isComplete).length ?? null;

  return (
    <View style={styles.section}>
      <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
        Estado de la barbería
      </ThemedText>
      <SurfaceCard style={styles.card}>
        <View style={styles.copy}>
          <BarbershopStatusBadge status={status} />
          <ThemedText style={styles.title}>{copy.label}</ThemedText>
          <ThemedText style={styles.description} themeColor="textSecondary">
            {copy.description}
          </ThemedText>
          {readiness ? (
            <ThemedText style={styles.readiness} themeColor="textSecondary">
              {completeCount} de {readiness.length} requisitos de publicación listos.
            </ThemedText>
          ) : (
            <ThemedText style={styles.readiness} themeColor="textSecondary">
              La preparación para publicar no está disponible ahora.
            </ThemedText>
          )}
        </View>

        <Pressable
          accessibilityHint="Abre la preparación y los controles de publicación"
          accessibilityRole="link"
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          onPress={() => router.push(publicationHref as Href)}
          style={({ pressed }) => [
            styles.action,
            {
              backgroundColor: theme.surfaceMuted,
              boxShadow: isFocused ? `0 0 0 2px ${theme.focus}` : undefined,
            },
            getPressedScaleStyle(pressed, reduceMotion, 0.985),
          ]}
        >
          <ThemedText style={styles.actionLabel}>Gestionar publicación</ThemedText>
          <AppIcon
            color={theme.textSecondary}
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={17}
          />
        </Pressable>
      </SurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '700', letterSpacing: -0.3 },
  card: { gap: Spacing.three, padding: Spacing.three },
  copy: { alignItems: 'flex-start', gap: Spacing.two },
  title: { fontSize: TypeScale.body, fontWeight: '700' },
  description: { maxWidth: 620, fontSize: TypeScale.label, lineHeight: 20 },
  readiness: { fontSize: TypeScale.caption, lineHeight: 18 },
  action: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
  },
  actionLabel: { flex: 1, fontSize: TypeScale.label, fontWeight: '700' },
});
