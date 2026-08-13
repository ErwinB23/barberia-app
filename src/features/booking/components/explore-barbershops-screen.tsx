import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';

import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import { useFocusedResource } from '../hooks/use-focused-resource';
import { getPublicBarbershops } from '../queries';
import type { PublicBarbershop } from '../types';

function BarbershopCard({ barbershop }: { barbershop: PublicBarbershop }) {
  const showLogo = barbershop.logoUrl?.startsWith('https://');

  return (
    <SurfaceCard style={styles.card}>
      {showLogo ? (
        <Image
          accessibilityLabel={`Logo de ${barbershop.name}`}
          contentFit="cover"
          source={{ uri: barbershop.logoUrl! }}
          style={styles.logo}
        />
      ) : null}
      <View style={styles.cardCopy}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.cardTitle}>{barbershop.name}</ThemedText>
          <ThemedText
            style={styles.status}
            themeColor={barbershop.status === 'published' ? 'success' : 'textSecondary'}
          >
            {barbershop.status === 'published' ? 'Disponible' : 'Pausada'}
          </ThemedText>
        </View>
        {barbershop.description ? (
          <ThemedText style={styles.description} themeColor="textSecondary">
            {barbershop.description}
          </ThemedText>
        ) : null}
        {barbershop.address ? (
          <ThemedText style={styles.meta}>{barbershop.address}</ThemedText>
        ) : null}
      </View>
      <ActionButton
        label="Ver barbería"
        onPress={() => router.push(`/explore/${barbershop.id}` as Href)}
      />
    </SurfaceCard>
  );
}

export function ExploreBarbershopsScreen() {
  const theme = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const load = useCallback(() => getPublicBarbershops(), []);
  const { data, isLoading, error, reload } = useFocusedResource(load);

  const refresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  if (isLoading && !data) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Buscando barberías…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={data ?? []}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(barbershop) => barbershop.id}
        ListEmptyComponent={
          <SurfaceCard style={styles.emptyCard}>
            <ThemedText style={styles.cardTitle}>Aún no hay barberías publicadas</ThemedText>
            <ThemedText themeColor="textSecondary">
              Cuando una barbería abra su agenda, aparecerá en este espacio.
            </ThemedText>
          </SurfaceCard>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              description="Encuentra un servicio, compara horarios y reserva con un profesional disponible."
              eyebrow="Explorar"
              title="Barberías"
            />
            {error ? <StatusMessage message={error} /> : null}
          </View>
        }
        refreshControl={
          <RefreshControl
            colors={[theme.primary]}
            onRefresh={() => void refresh()}
            refreshing={isRefreshing}
            tintColor={theme.primary}
          />
        }
        renderItem={({ item }) => <BarbershopCard barbershop={item} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  content: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: { gap: Spacing.three, paddingBottom: Spacing.four },
  separator: { height: Spacing.three },
  card: { gap: Spacing.three, overflow: 'hidden', padding: Spacing.four },
  logo: { width: '100%', aspectRatio: 16 / 7, borderRadius: Radius.medium },
  cardCopy: { gap: Spacing.two },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  cardTitle: { flex: 1, fontSize: TypeScale.title, fontWeight: '700' },
  status: { fontSize: TypeScale.caption, fontWeight: '700' },
  description: { fontSize: TypeScale.label, lineHeight: 21 },
  meta: { fontSize: TypeScale.label, fontWeight: '600' },
  emptyCard: { gap: Spacing.two, padding: Spacing.four },
});
