import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { FormField } from '@/shared/components/ui/form-field';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import type { BarbershopSettings } from '../types';
import {
  parseBarbershopSettingsForm,
  type BarbershopSettingsFormErrors,
  type BarbershopSettingsFormValues,
  type ParsedBarbershopSettings,
} from '../validation';

type BarbershopSettingsFormProps = {
  settings: BarbershopSettings;
  isSubmitting: boolean;
  onSubmit: (values: ParsedBarbershopSettings) => void;
};

function toFormValues(settings: BarbershopSettings): BarbershopSettingsFormValues {
  return {
    minBookingNoticeMinutes: String(settings.min_booking_notice_minutes),
    maxBookingDays: String(settings.max_booking_days),
    slotIntervalMinutes: String(settings.slot_interval_minutes),
    appointmentBufferMinutes: String(settings.appointment_buffer_minutes),
    cancellationNoticeMinutes: String(settings.cancellation_notice_minutes),
    lateCancellationRefundPolicy: settings.late_cancellation_refund_policy,
  };
}

export function BarbershopSettingsForm({
  settings,
  isSubmitting,
  onSubmit,
}: BarbershopSettingsFormProps) {
  const theme = useTheme();
  const [values, setValues] = useState(() => toFormValues(settings));
  const [errors, setErrors] = useState<BarbershopSettingsFormErrors>({});

  const updateField = (field: keyof BarbershopSettingsFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = () => {
    const result = parseBarbershopSettingsForm(values);
    setErrors(result.errors);
    if (result.values) {
      onSubmit(result.values);
    }
  };

  return (
    <View style={styles.form}>
      <FormField
        error={errors.minBookingNoticeMinutes}
        keyboardType="number-pad"
        label="Anticipación mínima"
        onChangeText={(value) => updateField('minBookingNoticeMinutes', value)}
        required
        unit="min"
        value={values.minBookingNoticeMinutes}
      />
      <FormField
        error={errors.maxBookingDays}
        keyboardType="number-pad"
        label="Horizonte de reservas"
        onChangeText={(value) => updateField('maxBookingDays', value)}
        required
        unit="días"
        value={values.maxBookingDays}
      />
      <FormField
        error={errors.slotIntervalMinutes}
        keyboardType="number-pad"
        label="Intervalo de horarios"
        onChangeText={(value) => updateField('slotIntervalMinutes', value)}
        required
        unit="min"
        value={values.slotIntervalMinutes}
      />
      <FormField
        error={errors.appointmentBufferMinutes}
        keyboardType="number-pad"
        label="Margen entre citas"
        onChangeText={(value) => updateField('appointmentBufferMinutes', value)}
        required
        unit="min"
        value={values.appointmentBufferMinutes}
      />
      <FormField
        error={errors.cancellationNoticeMinutes}
        keyboardType="number-pad"
        label="Umbral de cancelación tardía"
        onChangeText={(value) => updateField('cancellationNoticeMinutes', value)}
        required
        unit="min"
        value={values.cancellationNoticeMinutes}
      />
      <View style={styles.policyGroup}>
        <ThemedText style={styles.policyTitle}>Reembolso por cancelación tardía</ThemedText>
        <View style={styles.policyOptions}>
          {[
            { value: 'full_refund' as const, label: 'Reembolso completo' },
            { value: 'no_refund' as const, label: 'Sin reembolso' },
          ].map((option) => {
            const isSelected = values.lateCancellationRefundPolicy === option.value;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                key={option.value}
                onPress={() =>
                  setValues((current) => ({
                    ...current,
                    lateCancellationRefundPolicy: option.value,
                  }))
                }
                style={({ pressed }) => [
                  styles.policyOption,
                  {
                    backgroundColor: isSelected ? theme.surfaceMuted : theme.inputBackground,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                  pressed ? styles.pressed : null,
                ]}
              >
                <ThemedText style={styles.policyLabel}>{option.label}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
      <ActionButton isLoading={isSubmitting} label="Guardar ajustes" onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.three,
  },
  policyGroup: {
    gap: Spacing.two,
  },
  policyTitle: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  policyOptions: {
    gap: Spacing.two,
  },
  policyOption: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
  },
  policyLabel: {
    fontSize: TypeScale.label,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.72,
  },
});
