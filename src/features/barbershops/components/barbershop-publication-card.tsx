import { useState } from 'react';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { pauseBarbershop, publishBarbershop, unpublishBarbershop } from '../actions';
import { getPublicationErrorMessage } from '../errors';
import {
  canPublishBarbershop,
  getPublicationRequirementRoute,
  getPublicationStatusCopy,
  type PublicationRequirement,
} from '../publication';
import type { BarbershopStatus } from '../types';

type PublicationAction = 'publish' | 'pause' | 'unpublish';

type Feedback = {
  message: string;
  tone: 'error' | 'success';
};

const SUCCESS_MESSAGES: Record<PublicationAction, string> = {
  publish: 'La barbería está publicada y ya puede aparecer en Explorar.',
  pause: 'Las nuevas reservas están pausadas. Las reservas existentes se conservan.',
  unpublish: 'La barbería ya no aparece en Explorar. Las reservas existentes se conservan.',
};

const CONFIRMATION_COPY: Record<
  Exclude<PublicationAction, 'publish'>,
  { title: string; description: string; label: string }
> = {
  pause: {
    title: '¿Pausar temporalmente la barbería?',
    description: 'No se aceptarán nuevas reservas mientras permanezca pausada.',
    label: 'Sí, pausar reservas',
  },
  unpublish: {
    title: '¿Retirar la publicación?',
    description:
      'La barbería dejará de ser visible para clientes nuevos. Las reservas existentes se conservan.',
    label: 'Sí, despublicar',
  },
};

function PreparationItem({
  barbershopId,
  requirement,
}: {
  barbershopId: string;
  requirement: PublicationRequirement;
}) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const color = requirement.isComplete ? theme.success : theme.warning;
  const content = (
    <>
      <View
        style={[
          styles.requirementMark,
          { backgroundColor: requirement.isComplete ? theme.successSurface : theme.warningSurface },
        ]}
      >
        <AppIcon
          color={color}
          name={
            requirement.isComplete
              ? { ios: 'checkmark', android: 'check', web: 'check' }
              : { ios: 'exclamationmark', android: 'priority_high', web: 'priority_high' }
          }
          size={16}
        />
      </View>
      <ThemedText style={styles.preparationText}>{requirement.label}</ThemedText>
      <ThemedText style={[styles.requirementStatus, { color }]}>
        {requirement.isComplete ? 'Listo' : 'Completar'}
      </ThemedText>
      {!requirement.isComplete ? (
        <AppIcon
          color={theme.textSecondary}
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={18}
        />
      ) : null}
    </>
  );

  if (requirement.isComplete) {
    return (
      <View accessibilityLabel={`${requirement.label}: listo`} style={styles.preparationItem}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint="Abre la sección donde puedes completar este requisito"
      accessibilityLabel={`${requirement.label}: pendiente`}
      accessibilityRole="button"
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={() =>
        router.push(getPublicationRequirementRoute(requirement.key, barbershopId) as Href)
      }
      style={({ pressed }) => [
        styles.preparationItem,
        isFocused ? { boxShadow: `0 0 0 2px ${theme.focus}` } : null,
        pressed ? { opacity: 0.72 } : null,
      ]}
    >
      {content}
    </Pressable>
  );
}

