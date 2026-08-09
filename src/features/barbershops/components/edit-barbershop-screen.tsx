import { useState } from 'react';
import { router } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';

import { updateBarbershop } from '../actions';
import { getBarbershopErrorMessage } from '../errors';
import { useBarbershopDetail } from '../hooks/use-barbershop-detail';
import type { BarbershopFormValues, NormalizedBarbershopForm } from '../validation';
import { BarbershopForm } from './barbershop-form';
import { ManagementFormPage } from './management-form-page';

export function EditBarbershopScreen({ barbershopId }: { barbershopId: string | null }) {
  const { user } = useAuth();
  const { detail, isLoading, error, reload } = useBarbershopDetail(user!.id, barbershopId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const submit = async (values: NormalizedBarbershopForm) => {
    if (!barbershopId) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await updateBarbershop(barbershopId, values);
      router.back();
    } catch (submitError) {
      setFeedback(getBarbershopErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const initialValues: BarbershopFormValues | null = detail
    ? {
        name: detail.barbershop.name,
        description: detail.barbershop.description ?? '',
        phone: detail.barbershop.phone ?? '',
        address: detail.barbershop.address ?? '',
        locationReference: detail.barbershop.locationReference ?? '',
        logoUrl: detail.barbershop.logoUrl ?? '',
      }
    : null;

  return (
    <ManagementFormPage
      description="Actualiza únicamente la información general visible de la barbería."
      title="Datos generales"
    >
      {isLoading ? <ThemedText themeColor="textSecondary">Cargando datos…</ThemedText> : null}
      {error ? (
        <>
          <StatusMessage message={error} />
          <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
        </>
      ) : null}
      {detail && detail.role !== 'administrator' ? (
        <StatusMessage message="Solo un administrador puede editar estos datos." />
      ) : null}
      {feedback ? <StatusMessage message={feedback} /> : null}
      {detail?.role === 'administrator' && initialValues ? (
        <BarbershopForm
          initialValues={initialValues}
          isSubmitting={isSubmitting}
          key={detail.barbershop.updatedAt}
          onSubmit={(values) => void submit(values)}
          submitLabel="Guardar cambios"
        />
      ) : null}
    </ManagementFormPage>
  );
}
