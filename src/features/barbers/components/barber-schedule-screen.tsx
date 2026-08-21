import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router, Stack, type Href } from 'expo-router';
import Animated, { FadeIn, FadeOut, ReduceMotion, useReducedMotion } from 'react-native-reanimated';

import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Motion, Radius, TypeScale } from '@/theme/tokens';

import { deleteBarberSchedule } from '../actions';
import { buildBarberScheduleDays, getBarberWorkspaceRoutes, type Weekday } from '../barber-domain';
import { getBarberErrorMessage } from '../errors';
import { useBarberProfileResource } from '../hooks/use-barber-profile-resource';
import { getBarberSchedule, getBarbershopContextName, getBarbershopHours } from '../queries';
import type { BarberSchedule, BarbershopHour } from '../types';
import { BarberContextBanner } from './barber-context-banner';
import { BarberScreenSkeleton } from './barber-screen-skeleton';

function IntervalAction({
  accessibilityLabel,
  icon,
  label,
  onPress,
  tone = 'default',
}: {
  accessibilityLabel: string;
  icon: Parameters<typeof AppIcon>[0]['name'];
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);
  const foreground = tone === 'danger' ? theme.danger : theme.text;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.intervalAction,
        {
          backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
          borderColor: tone === 'danger' ? theme.danger : theme.border,
          boxShadow: isFocused ? `0 0 0 2px ${theme.focus}` : undefined,
        },
        getPressedScaleStyle(pressed, reduceMotion, 0.97),
      ]}
    >
      <AppIcon color={foreground} name={icon} size={18} />
      <ThemedText style={[styles.intervalActionLabel, { color: foreground }]}>{label}</ThemedText>
    </Pressable>
  );
}

type ScheduleDay = {
  weekday: Weekday;
  name: string;
  schedules: BarberSchedule[];
  hours: BarbershopHour[];
};

function GeneralHours({ hours }: { hours: readonly BarbershopHour[] }) {
  return (
    <ThemedText style={styles.reference} themeColor="textSecondary">
      Horario general:{' '}
      {hours.length
        ? hours.map((hour) => `${hour.startTime}–${hour.endTime}`).join(' · ')
        : 'Cerrado'}
    </ThemedText>
  );
}

function OwnScheduleDayCard({
  day,
  barberId,
  barbershopId,
  onDelete,
}: {
  day: ScheduleDay;
  barberId: string;
  barbershopId: string;
  onDelete: (schedule: BarberSchedule) => void;
}) {
  const theme = useTheme();

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.dayHeader}>
        <ThemedText style={styles.title}>{day.name}</ThemedText>
        <ThemedText style={styles.dayStatus} themeColor="textSecondary">
          {day.schedules.length > 0 ? 'Con horario' : 'Sin horario'}
        </ThemedText>
      </View>
      <GeneralHours hours={day.hours} />
      {day.schedules.length > 0 ? (
        day.schedules.map((schedule) => (
          <View key={schedule.id} style={[styles.interval, { borderTopColor: theme.border }]}>
            <ThemedText selectable style={styles.time}>
              {schedule.startTime} – {schedule.endTime}
            </ThemedText>
            <View style={styles.actions}>
              <IntervalAction
                accessibilityLabel={`Editar intervalo de ${schedule.startTime} a ${schedule.endTime}`}
                icon={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                label="Editar"
                onPress={() =>
                  router.push(
                    `/barbershops/${barbershopId}/barbers/${barberId}/schedule/${schedule.id}/edit`,
                  )
                }
              />
              <IntervalAction
                accessibilityLabel={`Eliminar intervalo de ${schedule.startTime} a ${schedule.endTime}`}
                icon={{ ios: 'trash', android: 'delete', web: 'delete' }}
                label="Eliminar"
                onPress={() => onDelete(schedule)}
                tone="danger"
              />
            </View>
          </View>
        ))
      ) : (
        <ThemedText themeColor="textSecondary">Sin horario configurado.</ThemedText>
      )}
      {day.hours.length > 0 ? (
        <View style={styles.addAction}>
          <IntervalAction
            accessibilityLabel={`Agregar intervalo para ${day.name}`}
            icon={{ ios: 'plus', android: 'add', web: 'add' }}
            label="Agregar"
            onPress={() =>
              router.push(
                `/barbershops/${barbershopId}/barbers/${barberId}/schedule/new?weekday=${day.weekday}`,
              )
            }
          />
        </View>
      ) : null}
    </SurfaceCard>
  );
}

