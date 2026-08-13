import { useCallback, useState } from 'react';
import { router } from 'expo-router';

import { ActionButton } from '@/shared/components/ui/action-button';
import { FormField } from '@/shared/components/ui/form-field';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';

import { updateBarberPublicProfile } from '../actions';
import {
  parseBarberProfileForm,
  type BarberProfileFormErrors,
  type BarberProfileFormValues,
} from '../barber-domain';
import { getBarberErrorMessage } from '../errors';
import { useBarberProfileResource } from '../hooks/use-barber-profile-resource';
import { getBarber } from '../queries';
import type { Barber } from '../types';
import { BarberFormPage } from './barber-form-page';

function BarberProfileForm({ barber, reload }: { barber: Barber; reload: () => Promise<void> }) {
  const [values, setValues] = useState<BarberProfileFormValues>({
    displayName: barber.displayName,
    bio: barber.bio ?? '',
    photoUrl: barber.photoUrl ?? '',
  });
  const [errors, setErrors] = useState<BarberProfileFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const setField = (field: keyof BarberProfileFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMutationError(null);
    setFeedback(null);
  };

  const save = async () => {
    const parsed = parseBarberProfileForm(values);
    setErrors(parsed.errors);
    if (!parsed.values) return;

    setIsSaving(true);
    setMutationError(null);
    setFeedback(null);
    try {
      await updateBarberPublicProfile(barber.barbershopId, barber.id, parsed.values);
      setValues({
        displayName: parsed.values.displayName,
        bio: parsed.values.bio ?? '',
        photoUrl: parsed.values.photoUrl ?? '',
      });
      setFeedback('El perfil público se actualizó correctamente.');
      await reload();
    } catch (mutation) {
      setMutationError(getBarberErrorMessage(mutation, 'barbers'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BarberFormPage
      description="Actualiza únicamente la información pública que verán los clientes."
      title="Editar perfil público"
    >
      <FormField
        autoCapitalize="words"
        error={errors.displayName}
        label="Nombre público"
        maxLength={120}
        onChangeText={(value) => setField('displayName', value)}
        required
        returnKeyType="next"
        value={values.displayName}
      />
      <FormField
        error={errors.bio}
        helperText="Máximo 500 caracteres."
        label="Biografía"
        maxLength={500}
        multiline
        onChangeText={(value) => setField('bio', value)}
        value={values.bio}
      />
      <FormField
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.photoUrl}
        helperText="Usa una URL HTTPS. La subida de imágenes se implementará más adelante."
        keyboardType="url"
        label="URL de foto"
        onChangeText={(value) => setField('photoUrl', value)}
        value={values.photoUrl}
      />
      {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
      {mutationError ? <StatusMessage message={mutationError} /> : null}
      <ActionButton isLoading={isSaving} label="Guardar perfil" onPress={() => void save()} />
      <ActionButton
        disabled={isSaving}
        label="Volver sin guardar"
        onPress={() => router.back()}
        variant="secondary"
      />
    </BarberFormPage>
  );
}

export function BarberProfileEditorScreen({
  barbershopId,
  barberId,
}: {
  barbershopId: string | null;
  barberId: string | null;
}) {
  const loadBarber = useCallback(
    () => (barbershopId && barberId ? getBarber(barbershopId, barberId) : Promise.resolve(null)),
    [barberId, barbershopId],
  );
  const {
    data: barber,
    access,
    isLoading,
    error,
    reload,
  } = useBarberProfileResource(barbershopId, barberId, loadBarber);

  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', padding: Spacing.four }}>
        <ThemedText themeColor="textSecondary">Cargando perfil…</ThemedText>
      </ThemedView>
    );
  }

  if (!barber || !access.canEditProfile) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: 'center', gap: Spacing.three, padding: Spacing.four }}
      >
        <StatusMessage message={error ?? 'El perfil solicitado no está disponible.'} />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
      </ThemedView>
    );
  }

  return <BarberProfileForm barber={barber} reload={reload} />;
}
