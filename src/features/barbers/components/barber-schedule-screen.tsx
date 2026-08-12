import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, TypeScale } from '@/theme/tokens';

import { deleteBarberSchedule } from '../actions';
import { getWeekdayName, sortTimeIntervals, WEEKDAYS_MONDAY_FIRST } from '../barber-domain';
import { getBarberErrorMessage } from '../errors';
import { useAdminBarberResource } from '../hooks/use-admin-barber-resource';
import { getBarberSchedule, getBarbershopHours } from '../queries';
import type { BarberSchedule } from '../types';

export function BarberScheduleScreen({
  barbershopId,
  barberId,
  saved,
}: {
  barbershopId: string | null;
  barberId: string | null;
  saved: string | null;
}) {
  const theme = useTheme();
  const [pending, setPending] = useState<BarberSchedule | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(
    saved ? 'El horario individual se guardó correctamente.' : null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const load = useCallback(async () => {
    if (!barbershopId || !barberId) return { schedules: [], hours: [] };
    const [schedules, hours] = await Promise.all([
      getBarberSchedule(barbershopId, barberId),
      getBarbershopHours(barbershopId),
    ]);
    return { schedules, hours };
  }, [barberId, barbershopId]);
  const resource = useAdminBarberResource(barbershopId, load, 'schedules');
  const refresh = async () => {
    setIsRefreshing(true);
    await resource.reload();
    setIsRefreshing(false);
  };
  const remove = async () => {
    if (!pending || !barbershopId || !barberId || resource.role !== 'administrator') return;
    setDeletingId(pending.id);
    setMutationError(null);
    setFeedback(null);
    try {
      await deleteBarberSchedule(barbershopId, barberId, pending.id);
      setPending(null);
      setFeedback('Intervalo eliminado correctamente.');
      await resource.reload();
    } catch (mutation) {
      setMutationError(getBarberErrorMessage(mutation, 'schedules'));
    } finally {
      setDeletingId(null);
    }
  };
  if (resource.isLoading)
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Cargando horario individual…</ThemedText>
      </ThemedView>
    );
  if (resource.role !== 'administrator')
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage message={resource.error ?? 'No tienes acceso administrativo.'} />
        <ActionButton
          label="Reintentar"
          onPress={() => void resource.reload()}
          variant="secondary"
        />
      </ThemedView>
    );
  const schedules = resource.data?.schedules ?? [];
  const hours = resource.data?.hours ?? [];
  const days = WEEKDAYS_MONDAY_FIRST.map((weekday) => ({
    weekday,
    schedules: sortTimeIntervals(schedules.filter((item) => item.weekday === weekday)),
    hours: sortTimeIntervals(hours.filter((item) => item.weekday === weekday)),
  }));
  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={days}
        keyExtractor={(item) => String(item.weekday)}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              description="Cada intervalo debe caber completamente dentro del horario general."
              eyebrow="Disponibilidad operativa"
              title="Horario individual"
            />
            <ActionButton
              disabled={isRefreshing}
              label="Actualizar horario"
              onPress={() => void refresh()}
              variant="secondary"
            />
            {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
            {resource.error || mutationError ? (
              <StatusMessage message={mutationError ?? resource.error!} />
            ) : null}
            {pending ? (
              <SurfaceCard style={styles.confirm}>
                <ThemedText style={styles.title}>¿Eliminar intervalo?</ThemedText>
                <ThemedText themeColor="textSecondary">
                  La base rechazará el cambio si invalida una reserva futura confirmada.
                </ThemedText>
                <ActionButton
                  disabled={deletingId === pending.id}
                  label="Cancelar"
                  onPress={() => setPending(null)}
                  variant="secondary"
                />
                <ActionButton
                  isLoading={deletingId === pending.id}
                  label="Eliminar"
                  onPress={() => void remove()}
                  variant="danger"
                />
              </SurfaceCard>
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
          <SurfaceCard style={styles.card}>
            <ThemedText style={styles.title}>{getWeekdayName(item.weekday)}</ThemedText>
            <ThemedText style={styles.reference} themeColor="textSecondary">
              Horario general:{' '}
              {item.hours.length
                ? item.hours.map((hour) => `${hour.startTime}–${hour.endTime}`).join(' · ')
                : 'Cerrado'}
            </ThemedText>
            {item.schedules.length ? (
              item.schedules.map((schedule) => (
                <View key={schedule.id} style={[styles.interval, { borderTopColor: theme.border }]}>
                  <ThemedText selectable style={styles.time}>
                    {schedule.startTime} – {schedule.endTime}
                  </ThemedText>
                  <View style={styles.actions}>
                    <ActionButton
                      label="Editar"
                      onPress={() =>
                        router.push(
                          `/barbershops/${barbershopId}/barbers/${barberId}/schedule/${schedule.id}/edit`,
                        )
                      }
                      variant="secondary"
                    />
                    <ActionButton
                      label="Eliminar"
                      onPress={() => setPending(schedule)}
                      variant="danger"
                    />
                  </View>
                </View>
              ))
            ) : (
              <ThemedText themeColor="textSecondary">Sin atención configurada.</ThemedText>
            )}
            <ActionButton
              disabled={item.hours.length === 0}
              label="Agregar intervalo"
              onPress={() =>
                router.push(
                  `/barbershops/${barbershopId}/barbers/${barberId}/schedule/new?weekday=${item.weekday}`,
                )
              }
              variant="secondary"
            />
          </SurfaceCard>
        )}
      />
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  content: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: { gap: Spacing.four, paddingBottom: Spacing.four },
  separator: { height: Spacing.three },
  card: { gap: Spacing.three, padding: Spacing.four },
  title: { fontSize: TypeScale.title, fontWeight: '700' },
  reference: { fontSize: TypeScale.label, lineHeight: 21 },
  interval: { gap: Spacing.two, borderTopWidth: 1, paddingTop: Spacing.three },
  time: { fontSize: TypeScale.body, fontWeight: '700', fontVariant: ['tabular-nums'] },
  actions: { gap: Spacing.two },
  confirm: { gap: Spacing.three, padding: Spacing.four },
});
