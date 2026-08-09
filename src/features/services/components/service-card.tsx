import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
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
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.copy}>
          <ThemedText style={styles.title}>{service.name}</ThemedText>
          {service.description ? (
            <ThemedText numberOfLines={2} style={styles.description} themeColor="textSecondary">
              {service.description}
            </ThemedText>
          ) : null}
        </View>
        <CatalogStatusBadge isActive={service.isActive} />
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <ThemedText style={styles.metricLabel} themeColor="textSecondary">
            Precio
          </ThemedText>
          <ThemedText style={styles.metricValue}>{formatPen(service.price)}</ThemedText>
        </View>
        <View style={styles.metric}>
          <ThemedText style={styles.metricLabel} themeColor="textSecondary">
            Duración
          </ThemedText>
          <ThemedText style={styles.metricValue}>
            {formatDuration(service.durationMinutes)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.actions}>
        <ActionButton label="Ver servicio y estilos" onPress={onOpen} />
        <ActionButton
          isLoading={isChangingStatus}
          label={service.isActive ? 'Desactivar' : 'Activar'}
          onPress={onToggleStatus}
          variant={service.isActive ? 'danger' : 'secondary'}
        />
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.four,
    padding: Spacing.four,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  copy: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontSize: TypeScale.title,
    fontWeight: '700',
  },
  description: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
  metrics: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  metric: {
    flex: 1,
    gap: Spacing.one,
  },
  metricLabel: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: TypeScale.body,
    fontWeight: '700',
  },
  actions: {
    gap: Spacing.two,
  },
});
