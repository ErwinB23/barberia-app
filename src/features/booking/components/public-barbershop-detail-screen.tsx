import { useCallback, useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';

import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import { getBarberServiceSummary } from '../booking-domain';
import { useFocusedResource } from '../hooks/use-focused-resource';
import { getPublicBarbershopDetail } from '../queries';
import type { BookingStyle } from '../types';
import { PublicBarberCard } from './public-barber-card';
import { PublicBarbershopDetailSkeleton } from './public-barbershop-detail-skeleton';
import { PublicBarbershopHero } from './public-barbershop-hero';
import { PublicOpeningHours } from './public-opening-hours';
import { PublicServiceCard } from './public-service-card';

export function PublicBarbershopDetailScreen({ barbershopId }: { barbershopId: string | null }) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const isCompact = width < Layout.compactBreakpoint;
  const isWide = width >= Layout.wideBreakpoint;
  const load = useCallback(
    () => (barbershopId ? getPublicBarbershopDetail(barbershopId) : Promise.resolve(null)),
    [barbershopId],
  );
  const { data, isLoading, error, reload } = useFocusedResource(load);
  const stylesByServiceId = useMemo(() => {
    const grouped = new Map<string, BookingStyle[]>();
    for (const style of data?.styles ?? []) {
      const serviceStyles = grouped.get(style.serviceId) ?? [];
      serviceStyles.push(style);
      grouped.set(style.serviceId, serviceStyles);
    }
    return grouped;
  }, [data?.styles]);

  if (isLoading && !data) {
    return <PublicBarbershopDetailSkeleton isCompact={isCompact} isWide={isWide} />;
  }

  if (!barbershopId || !data) {
    return (
      <ThemedView style={styles.centered}>
        <View style={[styles.errorIcon, { backgroundColor: theme.surfaceMuted }]}>
          <AppIcon
            color={theme.primary}
            name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
            size={30}
          />
        </View>
        <View style={styles.errorCopy}>
          <ThemedText accessibilityRole="header" style={styles.errorTitle}>
            Esta barbería no está disponible
          </ThemedText>
          <ThemedText style={styles.errorDescription} themeColor="textSecondary">
            {error ?? 'Puede estar despublicada o el enlace ya no ser válido.'}
          </ThemedText>
        </View>
        {barbershopId ? (
          <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
        ) : null}
        <ActionButton label="Volver a explorar" onPress={() => router.replace('/explore')} />
      </ThemedView>
    );
  }

  const { barbershop, hours, services, barbers, assignments } = data;

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, isCompact ? styles.compactContent : null]}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            colors={[theme.primary]}
            onRefresh={() => void reload()}
            refreshing={isLoading}
            tintColor={theme.primary}
          />
        }
      >
        <PublicBarbershopHero
          barbershop={barbershop}
          canBook={barbershop.status === 'published' && services.length > 0}
          isWide={isWide}
          onBook={() =>
            router.push({
              pathname: '/booking/[barbershopId]',
              params: { barbershopId: barbershop.id },
            })
          }
        />

        {error ? <StatusMessage message={error} /> : null}

        <DetailSection
          description="Precios y tiempos claros antes de elegir tu turno."
          title="Servicios"
        >
          {services.length > 0 ? (
            <View style={styles.serviceList}>
              {services.map((service) => (
                <PublicServiceCard
                  key={service.id}
                  service={service}
                  serviceStyles={stylesByServiceId.get(service.id) ?? []}
                />
              ))}
            </View>
          ) : (
            <DetailEmptyState message="Esta barbería aún no tiene servicios activos para reservar." />
          )}
        </DetailSection>

        <DetailSection
          description="Conoce al equipo disponible y los servicios que realiza cada profesional."
          title="Barberos"
        >
          {barbers.length > 0 ? (
            <View style={styles.barberGrid}>
              {barbers.map((barber) => (
                <PublicBarberCard
                  barber={barber}
                  key={barber.id}
                  serviceSummary={getBarberServiceSummary(barber.id, services, assignments)}
                />
              ))}
            </View>
          ) : (
            <DetailEmptyState message="No hay barberos activos visibles en este momento." />
          )}
        </DetailSection>

        <DetailSection
          description="Los turnos disponibles se validan en tiempo real al reservar."
          title="Horario habitual"
        >
          <PublicOpeningHours hours={hours} />
        </DetailSection>
      </ScrollView>
    </ThemedView>
  );
}

function DetailSection({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
          {title}
        </ThemedText>
        <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
          {description}
        </ThemedText>
      </View>
      {children}
    </View>
  );
}

function DetailEmptyState({ message }: { message: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
      <ThemedText style={styles.emptyStateText} themeColor="textSecondary">
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  errorIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  errorCopy: {
    maxWidth: 520,
    gap: Spacing.one,
  },
  errorTitle: {
    fontSize: TypeScale.title,
    fontWeight: '700',
  },
  errorDescription: {
    fontSize: TypeScale.body,
    lineHeight: 24,
  },
  content: {
    width: '100%',
    maxWidth: Layout.clientContentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.five,
    padding: Spacing.five,
    paddingBottom: Spacing.seven,
  },
  compactContent: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    paddingBottom: Spacing.six,
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeading: {
    maxWidth: 680,
    gap: Spacing.one,
  },
  sectionTitle: {
    fontSize: TypeScale.title,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  sectionDescription: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
  serviceList: {
    gap: Spacing.three,
  },
  barberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  emptyState: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
  },
  emptyStateText: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
});
