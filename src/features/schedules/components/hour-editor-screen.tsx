import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';

import { createBarbershopHour, updateBarbershopHour } from '../actions';
import { getScheduleErrorMessage } from '../errors';
import { useAdminScheduleResource } from '../hooks/use-admin-schedule-resource';
import { getBarbershopHours } from '../queries';
import { getWeekdayName, type HourFormValues, type Weekday } from '../schedule-domain';
import { HourForm } from './hour-form';
import { ScheduleFormPage } from './schedule-form-page';

type HourEditorScreenProps =
  | {
      mode: 'create';
      barbershopId: string | null;
      weekday: Weekday | null;
      hourId?: never;
    }
  | {
      mode: 'edit';
      barbershopId: string | null;
      weekday?: never;
      hourId: string | null;
    };

export function HourEditorScreen(props: HourEditorScreenProps) {
  const { barbershopId, mode } = props;
  const hourId = mode === 'edit' ? props.hourId : null;
  const requestedWeekday = mode === 'create' ? props.weekday : null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const loadHours = useCallback(
    () => (barbershopId ? getBarbershopHours(barbershopId) : Promise.resolve([])),
    [barbershopId],
  );
  const { data, role, isLoading, error, reload } = useAdminScheduleResource(
    barbershopId,
    loadHours,
    'hours',
  );
  const targetHour = mode === 'edit' ? data?.find((hour) => hour.id === hourId) : null;
  const weekday = mode === 'create' ? requestedWeekday : (targetHour?.weekday ?? null);

  const submit = async (values: HourFormValues) => {
    if (!barbershopId || weekday === null || role !== 'administrator') {
      return;
    }

    setIsSubmitting(true);
    setMutationError(null);

    try {
      if (mode === 'create') {
        await createBarbershopHour(barbershopId, weekday, values);
      } else {
        if (!hourId) {
          return;
        }
        await updateBarbershopHour(barbershopId, hourId, weekday, values);
      }

      const saved = mode === 'create' ? 'hour-created' : 'hour-updated';
      router.replace(`/barbershops/${barbershopId}/schedules?saved=${saved}`);
    } catch (mutation) {
      setMutationError(getScheduleErrorMessage(mutation, 'hours'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">
          {mode === 'create' ? 'Preparando formulario…' : 'Cargando intervalo…'}
        </ThemedText>
      </ThemedView>
    );
  }

  if (role !== 'administrator') {
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage
          message={
            error ?? 'Solo un administrador activo de esta barbería puede gestionar sus horarios.'
          }
        />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
      </ThemedView>
    );
  }

  if (weekday === null || (mode === 'edit' && (!targetHour || !hourId))) {
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage message={error ?? 'El intervalo solicitado no está disponible.'} />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
      </ThemedView>
    );
  }

  const sameDayIntervals = (data ?? []).filter((hour) => hour.weekday === weekday);

  return (
    <ScheduleFormPage
      description={`Configura un intervalo de atención para ${getWeekdayName(weekday).toLowerCase()}.`}
      title={mode === 'create' ? 'Nuevo intervalo' : 'Editar intervalo'}
    >
      {mutationError ? <StatusMessage message={mutationError} /> : null}
      <HourForm
        excludedId={targetHour?.id}
        existingIntervals={sameDayIntervals}
        initialValues={
          targetHour ? { startTime: targetHour.startTime, endTime: targetHour.endTime } : undefined
        }
        isSubmitting={isSubmitting}
        onSubmit={(values) => void submit(values)}
        submitLabel={mode === 'create' ? 'Agregar intervalo' : 'Guardar cambios'}
      />
    </ScheduleFormPage>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
});
