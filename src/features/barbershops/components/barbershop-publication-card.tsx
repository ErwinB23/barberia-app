import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { pauseBarbershop, publishBarbershop, unpublishBarbershop } from '../actions';
import { getPublicationErrorMessage } from '../errors';
import type { PublicationRequirement } from '../publication';
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

function PreparationItem({ requirement }: { requirement: PublicationRequirement }) {
  const theme = useTheme();
  const color = requirement.isComplete ? theme.success : theme.warning;
  const backgroundColor = requirement.isComplete ? theme.successSurface : theme.warningSurface;

  return (
    <View style={styles.preparationItem}>
      <View style={[styles.requirementMark, { backgroundColor, borderColor: color }]}>
        <ThemedText style={[styles.requirementSymbol, { color }]}>
          {requirement.isComplete ? '✓' : '!'}
        </ThemedText>
      </View>
      <ThemedText style={styles.preparationText}>{requirement.label}</ThemedText>
      <ThemedText style={[styles.requirementStatus, { color }]}>
        {requirement.isComplete ? 'Listo' : 'Pendiente'}
      </ThemedText>
    </View>
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
  const [pendingAction, setPendingAction] = useState<PublicationAction | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const runAction = async (action: PublicationAction) => {
    setPendingAction(action);
    setFeedback(null);

    try {
      if (action === 'publish') await publishBarbershop(barbershopId);
      if (action === 'pause') await pauseBarbershop(barbershopId);
      if (action === 'unpublish') await unpublishBarbershop(barbershopId);

      await onRefresh();
      setFeedback({ message: SUCCESS_MESSAGES[action], tone: 'success' });
    } catch (actionError) {
      setFeedback({ message: getPublicationErrorMessage(actionError), tone: 'error' });
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.sectionCopy}>
        <ThemedText style={styles.sectionTitle}>Preparación para publicar</ThemedText>
        <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
          Este checklist es informativo. La validación final se realiza al publicar.
        </ThemedText>
      </View>

      <View style={styles.requirements}>
        {readiness.map((requirement) => (
          <PreparationItem key={requirement.key} requirement={requirement} />
        ))}
      </View>

      {feedback ? <StatusMessage message={feedback.message} tone={feedback.tone} /> : null}

      <View style={styles.actions}>
        {status === 'unpublished' ? (
          <ActionButton
            isLoading={pendingAction === 'publish'}
            disabled={pendingAction !== null}
            label="Publicar barbería"
            onPress={() => void runAction('publish')}
          />
        ) : null}

        {status === 'published' ? (
          <ActionButton
            isLoading={pendingAction === 'pause'}
            disabled={pendingAction !== null}
            label="Pausar reservas"
            onPress={() => void runAction('pause')}
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
            isLoading={pendingAction === 'unpublish'}
            disabled={pendingAction !== null}
            label="Despublicar"
            onPress={() => void runAction('unpublish')}
            variant="danger"
          />
        ) : null}
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.four, padding: Spacing.four },
  sectionCopy: { gap: Spacing.one },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '700' },
  sectionDescription: { fontSize: TypeScale.label, lineHeight: 21 },
  requirements: { gap: Spacing.three },
  preparationItem: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  requirementMark: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  requirementSymbol: { fontSize: TypeScale.caption, fontWeight: '800' },
  preparationText: { flex: 1, fontSize: TypeScale.label, lineHeight: 21 },
  requirementStatus: { fontSize: TypeScale.caption, fontWeight: '700' },
  actions: { gap: Spacing.two },
});
