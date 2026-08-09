import { Pressable, StyleSheet, View } from 'react-native';

import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

import { getMembershipRoleLabel } from '../mappers';
import type { UserBarbershop } from '../types';
import { BarbershopStatusBadge } from './barbershop-status-badge';

type BarbershopCardProps = {
  item: UserBarbershop;
  onPress: () => void;
};

export function BarbershopCard({ item, onPress }: BarbershopCardProps) {
  const theme = useTheme();
  const location = item.barbershop.locationReference ?? item.barbershop.address;

  return (
    <SurfaceCard style={styles.card}>
      <Pressable
        accessibilityHint="Abre la administración de esta barbería"
        accessibilityLabel={`${item.barbershop.name}, ${getMembershipRoleLabel(item.role)}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, pressed ? styles.pressed : null]}
      >
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <ThemedText style={styles.title}>{item.barbershop.name}</ThemedText>
            <ThemedText style={styles.role} themeColor="primary">
              {getMembershipRoleLabel(item.role)}
            </ThemedText>
          </View>
          <BarbershopStatusBadge status={item.barbershop.status} />
        </View>
        <View style={[styles.details, { borderTopColor: theme.border }]}>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel} themeColor="textSecondary">
              Teléfono
            </ThemedText>
            <ThemedText selectable style={styles.detailValue}>
              {item.barbershop.phone ?? 'No registrado'}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel} themeColor="textSecondary">
              Ubicación
            </ThemedText>
            <ThemedText selectable style={styles.detailValue}>
              {location ?? 'Sin referencia registrada'}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.openLabel} themeColor="primary">
          Abrir administración
        </ThemedText>
      </Pressable>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  pressable: {
    minHeight: 48,
    gap: Spacing.three,
    padding: Spacing.four,
  },
  pressed: {
    opacity: 0.72,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  titleGroup: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontSize: TypeScale.title,
    fontWeight: '700',
    lineHeight: 27,
  },
  role: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
  details: {
    gap: Spacing.two,
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  detailLabel: {
    width: 76,
    fontSize: TypeScale.caption,
    fontWeight: '600',
  },
  detailValue: {
    flex: 1,
    fontSize: TypeScale.label,
    lineHeight: 20,
  },
  openLabel: {
    minHeight: 24,
    alignSelf: 'flex-start',
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
});