export function BarbershopPublicationCard({
  barbershopId,
  status,
  readiness,
  onRefresh,
}: {
  barbershopId: string;
  status: BarbershopStatus;
  readiness: PublicationRequirement[];
  onRefresh: () => Promise<void>;
}) {
  const theme = useTheme();
  const [pendingAction, setPendingAction] = useState<PublicationAction | null>(null);
  const [confirmation, setConfirmation] = useState<'pause' | 'unpublish' | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const statusCopy = getPublicationStatusCopy(status);
  const canPublish = canPublishBarbershop(readiness);

  const runAction = async (action: PublicationAction) => {
    setPendingAction(action);
    setFeedback(null);

    try {
      if (action === 'publish') await publishBarbershop(barbershopId);
      if (action === 'pause') await pauseBarbershop(barbershopId);
      if (action === 'unpublish') await unpublishBarbershop(barbershopId);

      await onRefresh();
      setConfirmation(null);
      setFeedback({ message: SUCCESS_MESSAGES[action], tone: 'success' });
    } catch (actionError) {
      setFeedback({ message: getPublicationErrorMessage(actionError), tone: 'error' });
      await onRefresh();
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <View style={styles.container}>
      <SurfaceCard style={styles.statusCard}>
        <View style={[styles.statusIcon, { backgroundColor: theme.surfaceMuted }]}>
          <AppIcon
            color={
              status === 'published'
                ? theme.success
                : status === 'paused'
                  ? theme.warning
                  : theme.textSecondary
            }
            name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
            size={24}
          />
        </View>
        <View style={styles.statusCopy}>
          <ThemedText style={styles.statusLabel}>{statusCopy.label}</ThemedText>
          <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
            {statusCopy.description}
          </ThemedText>
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <View style={styles.sectionCopy}>
          <ThemedText style={styles.sectionTitle}>Preparación para publicar</ThemedText>
          <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
            Completa los requisitos pendientes. El backend realiza la validación final.
          </ThemedText>
        </View>

        <View style={styles.requirements}>
          {readiness.map((requirement) => (
            <PreparationItem
              barbershopId={barbershopId}
              key={requirement.key}
              requirement={requirement}
            />
          ))}
        </View>
      </SurfaceCard>

      {feedback ? <StatusMessage message={feedback.message} tone={feedback.tone} /> : null}

      {confirmation ? (
        <SurfaceCard style={styles.confirmationCard}>
          <ThemedText style={styles.sectionTitle}>
            {CONFIRMATION_COPY[confirmation].title}
          </ThemedText>
          <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
            {CONFIRMATION_COPY[confirmation].description}
          </ThemedText>
          <ActionButton
            isLoading={pendingAction === confirmation}
            label={CONFIRMATION_COPY[confirmation].label}
            onPress={() => void runAction(confirmation)}
            variant={confirmation === 'unpublish' ? 'danger' : 'secondary'}
          />
          <ActionButton
            disabled={pendingAction !== null}
            label="Volver"
            onPress={() => setConfirmation(null)}
            variant="secondary"
          />
        </SurfaceCard>
      ) : (
        <View style={styles.actions}>
          {status === 'unpublished' ? (
            <>
              <ActionButton
                isLoading={pendingAction === 'publish'}
                disabled={pendingAction !== null || !canPublish}
                label="Publicar barbería"
                onPress={() => void runAction('publish')}
              />
              {!canPublish ? (
                <ThemedText style={styles.disabledGuidance} themeColor="textSecondary">
                  Completa los requisitos pendientes para publicar.
                </ThemedText>
              ) : null}
            </>
          ) : null}

          {status === 'published' ? (
            <ActionButton
              disabled={pendingAction !== null}
              label="Pausar reservas"
              onPress={() => setConfirmation('pause')}
              variant="secondary"
            />
          ) : null}

          {status === 'paused' ? (
            <ActionButton
              isLoading={pendingAction === 'publish'}
              disabled={pendingAction !== null}
              label="Reanudar reservas"
              onPress={() => void runAction('publish')}
            />
          ) : null}

          {status !== 'unpublished' ? (
            <ActionButton
              disabled={pendingAction !== null}
              label="Despublicar"
              onPress={() => setConfirmation('unpublish')}
              size="compact"
              variant="danger"
            />
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  statusIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  statusCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  statusLabel: { fontSize: TypeScale.title, fontWeight: '800' },
  card: { gap: Spacing.four, padding: Spacing.four },
  sectionCopy: { gap: Spacing.one },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '700' },
  sectionDescription: { fontSize: TypeScale.label, lineHeight: 21 },
  requirements: { gap: Spacing.two },
  preparationItem: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  requirementMark: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  preparationText: { minWidth: 0, flex: 1, fontSize: TypeScale.label, lineHeight: 21 },
  requirementStatus: { fontSize: TypeScale.caption, fontWeight: '700' },
  confirmationCard: { gap: Spacing.three, padding: Spacing.four },
  actions: { alignItems: 'stretch', gap: Spacing.two },
  disabledGuidance: { fontSize: TypeScale.caption, lineHeight: 18 },
});
