import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { FormField } from '@/shared/components/ui/form-field';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

import {
  parseProfileForm,
  type ParsedProfileFormValues,
  type ProfileFormErrors,
  type ProfileFormValues,
} from '../profile-domain';
import type { UserProfile } from '../types';

type ProfilePersonalFormProps = {
  onClose: () => void;
  onSave: (values: ParsedProfileFormValues) => Promise<UserProfile>;
  profile: UserProfile;
};

export function ProfilePersonalForm({ onClose, onSave, profile }: ProfilePersonalFormProps) {
  const [values, setValues] = useState<ProfileFormValues>({
    fullName: profile.fullName ?? '',
    phone: profile.phone ?? '',
    avatarUrl: profile.avatarUrl ?? '',
  });
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const setField = (field: keyof ProfileFormValues, value: string) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    setSaveError(null);
    setFeedback(null);
  };

  const save = async () => {
    const parsed = parseProfileForm(values);
    setErrors(parsed.errors);
    if (!parsed.values) return;

    setIsSaving(true);
    setSaveError(null);
    setFeedback(null);

    try {
      const updatedProfile = await onSave(parsed.values);
      setValues({
        fullName: updatedProfile.fullName ?? '',
        phone: updatedProfile.phone ?? '',
        avatarUrl: updatedProfile.avatarUrl ?? '',
      });
      setFeedback('Tus datos personales se actualizaron.');
    } catch {
      setSaveError('No pudimos guardar tus cambios. Inténtalo nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.heading}>
        <ThemedText accessibilityRole="header" style={styles.title}>
          Datos personales
        </ThemedText>
        <ThemedText style={styles.description} themeColor="textSecondary">
          Mantén actualizada la información con la que reconocemos tu cuenta.
        </ThemedText>
      </View>
      <FormField
        autoCapitalize="words"
        error={errors.fullName}
        label="Nombre completo"
        maxLength={120}
        onChangeText={(value) => setField('fullName', value)}
        required
        returnKeyType="next"
        value={values.fullName}
      />
      <FormField
        error={errors.phone}
        keyboardType="phone-pad"
        label="Teléfono"
        maxLength={30}
        onChangeText={(value) => setField('phone', value)}
        value={values.phone}
      />
      <FormField
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.avatarUrl}
        helperText="Puedes usar un enlace HTTPS. La app aún no sube archivos directamente."
        keyboardType="url"
        label="Foto de perfil (enlace)"
        onChangeText={(value) => setField('avatarUrl', value)}
        value={values.avatarUrl}
      />
      {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
      {saveError ? <StatusMessage message={saveError} /> : null}
      <View style={styles.actions}>
        <ActionButton isLoading={isSaving} label="Guardar cambios" onPress={() => void save()} />
        <ActionButton
          disabled={isSaving}
          label="Cerrar edición"
          onPress={onClose}
          variant="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.four,
  },
  heading: {
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
