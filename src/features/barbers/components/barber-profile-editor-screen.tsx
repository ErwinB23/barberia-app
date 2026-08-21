import { useCallback, useRef, useState } from 'react';
import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';

import { ActionButton } from '@/shared/components/ui/action-button';
import { FormField } from '@/shared/components/ui/form-field';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';
import { Motion, TypeScale } from '@/theme/tokens';

import { updateBarberPublicProfile } from '../actions';
import {
  parseBarberProfileForm,
  type BarberProfileFormErrors,
  type BarberProfileFormValues,
} from '../barber-domain';
import { getBarberErrorMessage } from '../errors';
import { useBarberProfileResource } from '../hooks/use-barber-profile-resource';
import { getBarber, getBarbershopContextName } from '../queries';
import type { Barber } from '../types';
import { BarberAvatar } from './barber-avatar';
import { BarberFormPage } from './barber-form-page';
import { BarberScreenSkeleton } from './barber-screen-skeleton';

function BarberProfileForm({
  barber,
  barbershopName,
  showPreview,
  reload,
}: {
  barber: Barber;
  barbershopName: string | null;
  showPreview: boolean;
  reload: () => Promise<void>;
}) {
  const [values, setValues] = useState<BarberProfileFormValues>({
    displayName: barber.displayName,
    bio: barber.bio ?? '',
    photoUrl: barber.photoUrl ?? '',
  });
  const [errors, setErrors] = useState<BarberProfileFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const isSavingRef = useRef(false);

  const setField = (field: keyof BarberProfileFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMutationError(null);
    setFeedback(null);
  };

  const save = async () => {
    if (isSavingRef.current) return;
    const parsed = parseBarberProfileForm(values);
    setErrors(parsed.errors);
    if (!parsed.values) return;

    isSavingRef.current = true;
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
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const previewName = values.displayName.trim() || 'Tu nombre profesional';
  const statusFeedback =
    feedback || mutationError ? (
      <View style={styles.feedback}>
        {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
        {mutationError ? <StatusMessage message={mutationError} /> : null}
      </View>
    ) : null;

  return (
    <>
      {showPreview ? <Stack.Screen options={{ title: 'Perfil profesional' }} /> : null}
      <BarberFormPage
        barbershopName={barbershopName}
        description="Actualiza únicamente la información pública que verán los clientes."
        intro={
          showPreview ? (
            <SurfaceCard style={styles.previewCard}>
              <ThemedText accessibilityRole="header" style={styles.previewTitle}>
                Vista previa para clientes
              </ThemedText>
              <View style={styles.previewProfile}>
                <BarberAvatar displayName={previewName} photoUrl={values.photoUrl} size={64} />
                <View style={styles.previewCopy}>
                  <ThemedText style={styles.previewName}>{previewName}</ThemedText>
                  <ThemedText style={styles.previewBio} themeColor="textSecondary">
                    {values.bio.trim() || 'Tu presentación aparecerá aquí.'}
                  </ThemedText>
                </View>
              </View>
            </SurfaceCard>
          ) : undefined
        }
        title={showPreview ? undefined : 'Editar perfil público'}
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
        {showPreview ? (
          statusFeedback ? (
            <Animated.View
              entering={FadeIn.duration(Motion.state).reduceMotion(ReduceMotion.System)}
              exiting={FadeOut.duration(Motion.exit).reduceMotion(ReduceMotion.System)}
            >
              {statusFeedback}
            </Animated.View>
          ) : null
        ) : (
          <>
            {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
            {mutationError ? <StatusMessage message={mutationError} /> : null}
          </>
        )}
        <ActionButton isLoading={isSaving} label="Guardar perfil" onPress={() => void save()} />
        <ActionButton
          disabled={isSaving}
          label="Cancelar"
          onPress={() => router.back()}
          variant="secondary"
        />
      </BarberFormPage>
    </>
  );
}

export function BarberProfileEditorScreen({
  barbershopId,
  barberId,
}: {
  barbershopId: string | null;
  barberId: string | null;
}) {
  const loadBarber = useCallback(async () => {
    if (!barbershopId || !barberId) return null;
    const [barber, barbershopName] = await Promise.all([
      getBarber(barbershopId, barberId),
      getBarbershopContextName(barbershopId),
    ]);
    return barber ? { barber, barbershopName } : null;
  }, [barberId, barbershopId]);
  const { data, access, isOwnProfile, isLoading, error, reload } = useBarberProfileResource(
    barbershopId,
    barberId,
    loadBarber,
  );
  const barber = data?.barber ?? null;

  if (isLoading) return <BarberScreenSkeleton variant="form" />;

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

  return (
    <BarberProfileForm
      barber={barber}
      barbershopName={data?.barbershopName ?? null}
      reload={reload}
      showPreview={isOwnProfile}
    />
  );
}

const styles = StyleSheet.create({
  previewCard: { gap: Spacing.three, padding: Spacing.four },
  previewTitle: { fontSize: TypeScale.body, fontWeight: '800' },
  previewProfile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  previewCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  previewName: { fontSize: TypeScale.title, fontWeight: '800', lineHeight: 27 },
  previewBio: { fontSize: TypeScale.label, lineHeight: 21 },
  feedback: { gap: Spacing.two },
});
