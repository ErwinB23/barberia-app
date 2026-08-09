import { useState } from 'react';
import { View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { FormField } from '@/shared/components/ui/form-field';
import { Spacing } from '@/theme/spacing';

import {
  parseStyleForm,
  type ParsedStyleForm,
  type StyleFormErrors,
  type StyleFormValues,
} from '../validation';

const EMPTY_VALUES: StyleFormValues = {
  name: '',
  description: '',
  imageUrl: '',
};

type StyleFormProps = {
  initialValues?: StyleFormValues;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: ParsedStyleForm) => void;
};

export function StyleForm({
  initialValues = EMPTY_VALUES,
  isSubmitting,
  submitLabel,
  onSubmit,
}: StyleFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<StyleFormErrors>({});

  const updateField = (field: keyof StyleFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = () => {
    const result = parseStyleForm(values);
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
        placeholder="Fade bajo"
        required
        value={values.name}
      />
      <FormField
        error={errors.description}
        label="Descripción"
        maxLength={500}
        multiline
        onChangeText={(value) => updateField('description', value)}
        placeholder="Describe los rasgos visuales del estilo."
        value={values.description}
      />
      <FormField
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.imageUrl}
        helperText="Usa una URL pública http:// o https://. La carga de archivos se añadirá después."
        keyboardType="url"
        label="URL de imagen"
        maxLength={2048}
        onChangeText={(value) => updateField('imageUrl', value)}
        placeholder="https://ejemplo.com/estilo.jpg"
        value={values.imageUrl}
      />
      <ActionButton isLoading={isSubmitting} label={submitLabel} onPress={submit} />
    </View>
  );
}
