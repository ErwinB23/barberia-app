import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ActionButton } from '@/shared/components/ui/action-button';
import { ListScreenSkeleton } from '@/shared/components/ui/list-screen-skeleton';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, TypeScale } from '@/theme/tokens';

import { deleteBarbershopHour } from '../actions';
import { getScheduleErrorMessage } from '../errors';
import { useAdminScheduleResource } from '../hooks/use-admin-schedule-resource';
import { getBarbershopHours } from '../queries';
import { getWeekdayName, sortHourIntervals, WEEKDAYS_MONDAY_FIRST } from '../schedule-domain';
import type { BarbershopHour } from '../types';
import { ScheduleDeleteConfirmation } from './schedule-delete-confirmation';
import { WeekdayCard } from './weekday-card';

const SAVED_MESSAGES: Record<string, string> = {
  'hour-created': 'El intervalo se agregó correctamente.',
  'hour-updated': 'El intervalo se actualizó correctamente.',
};

type WeeklyScheduleScreenProps = {
  barbershopId: string | null;
  saved: string | null;
};

export function WeeklyScheduleScreen({ barbershopId, saved }: WeeklyScheduleScreenProps) {
  const theme = useTheme();
  const [pendingDeletion, setPendingDeletion] = useState<BarbershopHour | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(SAVED_MESSAGES[saved ?? ''] ?? null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadHours = useCallback(
    () => (barbershopId ? getBarbershopHours(barbershopId) : Promise.resolve([])),
    [barbershopId],
  );
  const { data, role, isLoading, error, reload } = useAdminScheduleResource(
    barbershopId,
    loadHours,
    'hours',
  );

  const refresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  const removeHour = async () => {
    if (!barbershopId || !pendingDeletion || role !== 'administrator') {
      return;
    }

    const dayIntervalCount = (data ?? []).filter(
      (hour) => hour.weekday === pendingDeletion.weekday,
    ).length;
    setDeletingId(pendingDeletion.id);
    setMutationError(null);
    setFeedback(null);

    try {
      await deleteBarbershopHour(barbershopId, pendingDeletion.id);
      setFeedback(
        dayIntervalCount === 1
          ? `Intervalo eliminado. ${getWeekdayName(pendingDeletion.weekday)} quedó cerrado.`
          : 'El intervalo se eliminó correctamente.',
      );
      setPendingDeletion(null);
      await reload();
    } catch (mutation) {
      setMutationError(getScheduleErrorMessage(mutation, 'hours'));
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <ListScreenSkeleton rows={4} />;
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

  const hours = data ?? [];
  const days = WEEKDAYS_MONDAY_FIRST.map((weekday) => ({
    weekday,
    intervals: sortHourIntervals(hours.filter((hour) => hour.weekday === weekday)),
  }));
  const pendingDayIntervals = pendingDeletion
    ? hours.filter((hour) => hour.weekday === pendingDeletion.weekday).length
    : 0;

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={days}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={({ weekday }) => String(weekday)}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              compact
              description="Define uno o varios intervalos por día. Un día sin intervalos permanece cerrado."
              eyebrow="Operación"
              title="Horario semanal"
            />
            <ActionButton
              label="Cierres excepcionales"
              onPress={() => router.push(`/barbershops/${barbershopId}/schedules/closures`)}
              variant="secondary"
            />

            <SurfaceCard style={styles.infoCard}>
              <ThemedText style={styles.infoTitle}>Protección de agenda</ThemedText>
              <ThemedText style={styles.infoText} themeColor="textSecondary">
                La base rechazará cambios que dejen fuera horarios individuales de barberos ya
                configurados.
              </ThemedText>
            </SurfaceCard>

            {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
            {error || mutationError ? <StatusMessage message={mutationError ?? error!} /> : null}
            {pendingDeletion ? (
              <ScheduleDeleteConfirmation
                description={
                  pendingDayIntervals === 1
                    ? `${getWeekdayName(pendingDeletion.weekday)} quedará cerrado. La base validará que el cambio no invalide horarios de barberos.`
                    : `Se eliminará ${pendingDeletion.startTime} – ${pendingDeletion.endTime} de ${getWeekdayName(pendingDeletion.weekday)}.`
                }
                isSubmitting={deletingId === pendingDeletion.id}
                onCancel={() => setPendingDeletion(null)}
                onConfirm={() => void removeHour()}
                title="¿Eliminar intervalo?"
              />
            ) : null}
          </View>
        }
        refreshControl={
          <RefreshControl
            colors={[theme.primary]}
            onRefresh={() => void refresh()}
            refreshing={isRefreshing}
            tintColor={theme.primary}
          />
        }
        renderItem={({ item }) => (
          <WeekdayCard
            deletingId={deletingId}
            intervals={item.intervals}
            onAdd={() =>
              router.push(
                `/barbershops/${barbershopId}/schedules/hours/new?weekday=${item.weekday}`,
              )
            }
            onDelete={setPendingDeletion}
            onEdit={(hour) =>
              router.push(`/barbershops/${barbershopId}/schedules/hours/${hour.id}/edit`)
            }
            weekday={item.weekday}
          />
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    gap: Spacing.four,
    paddingBottom: Spacing.four,
  },
  separator: {
    height: Spacing.three,
  },
  infoCard: {
    gap: Spacing.one,
    padding: Spacing.three,
  },
  infoTitle: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  infoText: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
});
