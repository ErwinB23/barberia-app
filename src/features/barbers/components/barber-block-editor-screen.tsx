import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { ActionButton } from '@/shared/components/ui/action-button';
import { FormField } from '@/shared/components/ui/form-field';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';

import { createBarberBlock } from '../actions';
import { parseBlockForm, type BlockFormErrors, type BlockFormValues } from '../barber-domain';
import { getBarberErrorMessage } from '../errors';
import { useBarberProfileResource } from '../hooks/use-barber-profile-resource';
import { BarberFormPage } from './barber-form-page';

const EMPTY: BlockFormValues = {
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  reason: '',
};

export function BarberBlockEditorScreen({
  barbershopId,
  barberId,
}: {
  barbershopId: string | null;
  barberId: string | null;
}) {
  const { user } = useAuth();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<BlockFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const load = useCallback(() => Promise.resolve(true), []);
  const resource = useBarberProfileResource(barbershopId, barberId, load, 'blocks');
  const update = (field: keyof BlockFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const submit = async () => {
    if (!barbershopId || !barberId || !user || !resource.access.canManageBlocks) return;
    const parsed = parseBlockForm(values);
    setErrors(parsed.errors);
    if (!parsed.values) return;
    setIsSubmitting(true);
    setMutationError(null);
    try {
      await createBarberBlock(barbershopId, barberId, user.id, parsed.values);
      router.replace(`/barbershops/${barbershopId}/barbers/${barberId}/blocks?saved=created`);
    } catch (mutation) {
      setMutationError(getBarberErrorMessage(mutation, 'blocks'));
    } finally {
      setIsSubmitting(false);
    }
  };
  if (resource.isLoading)
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Preparando bloqueo…</ThemedText>
      </ThemedView>
    );
  if (!resource.access.canManageBlocks)
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage message={resource.error ?? 'No tienes acceso a estos bloqueos.'} />
        <ActionButton
          label="Reintentar"
          onPress={() => void resource.reload()}
          variant="secondary"
        />
      </ThemedView>
    );
  return (
    <BarberFormPage
      description="Las fechas y horas se interpretan en horario de Lima."
      title="Nuevo bloqueo"
    >
      {mutationError ? <StatusMessage message={mutationError} /> : null}
      <View style={styles.form}>
        <FormField
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.startDate}
          helperText="Formato AAAA-MM-DD."
          label="Fecha de inicio"
          maxLength={10}
          onChangeText={(value) => update('startDate', value)}
          placeholder="2026-08-30"
          required
          value={values.startDate}
        />
        <FormField
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.startTime}
          helperText="Formato HH:mm."
          label="Hora de inicio"
          maxLength={5}
          onChangeText={(value) => update('startTime', value)}
          placeholder="09:00"
          required
          value={values.startTime}
        />
        <FormField
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.endDate}
          helperText="Puede ser el mismo día o uno posterior."
          label="Fecha de fin"
          maxLength={10}
          onChangeText={(value) => update('endDate', value)}
          placeholder="2026-08-30"
          required
          value={values.endDate}
        />
        <FormField
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.endTime}
          helperText="Debe ser posterior al inicio."
          label="Hora de fin"
          maxLength={5}
          onChangeText={(value) => update('endTime', value)}
          placeholder="10:00"
          required
          value={values.endTime}
        />
        <FormField
          error={errors.reason}
          label="Motivo"
          maxLength={250}
          multiline
          onChangeText={(value) => update('reason', value)}
          placeholder="Cita personal, descanso o trámite."
          value={values.reason}
        />
        <ActionButton
          isLoading={isSubmitting}
          label="Crear bloqueo"
          onPress={() => void submit()}
        />
      </View>
    </BarberFormPage>
  );
}
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  form: { gap: Spacing.three },
});
