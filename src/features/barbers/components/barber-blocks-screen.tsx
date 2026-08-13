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

import { deleteBarberBlock } from '../actions';
import { getBarberErrorMessage } from '../errors';
import { useBarberProfileResource } from '../hooks/use-barber-profile-resource';
import { getUpcomingBarberBlocks } from '../queries';
import type { BarberBlock } from '../types';

const FORMATTER = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
  hour12: false,
  timeZone: 'America/Lima',
});
function format(value: string) {
  return FORMATTER.format(new Date(value));
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
  const load = useCallback(
    () =>
      barbershopId && barberId
        ? getUpcomingBarberBlocks(barbershopId, barberId)
        : Promise.resolve([]),
    [barberId, barbershopId],
  );
  const resource = useBarberProfileResource(barbershopId, barberId, load, 'blocks');
  const refresh = async () => {
    setIsRefreshing(true);
    await resource.reload();
    setIsRefreshing(false);
  };
  const remove = async () => {
    if (!pending || !barbershopId || !barberId || !resource.access.canManageBlocks) return;
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
      setDeletingId(null);
    }
  };
  if (resource.isLoading)
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Cargando bloqueos…</ThemedText>
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
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={resource.data ?? []}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              description="Registra períodos excepcionales en los que el barbero no atenderá."
              eyebrow="Agenda"
              title={resource.isOwnProfile ? 'Mis bloqueos futuros' : 'Bloqueos futuros'}
            />
            <ActionButton
              label="Nuevo bloqueo"
              onPress={() =>
                router.push(`/barbershops/${barbershopId}/barbers/${barberId}/blocks/new`)
              }
            />
            <ActionButton
              disabled={isRefreshing}
              label="Actualizar bloqueos"
              onPress={() => void refresh()}
              variant="secondary"
            />
            <SurfaceCard style={[styles.warning, { backgroundColor: theme.warningSurface }]}>
              <ThemedText style={styles.title}>Protección de reservas</ThemedText>
              <ThemedText themeColor="textSecondary">
                La base rechazará cualquier bloqueo que cruce una reserva confirmada o en curso.
              </ThemedText>
            </SurfaceCard>
            {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
            {resource.error || mutationError ? (
              <StatusMessage message={mutationError ?? resource.error!} />
            ) : null}
            {pending ? (
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
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <SurfaceCard style={styles.empty}>
            <ThemedText style={styles.title}>No hay bloqueos actuales o futuros</ThemedText>
            <ThemedText themeColor="textSecondary">
              La agenda individual no tiene excepciones registradas.
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
            <ThemedText style={styles.title}>{item.reason ?? 'Bloqueo excepcional'}</ThemedText>
            <ThemedText selectable>Desde: {format(item.startsAt)}</ThemedText>
            <ThemedText selectable>Hasta: {format(item.endsAt)}</ThemedText>
            <ActionButton
              label="Eliminar bloqueo"
              onPress={() => setPending(item)}
              variant="danger"
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
  warning: { gap: Spacing.three, padding: Spacing.four },
  card: { gap: Spacing.three, padding: Spacing.four },
  empty: { gap: Spacing.three, padding: Spacing.four },
  title: { fontSize: TypeScale.title, fontWeight: '700' },
});
