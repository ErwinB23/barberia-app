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

import { deleteBarbershopClosure } from '../actions';
import { getScheduleErrorMessage } from '../errors';
import { useAdminScheduleResource } from '../hooks/use-admin-schedule-resource';
import { getUpcomingBarbershopClosures } from '../queries';
import type { BarbershopClosure } from '../types';
import { ClosureCard } from './closure-card';
import { ScheduleDeleteConfirmation } from './schedule-delete-confirmation';

type ClosuresScreenProps = {
  barbershopId: string | null;
  saved: string | null;
};

export function ClosuresScreen({ barbershopId, saved }: ClosuresScreenProps) {
  const theme = useTheme();
  const [pendingDeletion, setPendingDeletion] = useState<BarbershopClosure | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(
    saved === 'closure-created' ? 'El cierre excepcional se creó correctamente.' : null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadClosures = useCallback(
    () => (barbershopId ? getUpcomingBarbershopClosures(barbershopId) : Promise.resolve([])),
    [barbershopId],
  );
  const { data, role, isLoading, error, reload } = useAdminScheduleResource(
    barbershopId,
    loadClosures,
    'closures',
  );

  const refresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  const removeClosure = async () => {
    if (!barbershopId || !pendingDeletion || role !== 'administrator') {
      return;
    }

    setDeletingId(pendingDeletion.id);
    setMutationError(null);
    setFeedback(null);

    try {
      await deleteBarbershopClosure(barbershopId, pendingDeletion.id);
      setFeedback('El cierre excepcional se eliminó correctamente.');
      setPendingDeletion(null);
      await reload();
    } catch (mutation) {
      setMutationError(getScheduleErrorMessage(mutation, 'closures'));
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <ListScreenSkeleton />;
  }

  if (role !== 'administrator') {
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage
          message={
            error ?? 'Solo un administrador activo de esta barbería puede gestionar sus cierres.'
          }
        />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
      </ThemedView>
    );
  }

  const closures = data ?? [];

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={closures}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(closure) => closure.id}
        ListEmptyComponent={
          <SurfaceCard style={styles.emptyCard}>
            <ThemedText style={styles.emptyTitle}>No hay cierres actuales o futuros</ThemedText>
            <ThemedText style={styles.emptyDescription} themeColor="textSecondary">
              Registra un cierre cuando la barbería no atenderá dentro de su horario habitual.
            </ThemedText>
            <ActionButton
              label="Crear cierre excepcional"
              onPress={() => router.push(`/barbershops/${barbershopId}/schedules/closures/new`)}
            />
          </SurfaceCard>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              compact
              description="Gestiona períodos puntuales en los que toda la barbería permanecerá cerrada."
              eyebrow="Excepciones"
              title="Cierres excepcionales"
            />
            <ActionButton
              label="Nuevo cierre"
              onPress={() => router.push(`/barbershops/${barbershopId}/schedules/closures/new`)}
            />
            <SurfaceCard style={[styles.warningCard, { backgroundColor: theme.warningSurface }]}>
              <ThemedText style={[styles.warningTitle, { color: theme.warning }]}>
                Antes de crear
              </ThemedText>
              <ThemedText style={styles.warningText}>
                Un cierre no cancela reservas automáticamente. La base rechazará el alta si el
                período se superpone con una reserva confirmada o en curso.
              </ThemedText>
            </SurfaceCard>

            {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
            {error || mutationError ? <StatusMessage message={mutationError ?? error!} /> : null}
            {pendingDeletion ? (
              <ScheduleDeleteConfirmation
                description="El período volverá a estar disponible para el cálculo de futuras reservas."
                isSubmitting={deletingId === pendingDeletion.id}
                onCancel={() => setPendingDeletion(null)}
                onConfirm={() => void removeClosure()}
                title="¿Eliminar cierre excepcional?"
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
          <ClosureCard
            closure={item}
            isDeleting={deletingId === item.id}
            onDelete={() => setPendingDeletion(item)}
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
  warningCard: {
    gap: Spacing.one,
    padding: Spacing.three,
  },
  warningTitle: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  warningText: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
  emptyCard: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  emptyTitle: {
    fontSize: TypeScale.title,
    fontWeight: '700',
  },
  emptyDescription: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
});
