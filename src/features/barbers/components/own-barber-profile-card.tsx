import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';

import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

import { getBarberErrorMessage } from '../errors';
import { getOwnBarberProfile } from '../queries';
import type { OwnBarberProfile } from '../types';

export function OwnBarberProfileCard({ barbershopId }: { barbershopId: string }) {
  const [profile, setProfile] = useState<OwnBarberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setProfile(await getOwnBarberProfile(barbershopId));
    } catch (loadError) {
      setProfile(null);
      setError(getBarberErrorMessage(loadError, 'barbers'));
    } finally {
      setIsLoading(false);
    }
  }, [barbershopId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SurfaceCard style={{ gap: Spacing.three, padding: Spacing.four }}>
      <ThemedText style={{ fontSize: TypeScale.title, fontWeight: '700' }}>
        Mi espacio de barbero
      </ThemedText>
      {isLoading ? (
        <ThemedText themeColor="textSecondary">Cargando perfil operativo…</ThemedText>
      ) : error ? (
        <>
          <StatusMessage message={error} />
          <ActionButton label="Reintentar" onPress={() => void load()} variant="secondary" />
        </>
      ) : profile?.isActive ? (
        <>
          <ThemedText themeColor="textSecondary">
            Gestiona tu perfil público, servicios asignados, horario individual y bloqueos.
          </ThemedText>
          <ActionButton
            label="Entrar a mi espacio"
            onPress={() =>
              router.push(`/barbershops/${barbershopId}/barbers/${profile.barberId}/home`)
            }
            variant="secondary"
          />
        </>
      ) : profile ? (
        <StatusMessage message="Tu perfil de barbero existe, pero está inactivo. La reactivación requiere el flujo autorizado correspondiente." />
      ) : (
        <StatusMessage message="No existe un perfil de barbero asociado a tu cuenta en esta barbería." />
      )}
    </SurfaceCard>
  );
}
