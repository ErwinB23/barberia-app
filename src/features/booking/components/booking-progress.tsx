import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { BOOKING_FLOW_STEPS, type BookingFlowStep } from '../booking-domain';

export function BookingProgress({ currentStep }: { currentStep: BookingFlowStep }) {
  const theme = useTheme();
  const currentIndex = BOOKING_FLOW_STEPS.findIndex((step) => step.key === currentStep);
  const currentLabel = BOOKING_FLOW_STEPS[currentIndex]?.label ?? '';

  return (
    <View
      accessibilityLabel={`Progreso de la reserva. Etapa actual: ${currentLabel}.`}
      accessible
      style={styles.container}
    >
      {BOOKING_FLOW_STEPS.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isComplete = index < currentIndex;
        return (
          <View key={step.key} style={styles.step}>
            <View
              style={[
                styles.track,
                { backgroundColor: isCurrent || isComplete ? theme.primary : theme.border },
                isCurrent ? styles.currentTrack : null,
              ]}
            />
            <View style={styles.labelRow}>
              {isComplete ? (
                <AppIcon
                  color={theme.primary}
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  size={14}
                />
              ) : null}
              <ThemedText
                numberOfLines={1}
                style={[styles.label, isCurrent ? styles.currentLabel : null]}
                themeColor={isCurrent || isComplete ? 'primary' : 'textSecondary'}
              >
                {step.label}
              </ThemedText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  step: {
    minWidth: 0,
    flex: 1,
    gap: Spacing.two,
  },
  track: {
    height: 3,
    borderRadius: Radius.pill,
  },
  currentTrack: {
    height: 5,
    marginTop: -1,
  },
  labelRow: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  label: {
    flexShrink: 1,
    fontSize: TypeScale.caption - 1,
    fontWeight: '600',
    textAlign: 'center',
  },
  currentLabel: {
    fontWeight: '800',
  },
});
