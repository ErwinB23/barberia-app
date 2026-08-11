import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

import { createBarbershopClosure } from '../actions';
import { getScheduleErrorMessage } from '../errors';
import { useAdminScheduleResource } from '../hooks/use-admin-schedule-resource';
import type { ParsedClosureForm } from '../schedule-domain';
import { ClosureForm } from './closure-form';
import { ScheduleFormPage } from './schedule-form-page';

export function ClosureEditorScreen({ barbershopId }: { barbershopId: string | null }) {
  const { user } = useAuth();
  const theme = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const loadAccess = useCallback(() => Promise.resolve(true), []);
  const { role, isLoading, error, reload } = useAdminScheduleResource(
    barbershopId,
    loadAccess,
    'closures',
  );

  const submit = async (values: ParsedClosureForm) => {
    if (!barbershopId || !user || role !== 'administrator') {
      return;
    }

    setIsSubmitting(true);
    setMutationError(null);

    try {
      await createBarbershopClosure(barbershopId, user.id, values);
      router.replace(`/barbershops/${barbershopId}/schedules/closures?saved=closure-created`);
    } catch (mutation) {
      setMutationError(getScheduleErrorMessage(mutation, 'closures'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Preparando formulario…</ThemedText>
      </ThemedView>
    );
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

  return (
    <ScheduleFormPage
      description="Registra un período en horario de Lima durante el que no habrá atención."
      title="Nuevo cierre excepcional"
    >
      <SurfaceCard style={[styles.warningCard, { backgroundColor: theme.warningSurface }]}>
        <ThemedText style={[styles.warningTitle, { color: theme.warning }]}>Importante</ThemedText>
        <ThemedText style={styles.warningText}>
          Esto no cancela reservas. Si el período afecta una reserva confirmada o en curso, la base
          rechazará el cierre.
        </ThemedText>
      </SurfaceCard>
      {mutationError ? <StatusMessage message={mutationError} /> : null}
      <ClosureForm isSubmitting={isSubmitting} onSubmit={(values) => void submit(values)} />
    </ScheduleFormPage>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
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
});
