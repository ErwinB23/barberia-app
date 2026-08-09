import { useState } from 'react';
import { View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { FormField } from '@/shared/components/ui/form-field';
import { Spacing } from '@/theme/spacing';

import {
  normalizeBarbershopForm,
  validateBarbershopForm,
  type BarbershopFormErrors,
  type BarbershopFormValues,
  type NormalizedBarbershopForm,
} from '../validation';

const EMPTY_VALUES: BarbershopFormValues = {
  name: '',
  description: '',
  phone: '',
  address: '',
  locationReference: '',
  logoUrl: '',
};

type BarbershopFormProps = {
  initialValues?: BarbershopFormValues;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: NormalizedBarbershopForm) => void;
};

export function BarbershopForm({
  initialValues = EMPTY_VALUES,
  isSubmitting,
  submitLabel,
  onSubmit,
}: BarbershopFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<BarbershopFormErrors>({});

  const updateField = (field: keyof BarbershopFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = () => {
    const nextErrors = validateBarbershopForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit(normalizeBarbershopForm(values));
  };

  return (
    <View style={{ gap: Spacing.three }}>
      <FormField
        autoCapitalize="words"
        error={errors.name}
        label="Nombre"
        maxLength={120}
        onChangeText={(value) => updateField('name', value)}
        placeholder="Barbería Central"
        required
        value={values.name}
      />
      <FormField
        error={errors.phone}
        keyboardType="phone-pad"
        label="Teléfono"
        maxLength={30}
        onChangeText={(value) => updateField('phone', value)}
        placeholder="+51 999 111 222"
        value={values.phone}
      />
      <FormField
        error={errors.address}
        label="Dirección"
        maxLength={250}
        onChangeText={(value) => updateField('address', value)}
        placeholder="Av. Principal 123"
        value={values.address}
      />
      <FormField
        error={errors.locationReference}
        label="Referencia de ubicación"
        maxLength={250}
        onChangeText={(value) => updateField('locationReference', value)}
        placeholder="Frente al parque"
        value={values.locationReference}
      />
      <FormField
        error={errors.description}
        label="Descripción"
        maxLength={500}
        multiline
        onChangeText={(value) => updateField('description', value)}
        placeholder="Describe brevemente la experiencia y atención de la barbería."
        value={values.description}
      />
      <FormField
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.logoUrl}
        helperText="Por ahora se admite una URL pública. La carga de archivos se implementará después."
        keyboardType="url"
        label="URL del logo o foto"
        maxLength={2048}
        onChangeText={(value) => updateField('logoUrl', value)}
        placeholder="https://ejemplo.com/logo.png"
        value={values.logoUrl}
      />
      <ActionButton isLoading={isSubmitting} label={submitLabel} onPress={submit} />
    </View>
  );
}
