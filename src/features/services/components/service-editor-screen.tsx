import { useCallback, useState } from 'react';
import { router } from 'expo-router';

import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';

import { createService, updateService } from '../actions';
import { getCatalogErrorMessage } from '../errors';
import { useAdminCatalogResource } from '../hooks/use-admin-catalog-resource';
import { getService } from '../queries';
import type { ParsedServiceForm } from '../validation';
import { CatalogFormPage } from './catalog-form-page';
import { ServiceForm } from './service-form';

type ServiceEditorScreenProps =
  | { mode: 'create'; barbershopId: string | null; serviceId?: never }
  | { mode: 'edit'; barbershopId: string | null; serviceId: string | null };

export function ServiceEditorScreen(props: ServiceEditorScreenProps) {
  const { barbershopId, mode } = props;
  const serviceId = mode === 'edit' ? props.serviceId : null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const loadService = useCallback(
    () =>
      mode === 'edit' && barbershopId && serviceId
        ? getService(barbershopId, serviceId)
        : Promise.resolve(null),
    [barbershopId, mode, serviceId],
  );
  const {
    data: service,
    role,
    isLoading,
    error,
    reload,
  } = useAdminCatalogResource(barbershopId, loadService);

  const submit = async (values: ParsedServiceForm) => {
    if (!barbershopId || role !== 'administrator') {
      return;
    }

    setIsSubmitting(true);
    setMutationError(null);

    try {
      let savedServiceId: string;
      if (mode === 'create') {
        savedServiceId = await createService(barbershopId, values);
      } else {
        if (!serviceId) {
          return;
        }
        await updateService(barbershopId, serviceId, values);
        savedServiceId = serviceId;
      }
      const saved = mode === 'create' ? 'created' : 'updated';
      router.replace(`/barbershops/${barbershopId}/services/${savedServiceId}?saved=${saved}`);
    } catch (mutation) {
      setMutationError(getCatalogErrorMessage(mutation));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', padding: Spacing.four }}>
        <ThemedText themeColor="textSecondary">
          {mode === 'create' ? 'Preparando formulario…' : 'Cargando servicio…'}
        </ThemedText>
      </ThemedView>
    );
  }

  if (role !== 'administrator') {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: 'center', gap: Spacing.three, padding: Spacing.four }}
      >
        <StatusMessage
          message={
            error ??
            'Solo un administrador activo de esta barbería puede gestionar servicios y estilos.'
          }
        />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
      </ThemedView>
    );
  }

  if (mode === 'edit' && (!service || !serviceId)) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: 'center', gap: Spacing.three, padding: Spacing.four }}
      >
        <StatusMessage message={error ?? 'El servicio solicitado no está disponible.'} />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
      </ThemedView>
    );
  }

  return (
    <CatalogFormPage
      description="El precio y la duración se usarán como referencia al crear nuevas reservas."
      title={mode === 'create' ? 'Nuevo servicio' : 'Editar servicio'}
    >
      {mutationError ? <StatusMessage message={mutationError} /> : null}
      <ServiceForm
        initialValues={
          service
            ? {
                name: service.name,
                description: service.description ?? '',
                price: String(service.price),
                durationMinutes: String(service.durationMinutes),
              }
            : undefined
        }
        isSubmitting={isSubmitting}
        onSubmit={(values) => void submit(values)}
        submitLabel={mode === 'create' ? 'Crear servicio' : 'Guardar cambios'}
      />
    </CatalogFormPage>
  );
}
