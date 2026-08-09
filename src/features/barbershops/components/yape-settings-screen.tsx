import { useState } from 'react';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';

import { updateYapeSettings } from '../actions';
import { getBarbershopErrorMessage } from '../errors';
import { useYapeSettings } from '../hooks/use-yape-settings';
import type { YapeSettingsFormValues } from '../validation';
import { ManagementFormPage } from './management-form-page';
import { YapeSettingsForm } from './yape-settings-form';

export function YapeSettingsScreen({ barbershopId }: { barbershopId: string | null }) {
  const { user } = useAuth();
  const { settings, role, isLoading, error, reload } = useYapeSettings(user!.id, barbershopId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | null>(null);

  const submit = async (values: YapeSettingsFormValues) => {
    if (!barbershopId) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await updateYapeSettings(barbershopId, values);
      setFeedback({ message: 'La configuración de Yape se guardó correctamente.', success: true });
      await reload();
    } catch (submitError) {
      setFeedback({ message: getBarbershopErrorMessage(submitError), success: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ManagementFormPage
      description="Configura los datos que se utilizarán para pagos por Yape."
      title="Configuración Yape"
    >
      {isLoading ? (
        <ThemedText themeColor="textSecondary">Cargando configuración…</ThemedText>
      ) : null}
      {error ? (
        <>
          <StatusMessage message={error} />
          <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
        </>
      ) : null}
      {!isLoading && !error && role !== 'administrator' ? (
        <StatusMessage message="Solo un administrador puede acceder a la configuración de Yape." />
      ) : null}
      {feedback ? (
        <StatusMessage message={feedback.message} tone={feedback.success ? 'success' : 'error'} />
      ) : null}
      {role === 'administrator' && settings ? (
        <YapeSettingsForm
          isSubmitting={isSubmitting}
          key={settings.updated_at}
          onSubmit={(values) => void submit(values)}
          settings={settings}
        />
      ) : null}
    </ManagementFormPage>
  );
}
