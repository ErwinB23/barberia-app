import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

import { formatInvitationDate } from '../formatters';
import {
  getInvitationActions,
  getInvitationChannelLabel,
  getInvitationRoleLabel,
  type InvitationAudience,
} from '../invitation-domain';
import type { AdminInvitation, RecipientInvitation } from '../types';
import { InvitationStatusBadge } from './invitation-status-badge';

type InvitationCardProps = {
  invitation: AdminInvitation | RecipientInvitation;
  audience: InvitationAudience;
  isSubmitting: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
};

export function InvitationCard({
  invitation,
  audience,
  isSubmitting,
  onAccept,
  onReject,
  onCancel,
}: InvitationCardProps) {
  const theme = useTheme();
  const [confirmation, setConfirmation] = useState<'reject' | 'cancel' | null>(null);
  const actions = getInvitationActions(invitation.status, invitation.expiresAt, audience);
  const title =
    'recipientEmail' in invitation
      ? invitation.recipientEmail
      : (invitation.barbershopName ?? 'Barbería que te invitó');

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <ThemedText selectable style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            {getInvitationRoleLabel(invitation.role)} ·{' '}
            {getInvitationChannelLabel(invitation.channel)}
          </ThemedText>
        </View>
        <InvitationStatusBadge expiresAt={invitation.expiresAt} status={invitation.status} />
      </View>
      <View style={[styles.details, { borderTopColor: theme.border }]}>
        <ThemedText selectable style={styles.detail} themeColor="textSecondary">
          Creada: {formatInvitationDate(invitation.createdAt)}
        </ThemedText>
        <ThemedText selectable style={styles.detail} themeColor="textSecondary">
          Expira: {formatInvitationDate(invitation.expiresAt)}
        </ThemedText>
      </View>
      {confirmation ? (
        <View style={styles.confirmation}>
          <StatusMessage
            message={
              confirmation === 'reject'
                ? 'Confirma que deseas rechazar esta invitación.'
                : 'Confirma que deseas cancelar esta invitación pendiente.'
            }
          />
          <View style={styles.actions}>
            <ActionButton
              disabled={isSubmitting}
              label="Volver"
              onPress={() => setConfirmation(null)}
              variant="secondary"
            />
            <ActionButton
              isLoading={isSubmitting}
              label={confirmation === 'reject' ? 'Rechazar' : 'Cancelar invitación'}
              onPress={() => (confirmation === 'reject' ? onReject?.() : onCancel?.())}
              variant="danger"
            />
          </View>
        </View>
      ) : actions.canAccept || actions.canReject || actions.canCancel ? (
        <View style={styles.actions}>
          {actions.canAccept ? (
            <ActionButton isLoading={isSubmitting} label="Aceptar" onPress={() => onAccept?.()} />
          ) : null}
          {actions.canReject ? (
            <ActionButton
              disabled={isSubmitting}
              label="Rechazar"
              onPress={() => setConfirmation('reject')}
              variant="danger"
            />
          ) : null}
          {actions.canCancel ? (
            <ActionButton
              disabled={isSubmitting}
              label="Cancelar invitación"
              onPress={() => setConfirmation('cancel')}
              variant="danger"
            />
          ) : null}
        </View>
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.four },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  headingCopy: { flex: 1, gap: Spacing.one },
  title: { fontSize: TypeScale.body, fontWeight: '700' },
  details: { gap: Spacing.one, borderTopWidth: 1, paddingTop: Spacing.three },
  detail: { fontSize: TypeScale.caption, lineHeight: 18 },
  confirmation: { gap: Spacing.three },
  actions: { gap: Spacing.two },
});
