import { useState } from 'react';
import { View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { FormField } from '@/shared/components/ui/form-field';
import { Spacing } from '@/theme/spacing';

import {
  parseServiceForm,
  type ParsedServiceForm,
  type ServiceFormErrors,
  type ServiceFormValues,
} from '../validation';

const EMPTY_VALUES: ServiceFormValues = {
  name: '',
  description: '',
  price: '',
  durationMinutes: '',
};

type ServiceFormProps = {
  initialValues?: ServiceFormValues;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: ParsedServiceForm) => void;
};

export function ServiceForm({
  initialValues = EMPTY_VALUES,
  isSubmitting,
  submitLabel,
  onSubmit,
}: ServiceFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ServiceFormErrors>({});

  const updateField = (field: keyof ServiceFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = () => {
    const result = parseServiceForm(values);
    setErrors(result.errors);
    if (result.values) {
      onSubmit(result.values);
    }
  };

  return (
    <View style={{ gap: Spacing.three }}>
      <FormField
        autoCapitalize="words"
        error={errors.name}
        label="Nombre"
        maxLength={120}
        onChangeText={(value) => updateField('name', value)}
        placeholder="Corte clásico"
        required
        value={values.name}
      />
      <FormField
        error={errors.description}
        label="Descripción"
        maxLength={500}
        multiline
        onChangeText={(value) => updateField('description', value)}
        placeholder="Describe qué incluye este servicio."
        value={values.description}
      />
      <FormField
        error={errors.price}
        helperText="Puedes usar punto o coma para los decimales."
        keyboardType="decimal-pad"
        label="Precio"
        maxLength={11}
        onChangeText={(value) => updateField('price', value)}
        placeholder="35.00"
        required
        unit="PEN"
        value={values.price}
      />
      <FormField
        error={errors.durationMinutes}
        keyboardType="number-pad"
        label="Duración"
        maxLength={3}
        onChangeText={(value) => updateField('durationMinutes', value)}
        placeholder="45"
        required
        unit="min"
        value={values.durationMinutes}
      />
      <ActionButton isLoading={isSubmitting} label={submitLabel} onPress={submit} />
    </View>
  );
}
