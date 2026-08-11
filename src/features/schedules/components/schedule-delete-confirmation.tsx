import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

type ScheduleDeleteConfirmationProps = {
  title: string;
  description: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ScheduleDeleteConfirmation({
  title,
  description,
  isSubmitting,
  onCancel,
  onConfirm,
}: ScheduleDeleteConfirmationProps) {
  return (
    <SurfaceCard accessibilityRole="alert" style={styles.card}>
      <View style={styles.copy}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={styles.description} themeColor="textSecondary">
          {description}
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <ActionButton
          disabled={isSubmitting}
          label="Cancelar"
          onPress={onCancel}
          variant="secondary"
        />
        <ActionButton
          isLoading={isSubmitting}
          label="Eliminar"
          onPress={onConfirm}
          variant="danger"
        />
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  copy: {
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
  actions: {
    gap: Spacing.two,
  },
});
