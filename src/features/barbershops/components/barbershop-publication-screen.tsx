import { ScrollView, StyleSheet } from 'react-native';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { ActionButton } from '@/shared/components/ui/action-button';
import { ListScreenSkeleton } from '@/shared/components/ui/list-screen-skeleton';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';
import { Layout } from '@/theme/tokens';

import { useBarbershopDetail } from '../hooks/use-barbershop-detail';
import { BarbershopPublicationCard } from './barbershop-publication-card';

export function BarbershopPublicationScreen({ barbershopId }: { barbershopId: string | null }) {
  const { user } = useAuth();
  const { detail, isLoading, error, reload } = useBarbershopDetail(user!.id, barbershopId);

  if (isLoading) {
    return <ListScreenSkeleton rows={3} />;
  }

  if (!detail || !barbershopId || detail.role !== 'administrator') {
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage message={error ?? 'No tienes acceso a la publicación de esta barbería.'} />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <ScreenHeading
          compact
          description="Revisa la preparación y controla la visibilidad de la barbería."
          eyebrow="Administración"
          title="Publicación"
        />
        {detail.publicationReadiness ? (
          <BarbershopPublicationCard
            barbershopId={barbershopId}
            onRefresh={reload}
            readiness={detail.publicationReadiness}
            status={detail.barbershop.status}
          />
        ) : (
          <StatusMessage message="No pudimos comprobar la preparación para publicar." />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  centered: { flex: 1, justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
});
