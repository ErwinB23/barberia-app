import { useState } from 'react';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';

import { updateBarbershopSettings } from '../actions';
import { getBarbershopErrorMessage } from '../errors';
import { useBarbershopDetail } from '../hooks/use-barbershop-detail';
import type { ParsedBarbershopSettings } from '../validation';
import { BarbershopSettingsForm } from './barbershop-settings-form';
import { ManagementFormPage } from './management-form-page';

export function BarbershopSettingsScreen({ barbershopId }: { barbershopId: string | null }) {
  const { user } = useAuth();
  const { detail, isLoading, error, reload } = useBarbershopDetail(user!.id, barbershopId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | null>(null);

  const submit = async (values: ParsedBarbershopSettings) => {
    if (!barbershopId) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await updateBarbershopSettings(barbershopId, values);
      setFeedback({ message: 'Los ajustes generales se guardaron correctamente.', success: true });
      await reload();
    } catch (submitError) {
      setFeedback({ message: getBarbershopErrorMessage(submitError), success: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ManagementFormPage
      description="Define las reglas operativas. Estos valores son propios de esta barbería."
      title="Ajustes generales"
    >
      {isLoading ? <ThemedText themeColor="textSecondary">Cargando ajustes…</ThemedText> : null}
      {error ? (
        <>
          <StatusMessage message={error} />
          <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
        </>
      ) : null}
      {detail && detail.role !== 'administrator' ? (
        <StatusMessage message="Solo un administrador puede modificar estos ajustes." />
      ) : null}
      {feedback ? (
        <StatusMessage message={feedback.message} tone={feedback.success ? 'success' : 'error'} />
      ) : null}
      {detail?.role === 'administrator' && detail.settings ? (
        <BarbershopSettingsForm
          isSubmitting={isSubmitting}
          key={detail.settings.updated_at}
          onSubmit={(values) => void submit(values)}
          settings={detail.settings}
        />
      ) : null}
    </ManagementFormPage>
  );
}
