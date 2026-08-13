import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ActionButton } from '@/shared/components/ui/action-button';
import { FormField } from '@/shared/components/ui/form-field';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';

import { createBarberSchedule, updateBarberSchedule } from '../actions';
import {
  getWeekdayName,
  parseBarberScheduleForm,
  type BarberScheduleFormErrors,
  type BarberScheduleFormValues,
  type Weekday,
} from '../barber-domain';
import { getBarberErrorMessage } from '../errors';
import { useBarberProfileResource } from '../hooks/use-barber-profile-resource';
import { getBarberSchedule, getBarbershopHours } from '../queries';
import type { BarberSchedule, BarbershopHour } from '../types';
import { BarberFormPage } from './barber-form-page';

type Props = {
  mode: 'create' | 'edit';
  barbershopId: string | null;
  barberId: string | null;
  weekday: Weekday | null;
  scheduleId: string | null;
};

type FormProps = {
  mode: 'create' | 'edit';
  barbershopId: string;
  barberId: string;
  weekday: Weekday;
  scheduleId: string | null;
  target: BarberSchedule | null;
  schedules: BarberSchedule[];
  openingHours: BarbershopHour[];
};

function ScheduleEditorForm({
  mode,
  barbershopId,
  barberId,
  weekday,
  scheduleId,
  target,
  schedules,
  openingHours,
}: FormProps) {
  const [values, setValues] = useState<BarberScheduleFormValues>(
    target
      ? { startTime: target.startTime, endTime: target.endTime }
      : { startTime: '', endTime: '' },
  );
  const [errors, setErrors] = useState<BarberScheduleFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const update = (field: keyof BarberScheduleFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = async () => {
    const sameDay = schedules.filter((item) => item.weekday === weekday);
    const opening = openingHours.filter((item) => item.weekday === weekday);
    const parsed = parseBarberScheduleForm(values, sameDay, opening, target?.id);
    setErrors(parsed.errors);
    if (!parsed.values) return;

    setIsSubmitting(true);
    setMutationError(null);
    try {
      if (mode === 'create') {
        await createBarberSchedule(barbershopId, barberId, weekday, parsed.values);
      } else if (scheduleId) {
        await updateBarberSchedule(barbershopId, barberId, scheduleId, weekday, parsed.values);
      }
      router.replace(`/barbershops/${barbershopId}/barbers/${barberId}/schedule?saved=${mode}`);
    } catch (mutation) {
      setMutationError(getBarberErrorMessage(mutation, 'schedules'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const opening = openingHours.filter((item) => item.weekday === weekday);
  return (
    <BarberFormPage
      description={`Horario de ${getWeekdayName(weekday).toLowerCase()}. Disponible: ${opening.length ? opening.map((item) => `${item.startTime}–${item.endTime}`).join(' · ') : 'cerrado'}.`}
      title={mode === 'create' ? 'Nuevo intervalo' : 'Editar intervalo'}
    >
      {mutationError ? <StatusMessage message={mutationError} /> : null}
      <View style={styles.form}>
        <FormField
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.startTime}
          helperText="Formato de 24 horas HH:mm."
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
          error={errors.endTime}
          helperText="Debe caber en un único intervalo general y no solaparse."
          label="Hora de fin"
          maxLength={5}
          onChangeText={(value) => update('endTime', value)}
          placeholder="13:00"
          required
          value={values.endTime}
        />
        <ActionButton
          isLoading={isSubmitting}
          label="Guardar horario"
          onPress={() => void submit()}
        />
      </View>
    </BarberFormPage>
  );
}

export function BarberScheduleEditorScreen({
  mode,
  barbershopId,
  barberId,
  weekday: requestedWeekday,
  scheduleId,
}: Props) {
  const load = useCallback(async () => {
    if (!barbershopId || !barberId) return { schedules: [], hours: [] };
    const [schedules, hours] = await Promise.all([
      getBarberSchedule(barbershopId, barberId),
      getBarbershopHours(barbershopId),
    ]);
    return { schedules, hours };
  }, [barberId, barbershopId]);
  const resource = useBarberProfileResource(barbershopId, barberId, load, 'schedules');
  const target =
    mode === 'edit' ? resource.data?.schedules.find((item) => item.id === scheduleId) : null;
  const weekday = mode === 'edit' ? (target?.weekday ?? null) : requestedWeekday;

  if (resource.isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Preparando horario…</ThemedText>
      </ThemedView>
    );
  }
  if (
    !resource.access.canManageSchedule ||
    !barbershopId ||
    !barberId ||
    weekday === null ||
    (mode === 'edit' && !target)
  ) {
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage message={resource.error ?? 'El intervalo solicitado no está disponible.'} />
        <ActionButton
          label="Reintentar"
          onPress={() => void resource.reload()}
          variant="secondary"
        />
      </ThemedView>
    );
  }

  return (
    <ScheduleEditorForm
      barberId={barberId}
      barbershopId={barbershopId}
      key={target?.id ?? `new-${weekday}`}
      mode={mode}
      openingHours={resource.data?.hours ?? []}
      scheduleId={scheduleId}
      schedules={resource.data?.schedules ?? []}
      target={target ?? null}
      weekday={weekday}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  form: { gap: Spacing.three },
});
