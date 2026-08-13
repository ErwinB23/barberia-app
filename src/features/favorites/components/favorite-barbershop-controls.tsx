import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';
import { StyleSheet } from 'react-native';

import { addFavorite, changePrimaryFavorite, removeFavorite } from '../actions';
import { getFavoriteErrorMessage } from '../errors';
import { getFavoriteStatus } from '../queries';
import type { FavoriteStatus } from '../types';

export function FavoriteBarbershopControls({ barbershopId }: { barbershopId: string }) {
  const { user } = useAuth();
  const [favorite, setFavorite] = useState<FavoriteStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      setFavorite(await getFavoriteStatus(user.id, barbershopId));
    } catch (loadError) {
      setError(getFavoriteErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [barbershopId, user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const run = async (operation: () => Promise<void>, successMessage: string) => {
    setIsMutating(true);
    setError(null);
    setFeedback(null);
    try {
      await operation();
      setFeedback(successMessage);
      await load();
    } catch (mutationError) {
      setError(getFavoriteErrorMessage(mutationError));
    } finally {
      setIsMutating(false);
    }
  };

  if (!user) return null;

  return (
    <SurfaceCard style={styles.card}>
      <ThemedText style={styles.title}>Tu lista personal</ThemedText>
      <ThemedText themeColor="textSecondary">
        Guarda esta barbería para encontrarla rápidamente cuando quieras reservar.
      </ThemedText>
      {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
      {error ? <StatusMessage message={error} /> : null}
      {!favorite ? (
        <ActionButton
          disabled={isLoading}
          isLoading={isMutating}
          label="Agregar a favoritos"
          onPress={() =>
            void run(() => addFavorite(user.id, barbershopId), 'Barbería agregada a favoritas.')
          }
        />
      ) : (
        <>
          {favorite.isPrimary ? (
            <ActionButton
              isLoading={isMutating}
              label="Quitar como principal"
              onPress={() =>
                void run(
                  () => changePrimaryFavorite(user.id, null),
                  'Ya no tienes una barbería principal.',
                )
              }
              variant="secondary"
            />
          ) : (
            <ActionButton
              isLoading={isMutating}
              label="Establecer como principal"
              onPress={() =>
                void run(
                  () => changePrimaryFavorite(user.id, favorite.id),
                  'Barbería establecida como principal.',
                )
              }
              variant="secondary"
            />
          )}
          <ActionButton
            disabled={isMutating}
            label="Quitar de favoritos"
            onPress={() =>
              void run(
                () => removeFavorite(user.id, favorite.id),
                'Barbería eliminada de favoritas.',
              )
            }
            variant="danger"
          />
        </>
      )}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.four },
  title: { fontSize: TypeScale.title, fontWeight: '700' },
});
