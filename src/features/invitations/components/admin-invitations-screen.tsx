import { useState } from 'react';
import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, TypeScale } from '@/theme/tokens';

import { cancelBarbershopInvitation } from '../actions';
import { getInvitationErrorMessage } from '../errors';
import { useAdminInvitations } from '../hooks/use-admin-invitations';
import { InvitationCard } from './invitation-card';

export function AdminInvitationsScreen({ barbershopId }: { barbershopId: string | null }) {
  const theme = useTheme();
  const { invitations, role, isLoading, isRefreshing, error, reload } =
    useAdminInvitations(barbershopId);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const cancel = async (invitationId: string) => {
    setSubmittingId(invitationId);
    setMutationError(null);
    setFeedback(null);
    try {
      await cancelBarbershopInvitation(invitationId);
      setFeedback('La invitación fue cancelada.');
      await reload();
    } catch (mutation) {
      setMutationError(getInvitationErrorMessage(mutation, 'cancel'));
    } finally {
      setSubmittingId(null);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Cargando invitaciones…</ThemedText>
      </ThemedView>
    );
  }

  if (role !== 'administrator' || !barbershopId) {
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage
          message={error ?? 'Solo un administrador activo puede gestionar invitaciones.'}
        />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={invitations}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(invitation) => invitation.id}
        ListEmptyComponent={
          <SurfaceCard style={styles.empty}>
            <ThemedText style={styles.title}>Aún no hay invitaciones</ThemedText>
            <ThemedText themeColor="textSecondary">
              Invita personal por correo sin consultar ni revelar si la cuenta ya existe.
            </ThemedText>
          </SurfaceCard>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              description="Incorpora barberos o administradores mediante el flujo seguro de invitación."
              eyebrow="Personal"
              title="Invitaciones"
            />
            <ActionButton
              label="Nueva invitación"
              onPress={() => router.push(`/barbershops/${barbershopId}/invitations/new`)}
            />
            <ActionButton
              disabled={isRefreshing}
              label="Actualizar invitaciones"
              onPress={() => void reload()}
              variant="secondary"
            />
            {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
            {error || mutationError ? <StatusMessage message={mutationError ?? error!} /> : null}
          </View>
        }
        refreshControl={
          <RefreshControl
            colors={[theme.primary]}
            onRefresh={() => void reload()}
            refreshing={isRefreshing}
            tintColor={theme.primary}
          />
        }
        renderItem={({ item }) => (
          <InvitationCard
            audience="administrator"
            invitation={item}
            isSubmitting={submittingId === item.id}
            onCancel={() => void cancel(item.id)}
          />
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
  header: { gap: Spacing.three, paddingBottom: Spacing.four },
  separator: { height: Spacing.three },
  empty: { gap: Spacing.two, padding: Spacing.four },
  title: { fontSize: TypeScale.title, fontWeight: '700' },
});