function AdminScheduleDayCard({
  day,
  barberId,
  barbershopId,
  onDelete,
}: {
  day: ScheduleDay;
  barberId: string;
  barbershopId: string;
  onDelete: (schedule: BarberSchedule) => void;
}) {
  const theme = useTheme();

  return (
    <SurfaceCard style={styles.card}>
      <ThemedText style={styles.title}>{day.name}</ThemedText>
      <GeneralHours hours={day.hours} />
      {day.schedules.length > 0 ? (
        day.schedules.map((schedule) => (
          <View key={schedule.id} style={[styles.adminInterval, { borderTopColor: theme.border }]}>
            <ThemedText selectable style={styles.time}>
              {schedule.startTime} – {schedule.endTime}
            </ThemedText>
            <View style={styles.adminActions}>
              <ActionButton
                label="Editar"
                onPress={() =>
                  router.push(
                    `/barbershops/${barbershopId}/barbers/${barberId}/schedule/${schedule.id}/edit`,
                  )
                }
                variant="secondary"
              />
              <ActionButton label="Eliminar" onPress={() => onDelete(schedule)} variant="danger" />
            </View>
          </View>
        ))
      ) : (
        <ThemedText themeColor="textSecondary">Sin atención configurada.</ThemedText>
      )}
      <ActionButton
        disabled={day.hours.length === 0}
        label="Agregar intervalo"
        onPress={() =>
          router.push(
            `/barbershops/${barbershopId}/barbers/${barberId}/schedule/new?weekday=${day.weekday}`,
          )
        }
        variant="secondary"
      />
    </SurfaceCard>
  );
}

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
  const isDeletingRef = useRef(false);
  const load = useCallback(async () => {
    if (!barbershopId || !barberId) return { schedules: [], hours: [], barbershopName: null };
    const [schedules, hours, barbershopName] = await Promise.all([
      getBarberSchedule(barbershopId, barberId),
      getBarbershopHours(barbershopId),
      getBarbershopContextName(barbershopId),
    ]);
    return { schedules, hours, barbershopName };
  }, [barberId, barbershopId]);
  const resource = useBarberProfileResource(barbershopId, barberId, load, 'schedules');
  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await resource.reload();
    } finally {
      setIsRefreshing(false);
    }
  };
  const remove = async () => {
    if (
      !pending ||
      !barbershopId ||
      !barberId ||
      !resource.access.canManageSchedule ||
      isDeletingRef.current
    )
      return;
    isDeletingRef.current = true;
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
      isDeletingRef.current = false;
      setDeletingId(null);
    }
  };
  if (resource.isLoading) return <BarberScreenSkeleton />;
  if (!resource.access.canManageSchedule || !barbershopId || !barberId)
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage message={resource.error ?? 'No tienes acceso a este horario.'} />
        <ActionButton
          label="Reintentar"
          onPress={() => void resource.reload()}
          variant="secondary"
        />
      </ThemedView>
    );
  const schedules = resource.data?.schedules ?? [];
  const hours = resource.data?.hours ?? [];
  const days = buildBarberScheduleDays(schedules, hours);
  const routes = barbershopId && barberId ? getBarberWorkspaceRoutes(barbershopId, barberId) : null;
  const deleteConfirmation = pending ? (
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
  ) : null;
  return (
    <>
      {resource.isOwnProfile ? <Stack.Screen options={{ title: 'Mi horario' }} /> : null}
      <ThemedView style={styles.screen}>
        <FlatList
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          data={days}
          keyExtractor={(item) => String(item.weekday)}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <View style={styles.header}>
              {resource.isOwnProfile ? (
                <>
                  <BarberContextBanner
                    barbershopName={resource.data?.barbershopName ?? null}
                    onOpenWorkspace={
                      routes ? () => router.replace(routes.workspace as Href) : undefined
                    }
                  />
                  <ThemedText style={styles.intro} themeColor="textSecondary">
                    Define cuándo atiendes dentro del horario general de esta barbería.
                  </ThemedText>
                </>
              ) : (
                <ScreenHeading
                  description="Cada intervalo debe caber completamente dentro del horario general."
                  eyebrow="Disponibilidad operativa"
                  title="Horario individual"
                />
              )}
              <View style={resource.isOwnProfile ? styles.refreshAction : null}>
                <ActionButton
                  disabled={isRefreshing}
                  label="Actualizar horario"
                  onPress={() => void refresh()}
                  size={resource.isOwnProfile ? 'compact' : 'default'}
                  variant="secondary"
                />
              </View>
              {feedback ? (
                resource.isOwnProfile ? (
                  <Animated.View
                    entering={FadeIn.duration(Motion.state).reduceMotion(ReduceMotion.System)}
                    exiting={FadeOut.duration(Motion.exit).reduceMotion(ReduceMotion.System)}
                  >
                    <StatusMessage message={feedback} tone="success" />
                  </Animated.View>
                ) : (
                  <StatusMessage message={feedback} tone="success" />
                )
              ) : null}
              {resource.error || mutationError ? (
                <StatusMessage message={mutationError ?? resource.error!} />
              ) : null}
              {pending ? (
                resource.isOwnProfile ? (
                  <Animated.View
                    entering={FadeIn.duration(Motion.state).reduceMotion(ReduceMotion.System)}
                    exiting={FadeOut.duration(Motion.exit).reduceMotion(ReduceMotion.System)}
                  >
                    {deleteConfirmation}
                  </Animated.View>
                ) : (
                  deleteConfirmation
                )
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
          renderItem={({ item }) =>
            resource.isOwnProfile ? (
              <OwnScheduleDayCard
                barberId={barberId}
                barbershopId={barbershopId}
                day={item}
                onDelete={setPending}
              />
            ) : (
              <AdminScheduleDayCard
                barberId={barberId}
                barbershopId={barbershopId}
                day={item}
                onDelete={setPending}
              />
            )
          }
        />
      </ThemedView>
    </>
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
  intro: { maxWidth: 620, fontSize: TypeScale.label, lineHeight: 21 },
  refreshAction: { alignItems: 'flex-start' },
  separator: { height: Spacing.three },
  card: { gap: Spacing.three, padding: Spacing.four },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dayStatus: { marginLeft: 'auto', fontSize: TypeScale.caption, fontWeight: '700' },
  title: { fontSize: TypeScale.title, fontWeight: '700' },
  reference: { fontSize: TypeScale.label, lineHeight: 21 },
  interval: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
  },
  time: { fontSize: TypeScale.body, fontWeight: '700', fontVariant: ['tabular-nums'] },
  actions: { marginLeft: 'auto', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  addAction: { alignItems: 'flex-start' },
  intervalAction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.two,
  },
  intervalActionLabel: { fontSize: TypeScale.caption, fontWeight: '700' },
  adminInterval: { gap: Spacing.two, borderTopWidth: 1, paddingTop: Spacing.three },
  adminActions: { gap: Spacing.two },
  confirm: { gap: Spacing.three, padding: Spacing.four },
});
