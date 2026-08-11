import { useState } from 'react';
import { View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { FormField } from '@/shared/components/ui/form-field';
import { Spacing } from '@/theme/spacing';

import {
  parseHourForm,
  type HourFormErrors,
  type HourFormValues,
  type TimeInterval,
} from '../schedule-domain';

const EMPTY_VALUES: HourFormValues = { startTime: '', endTime: '' };

type HourFormProps = {
  existingIntervals: readonly TimeInterval[];
  excludedId?: string;
  initialValues?: HourFormValues;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: HourFormValues) => void;
};

export function HourForm({
  existingIntervals,
  excludedId,
  initialValues = EMPTY_VALUES,
  isSubmitting,
  submitLabel,
  onSubmit,
}: HourFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<HourFormErrors>({});

  const updateField = (field: keyof HourFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = () => {
    const result = parseHourForm(values, existingIntervals, excludedId);
    setErrors(result.errors);
    if (result.values) {
      onSubmit(result.values);
    }
  };

  return (
    <View style={{ gap: Spacing.three }}>
      <FormField
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.startTime}
        helperText="Usa formato de 24 horas, por ejemplo 09:00."
        keyboardType={process.env.EXPO_OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
        label="Hora de inicio"
        maxLength={5}
        onChangeText={(value) => updateField('startTime', value)}
        placeholder="09:00"
        required
        value={values.startTime}
      />
      <FormField
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.endTime}
        helperText="Debe ser posterior al inicio y no superponerse con otro intervalo."
        keyboardType={process.env.EXPO_OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
        label="Hora de fin"
        maxLength={5}
        onChangeText={(value) => updateField('endTime', value)}
        placeholder="13:00"
        required
        value={values.endTime}
      />
      <ActionButton isLoading={isSubmitting} label={submitLabel} onPress={submit} />
    </View>
  );
}
