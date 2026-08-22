import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

import { formatDuration, formatPen } from '../formatters';
import type { CatalogService } from '../types';
import { CatalogStatusBadge } from './catalog-status-badge';

type ServiceCardProps = {
  service: CatalogService;
  isChangingStatus: boolean;
  onOpen: () => void;
  onToggleStatus: () => void;
};

export function ServiceCard({
  service,
  isChangingStatus,
  onOpen,
  onToggleStatus,
}: ServiceCardProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <SurfaceCard style={styles.card}>
      <Pressable
        accessibilityHint="Abre el servicio y sus estilos"
        accessibilityLabel={`${service.name}, ${formatPen(service.price)}, ${formatDuration(service.durationMinutes)}, ${service.isActive ? 'activo' : 'inactivo'}`}
        accessibilityRole="button"
        onBlur={() => setIsFocused(false)}
        onFocus={() => setIsFocused(true)}
        onPress={onOpen}
        style={({ pressed }) => [
          styles.openArea,
          isFocused ? { boxShadow: `inset 0 0 0 2px ${theme.focus}` } : null,
          getPressedScaleStyle(pressed, reduceMotion, 0.992),
        ]}
      >
        <View style={styles.heading}>
          <View style={styles.copy}>
            <ThemedText numberOfLines={2} style={styles.title}>
              {service.name}
            </ThemedText>
            <ThemedText style={styles.metrics} themeColor="textSecondary">
              {formatPen(service.price)} · {formatDuration(service.durationMinutes)}
            </ThemedText>
          </View>
          <View style={styles.trailing}>
            <CatalogStatusBadge isActive={service.isActive} />
            <AppIcon
              color={theme.textSecondary}
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={20}
            />
          </View>
        </View>
        {service.description ? (
          <ThemedText numberOfLines={2} style={styles.description} themeColor="textSecondary">
            {service.description}
          </ThemedText>
        ) : null}
      </Pressable>

      <View style={[styles.statusAction, { borderTopColor: theme.border }]}>
        <ActionButton
          isLoading={isChangingStatus}
          label={service.isActive ? 'Desactivar servicio' : 'Activar servicio'}
          onPress={onToggleStatus}
          size="compact"
          variant={service.isActive ? 'danger' : 'secondary'}
        />
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  openArea: { gap: Spacing.two, padding: Spacing.three },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  copy: { minWidth: 0, flex: 1, gap: Spacing.one },
  title: { fontSize: TypeScale.body, fontWeight: '700' },
  description: { fontSize: TypeScale.label, lineHeight: 21 },
  metrics: { fontSize: TypeScale.label, fontWeight: '700' },
  trailing: { alignItems: 'flex-end', gap: Spacing.two },
  statusAction: {
    alignItems: 'flex-start',
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
});
