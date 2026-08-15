import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, TypeScale } from '@/theme/tokens';

import { acceptBarbershopInvitation, rejectBarbershopInvitation } from '../actions';
import { getInvitationErrorMessage } from '../errors';
import { useRecipientInvitations } from '../hooks/use-recipient-invitations';
import { getInvitationAcceptanceFeedback } from '../invitation-domain';
import type { RecipientInvitation } from '../types';
import { InvitationCard } from './invitation-card';

export function RecipientInvitationsScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { invitations, isLoading, isRefreshing, error, reload } = useRecipientInvitations(
    user?.id ?? null,
  );
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const respond = async (invitation: RecipientInvitation, response: 'accept' | 'reject') => {
    setSubmittingId(invitation.id);
    setMutationError(null);
    setFeedback(null);
    try {
      if (response === 'accept') {
        await acceptBarbershopInvitation(invitation.id);
        setFeedback(getInvitationAcceptanceFeedback(invitation.role));
      } else {
        await rejectBarbershopInvitation(invitation.id);
        setFeedback('La invitación fue procesada. Su estado actualizado aparece en la lista.');
      }
      await reload();
    } catch (mutation) {
      setMutationError(getInvitationErrorMessage(mutation, response));
    } finally {
      setSubmittingId(null);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Cargando tus invitaciones…</ThemedText>
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
            <ThemedText style={styles.title}>No tienes invitaciones</ThemedText>
            <ThemedText themeColor="textSecondary">
              Las invitaciones dirigidas al correo de tu cuenta aparecerán aquí.
            </ThemedText>
          </SurfaceCard>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              description="Revisa y responde invitaciones para colaborar con una barbería."
              eyebrow="Cuenta"
              title="Mis invitaciones"
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
            audience="recipient"
            invitation={item}
            isSubmitting={submittingId === item.id}
            onAccept={() => void respond(item, 'accept')}
            onReject={() => void respond(item, 'reject')}
          />
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', padding: Spacing.four },
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
