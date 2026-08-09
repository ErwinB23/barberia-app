import { useState } from 'react';
import { View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { FormField } from '@/shared/components/ui/form-field';
import { Spacing } from '@/theme/spacing';

import type { YapeSettings } from '../types';
import {
  validateYapeSettingsForm,
  type YapeSettingsFormErrors,
  type YapeSettingsFormValues,
} from '../validation';

type YapeSettingsFormProps = {
  settings: YapeSettings;
  isSubmitting: boolean;
  onSubmit: (values: YapeSettingsFormValues) => void;
};

export function YapeSettingsForm({ settings, isSubmitting, onSubmit }: YapeSettingsFormProps) {
  const [values, setValues] = useState<YapeSettingsFormValues>({
    holderName: settings.yape_holder_name ?? '',
    phone: settings.yape_phone ?? '',
    qrUrl: settings.yape_qr_url ?? '',
  });
  const [errors, setErrors] = useState<YapeSettingsFormErrors>({});

  const updateField = (field: keyof YapeSettingsFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = () => {
    const nextErrors = validateYapeSettingsForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onSubmit(values);
    }
  };

  return (
    <View style={{ gap: Spacing.three }}>
      <FormField
        autoCapitalize="words"
        error={errors.holderName}
        label="Titular de Yape"
        maxLength={120}
        onChangeText={(value) => updateField('holderName', value)}
        placeholder="Nombre del titular"
        value={values.holderName}
      />
      <FormField
        error={errors.phone}
        keyboardType="phone-pad"
        label="Teléfono de Yape"
        maxLength={30}
        onChangeText={(value) => updateField('phone', value)}
        placeholder="+51 999 111 222"
        value={values.phone}
      />
      <FormField
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.qrUrl}
        helperText="Usa una URL pública del QR. La carga a Storage se implementará en otra iteración."
        keyboardType="url"
        label="URL del código QR"
        maxLength={2048}
        onChangeText={(value) => updateField('qrUrl', value)}
        placeholder="https://ejemplo.com/yape-qr.png"
        value={values.qrUrl}
      />
      <ActionButton isLoading={isSubmitting} label="Guardar Yape" onPress={submit} />
    </View>
  );
}
