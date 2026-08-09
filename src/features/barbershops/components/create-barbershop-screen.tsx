import { useState } from 'react';
import { router } from 'expo-router';

import { StatusMessage } from '@/shared/components/ui/status-message';

import { createBarbershop } from '../actions';
import { getBarbershopErrorMessage } from '../errors';
import type { NormalizedBarbershopForm } from '../validation';
import { BarbershopForm } from './barbershop-form';
import { ManagementFormPage } from './management-form-page';

export function CreateBarbershopScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (values: NormalizedBarbershopForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const barbershopId = await createBarbershop(values);
      router.replace({
        pathname: '/barbershops/[barbershopId]',
        params: { barbershopId },
      });
    } catch (submitError) {
      setError(getBarbershopErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ManagementFormPage
      description="Configura los datos esenciales. La nueva barbería comenzará como no publicada."
      title="Nueva barbería"
    >
      {error ? <StatusMessage message={error} /> : null}
      <BarbershopForm
        isSubmitting={isSubmitting}
        onSubmit={(values) => void submit(values)}
        submitLabel="Crear barbería"
      />
    </ManagementFormPage>
  );
}
