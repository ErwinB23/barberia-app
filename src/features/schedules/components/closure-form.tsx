import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { FormField } from '@/shared/components/ui/form-field';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

import {
  parseClosureForm,
  type ClosureFormErrors,
  type ClosureFormValues,
  type ParsedClosureForm,
} from '../schedule-domain';

const EMPTY_VALUES: ClosureFormValues = {
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  reason: '',
};

type ClosureFormProps = {
  isSubmitting: boolean;
  onSubmit: (values: ParsedClosureForm) => void;
};

export function ClosureForm({ isSubmitting, onSubmit }: ClosureFormProps) {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState<ClosureFormErrors>({});

  const updateField = (field: keyof ClosureFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = () => {
    const result = parseClosureForm(values);
    setErrors(result.errors);
    if (result.values) {
      onSubmit(result.values);
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Inicio</ThemedText>
        <FormField
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.startDate}
          helperText="Fecha local de Lima en formato AAAA-MM-DD."
          label="Fecha de inicio"
          maxLength={10}
          onChangeText={(value) => updateField('startDate', value)}
          placeholder="2026-08-30"
          required
          value={values.startDate}
        />
        <FormField
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.startTime}
          helperText="Formato de 24 horas HH:mm."
          keyboardType={process.env.EXPO_OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
          label="Hora de inicio"
          maxLength={5}
          onChangeText={(value) => updateField('startTime', value)}
          placeholder="09:00"
          required
          value={values.startTime}
        />
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Fin</ThemedText>
        <FormField
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.endDate}
          helperText="Puede ser el mismo día o una fecha posterior."
          label="Fecha de fin"
          maxLength={10}
          onChangeText={(value) => updateField('endDate', value)}
          placeholder="2026-08-30"
          required
          value={values.endDate}
        />
        <FormField
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.endTime}
          helperText="Debe ser posterior al inicio."
          keyboardType={process.env.EXPO_OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
          label="Hora de fin"
          maxLength={5}
          onChangeText={(value) => updateField('endTime', value)}
          placeholder="18:00"
          required
          value={values.endTime}
        />
      </View>

      <FormField
        error={errors.reason}
        label="Motivo"
        maxLength={250}
        multiline
        onChangeText={(value) => updateField('reason', value)}
        placeholder="Feriado, mantenimiento o evento interno."
        value={values.reason}
      />
      <ActionButton isLoading={isSubmitting} label="Crear cierre excepcional" onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: TypeScale.title,
    fontWeight: '700',
  },
});
