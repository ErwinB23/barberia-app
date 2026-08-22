import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
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

import { deleteBarberBlock } from '../actions';
import { getBarberWorkspaceRoutes } from '../barber-domain';
import { getBarberErrorMessage } from '../errors';
import { useBarberProfileResource } from '../hooks/use-barber-profile-resource';
import { getBarbershopContextName, getUpcomingBarberBlocks } from '../queries';
import type { BarberBlock } from '../types';
import { BarberContextBanner } from './barber-context-banner';
import { BarberScreenSkeleton } from './barber-screen-skeleton';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'full',
  timeZone: 'America/Lima',
});
const TIME_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/Lima',
});
const DATE_KEY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'America/Lima',
});

function formatDate(value: string) {
  return DATE_FORMATTER.format(new Date(value));
}

function formatTime(value: string) {
  return TIME_FORMATTER.format(new Date(value));
}

function formatBlockRange(block: BarberBlock) {
  const startsAt = new Date(block.startsAt);
  const endsAt = new Date(block.endsAt);
  if (DATE_KEY_FORMATTER.format(startsAt) === DATE_KEY_FORMATTER.format(endsAt)) {
    return `${formatTime(block.startsAt)} - ${formatTime(block.endsAt)}`;
  }
  return `${formatTime(block.startsAt)} - ${formatDate(block.endsAt)}, ${formatTime(block.endsAt)}`;
}

function BlockDeleteAction({ block, onPress }: { block: BarberBlock; onPress: () => void }) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Pressable
      accessibilityLabel={`Eliminar bloqueo del ${formatDate(block.startsAt)}`}
      accessibilityRole="button"
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.deleteAction,
        {
          backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
          borderColor: theme.danger,
          boxShadow: isFocused ? `0 0 0 2px ${theme.focus}` : undefined,
        },
        getPressedScaleStyle(pressed, reduceMotion, 0.97),
      ]}
    >
      <AppIcon
        color={theme.danger}
        name={{ ios: 'trash', android: 'delete', web: 'delete' }}
        size={18}
      />
      <ThemedText style={[styles.deleteActionLabel, { color: theme.danger }]}>Eliminar</ThemedText>
    </Pressable>
  );
}

export function BarberBlocksScreen({
  barbershopId,
  barberId,
  saved,
}: {
  barbershopId: string | null;
  barberId: string | null;
  saved: string | null;
}) {
  const theme = useTheme();
  const [pending, setPending] = useState<BarberBlock | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(
    saved ? 'Bloqueo creado correctamente.' : null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isDeletingRef = useRef(false);
  const load = useCallback(
    () =>
      barbershopId && barberId
        ? Promise.all([
            getUpcomingBarberBlocks(barbershopId, barberId),
            getBarbershopContextName(barbershopId),
          ]).then(([blocks, barbershopName]) => ({ blocks, barbershopName }))
        : Promise.resolve({ blocks: [], barbershopName: null }),
    [barberId, barbershopId],
  );
  const resource = useBarberProfileResource(barbershopId, barberId, load, 'blocks');
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
      !resource.access.canManageBlocks ||
      isDeletingRef.current
    )
      return;
    isDeletingRef.current = true;
    setDeletingId(pending.id);
    setMutationError(null);
    setFeedback(null);
    try {
      await deleteBarberBlock(barbershopId, barberId, pending.id);
      setPending(null);
      setFeedback('Bloqueo eliminado correctamente.');
      await resource.reload();
    } catch (mutation) {
      setMutationError(getBarberErrorMessage(mutation, 'blocks'));
    } finally {
      isDeletingRef.current = false;
      setDeletingId(null);
    }
  };
  if (resource.isLoading) return <BarberScreenSkeleton />;
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
  const blocks = resource.data?.blocks ?? [];
  const routes = barbershopId && barberId ? getBarberWorkspaceRoutes(barbershopId, barberId) : null;
  const deleteConfirmation = pending ? (
    <SurfaceCard style={styles.warning}>
      <ThemedText style={styles.title}>¿Eliminar bloqueo?</ThemedText>
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
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={blocks}
        keyExtractor={(item) => item.id}
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
                  Reserva tiempo en el que no estarás disponible para atender.
                </ThemedText>
              </>
            ) : (
              <ScreenHeading
                compact
                description="Registra períodos excepcionales en los que el barbero no atenderá."
                eyebrow="Agenda"
                title="Bloqueos futuros"
              />
            )}
            <ActionButton
              label={resource.isOwnProfile ? 'Crear bloqueo' : 'Nuevo bloqueo'}
              onPress={() =>
                router.push(`/barbershops/${barbershopId}/barbers/${barberId}/blocks/new`)
              }
            />
            {!resource.isOwnProfile ? (
              <ActionButton
                disabled={isRefreshing}
                label="Actualizar bloqueos"
                onPress={() => void refresh()}
                variant="secondary"
              />
            ) : null}
            <SurfaceCard style={[styles.warning, { backgroundColor: theme.warningSurface }]}>
              <ThemedText style={styles.title}>Protección de reservas</ThemedText>
              <ThemedText themeColor="textSecondary">
                {resource.isOwnProfile
                  ? 'No puedes bloquear un horario que ya tenga una cita confirmada o en curso.'
                  : 'La base rechazará cualquier bloqueo que cruce una reserva confirmada o en curso.'}
              </ThemedText>
            </SurfaceCard>
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
        ListEmptyComponent={
          <SurfaceCard style={styles.empty}>
            <ThemedText style={styles.title}>No hay bloqueos actuales o futuros</ThemedText>
            <ThemedText themeColor="textSecondary">
              {resource.isOwnProfile
                ? 'Cuando necesites ausentarte, crea un bloqueo para proteger ese horario.'
                : 'La agenda individual no tiene excepciones registradas.'}
            </ThemedText>
          </SurfaceCard>
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
            <View style={styles.blockHeader}>
              <View style={[styles.blockIcon, { backgroundColor: theme.surfaceMuted }]}>
                <AppIcon
                  color={theme.primary}
                  name={{ ios: 'calendar.badge.minus', android: 'event_busy', web: 'event_busy' }}
                  size={20}
                />
              </View>
              <View style={styles.blockCopy}>
                <ThemedText selectable style={styles.blockDate}>
                  {formatDate(item.startsAt)}
                </ThemedText>
                <ThemedText selectable style={styles.blockTime} themeColor="textSecondary">
                  {formatBlockRange(item)}
                </ThemedText>
              </View>
            </View>
            <ThemedText selectable style={styles.reason} themeColor="textSecondary">
              {item.reason ?? 'Sin motivo especificado'}
            </ThemedText>
            <View style={styles.blockActions}>
              <BlockDeleteAction block={item} onPress={() => setPending(item)} />
            </View>
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
  intro: { maxWidth: 620, fontSize: TypeScale.label, lineHeight: 21 },
  separator: { height: Spacing.three },
  warning: { gap: Spacing.three, padding: Spacing.four },
  card: { gap: Spacing.three, padding: Spacing.four },
  empty: { gap: Spacing.three, padding: Spacing.four },
  title: { fontSize: TypeScale.title, fontWeight: '700' },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  blockIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  blockCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  blockDate: { fontSize: TypeScale.body, fontWeight: '800', lineHeight: 23 },
  blockTime: { fontSize: TypeScale.label, fontVariant: ['tabular-nums'], lineHeight: 21 },
  reason: { fontSize: TypeScale.label, lineHeight: 21 },
  blockActions: { alignItems: 'flex-start' },
  deleteAction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
  },
  deleteActionLabel: { fontSize: TypeScale.label, fontWeight: '700' },
});
