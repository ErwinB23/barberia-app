import { useCallback, useState } from 'react';
import { router } from 'expo-router';

import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';

import { createStyle, updateStyle } from '../actions';
import { getCatalogErrorMessage } from '../errors';
import { useAdminCatalogResource } from '../hooks/use-admin-catalog-resource';
import { getService, getStyle } from '../queries';
import type { ParsedStyleForm } from '../validation';
import { CatalogFormPage } from './catalog-form-page';
import { StyleForm } from './style-form';

type StyleEditorScreenProps =
  | {
      mode: 'create';
      barbershopId: string | null;
      serviceId: string | null;
      styleId?: never;
    }
  | {
      mode: 'edit';
      barbershopId: string | null;
      serviceId: string | null;
      styleId: string | null;
    };

export function StyleEditorScreen(props: StyleEditorScreenProps) {
  const { barbershopId, mode, serviceId } = props;
  const styleId = mode === 'edit' ? props.styleId : null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const loadEditor = useCallback(async () => {
    if (!barbershopId || !serviceId) {
      return { service: null, style: null };
    }
    if (mode === 'create') {
      return { service: await getService(barbershopId, serviceId), style: null };
    }
    if (!styleId) {
      return { service: null, style: null };
    }
    return getStyle(barbershopId, serviceId, styleId);
  }, [barbershopId, mode, serviceId, styleId]);
  const { data, role, isLoading, error, reload } = useAdminCatalogResource(
    barbershopId,
    loadEditor,
  );

  const submit = async (values: ParsedStyleForm) => {
    if (!barbershopId || !serviceId || role !== 'administrator') {
      return;
    }

    setIsSubmitting(true);
    setMutationError(null);

    try {
      if (mode === 'create') {
        await createStyle(barbershopId, serviceId, values);
      } else {
        if (!styleId) {
          return;
        }
        await updateStyle(barbershopId, serviceId, styleId, values);
      }

      const saved = mode === 'create' ? 'style-created' : 'style-updated';
      router.replace(`/barbershops/${barbershopId}/services/${serviceId}?saved=${saved}`);
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
          {mode === 'create' ? 'Preparando formulario…' : 'Cargando estilo…'}
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

  if (!data?.service || !serviceId || (mode === 'edit' && (!data.style || !styleId))) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: 'center', gap: Spacing.three, padding: Spacing.four }}
      >
        <StatusMessage message={error ?? 'El servicio o estilo solicitado no está disponible.'} />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
      </ThemedView>
    );
  }

  return (
    <CatalogFormPage
      description={`Referencia visual para ${data.service.name}. No cambia su precio ni duración.`}
      title={mode === 'create' ? 'Nuevo estilo' : 'Editar estilo'}
    >
      {mutationError ? <StatusMessage message={mutationError} /> : null}
      <StyleForm
        initialValues={
          data.style
            ? {
                name: data.style.name,
                description: data.style.description ?? '',
                imageUrl: data.style.imageUrl ?? '',
              }
            : undefined
        }
        isSubmitting={isSubmitting}
        onSubmit={(values) => void submit(values)}
        submitLabel={mode === 'create' ? 'Crear estilo' : 'Guardar cambios'}
      />
    </CatalogFormPage>
  );
}
