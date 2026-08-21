import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { formatLimaDate, formatLimaTime, formatPen, useFocusedResource } from '@/features/booking';
import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import {
  getClientReservationHref,
  getReservationServiceSummary,
  groupClientReservations,
} from '../reservation-domain';
import { getClientReservations } from '../queries';
import type { ClientReservation } from '../types';
import { PaymentStatusBadge, ReservationStatusBadge } from './appointment-status-badge';
import { ReservationsListSkeleton } from './reservation-screen-states';

type ReservationSection = 'upcoming' | 'history';

const ReservationCard = memo(function ReservationCard({
  reservation,
}: {
  reservation: ClientReservation;
}) {
  const theme = useTheme();

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.cardTopline}>
        <View style={styles.cardTitleCopy}>
          <ThemedText numberOfLines={2} style={styles.cardTitle}>
            {reservation.barbershopName}
          </ThemedText>
          <View style={styles.dateRow}>
            <AppIcon
              color={theme.textSecondary}
              name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
              size={17}
            />
            <ThemedText style={styles.date}>
              {formatLimaDate(reservation.startsAt)}, {formatLimaTime(reservation.startsAt)}
            </ThemedText>
          </View>
        </View>
        <ReservationStatusBadge status={reservation.status} />
      </View>

      <View style={styles.summaryBlock}>
        <ThemedText numberOfLines={2} style={styles.serviceSummary}>
          {reservation.itemsUnavailable
            ? 'No pudimos cargar el detalle de servicios'
            : getReservationServiceSummary(reservation.items)}
        </ThemedText>
        <ThemedText style={styles.secondaryLine} themeColor="textSecondary">
          Con {reservation.barberName}
        </ThemedText>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.priceCopy}>
          <ThemedText style={styles.price}>{formatPen(reservation.totalPrice)}</ThemedText>
          <ThemedText style={styles.duration} themeColor="textSecondary">
            {reservation.totalDurationMinutes} min
          </ThemedText>
        </View>
        {!reservation.paymentUnavailable && reservation.payment ? (
          <PaymentStatusBadge status={reservation.payment.status} />
        ) : null}
      </View>

      <ActionButton
        label="Ver detalle"
        onPress={() => router.push(getClientReservationHref(reservation.id) as Href)}
        size="compact"
        variant="secondary"
      />
    </SurfaceCard>
  );
});

export function ReservationsScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<ReservationSection>('upcoming');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const load = useCallback(
    () => (user ? getClientReservations(user.id) : Promise.resolve([])),
    [user],
  );
  const { data, isLoading, error, reload } = useFocusedResource(load);
  const grouped = useMemo(() => groupClientReservations(data ?? []), [data]);
  const visibleReservations = activeSection === 'upcoming' ? grouped.upcoming : grouped.history;

  const refresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  if (isLoading && data === null) return <ReservationsListSkeleton />;

  if (error && data === null) {
    return (
      <ThemedView style={styles.errorScreen}>
        <ScreenHeading
          compact
          description="Consulta tus próximas citas y el historial de atención."
          title="Mis reservas"
        />
        <StatusMessage message={error} />
        <ActionButton label="Volver a intentar" onPress={() => void reload()} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={visibleReservations}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(reservation) => reservation.id}
        ListEmptyComponent={<ReservationEmptyState section={activeSection} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              description="Revisa tus próximas citas y conserva a mano el historial de cada atención."
              title="Mis reservas"
            />
            <ReservationTabs
              activeSection={activeSection}
              historyCount={grouped.history.length}
              onChange={setActiveSection}
              upcomingCount={grouped.upcoming.length}
            />
            {error ? (
              <View style={styles.inlineError}>
                <StatusMessage message={error} />
                <ActionButton
                  label="Reintentar actualización"
                  onPress={() => void reload()}
                  variant="secondary"
                />
              </View>
            ) : null}
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
        renderItem={({ item }) => <ReservationCard reservation={item} />}
      />
    </ThemedView>
  );
}

function ReservationTabs({
  activeSection,
  upcomingCount,
  historyCount,
  onChange,
}: {
  activeSection: ReservationSection;
  upcomingCount: number;
  historyCount: number;
  onChange: (section: ReservationSection) => void;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.tabs, { backgroundColor: theme.surfaceMuted }]}
    >
      {(
        [
          { key: 'upcoming', label: 'Próximas', count: upcomingCount },
          { key: 'history', label: 'Historial', count: historyCount },
        ] as const
      ).map((tab) => {
        const selected = activeSection === tab.key;
        return (
          <Pressable
            accessibilityLabel={`${tab.label}, ${tab.count} reservas`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              selected
                ? {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    boxShadow: `0 4px 12px ${theme.cardShadow}`,
                  }
                : styles.tabInactive,
              pressed ? { opacity: 0.76 } : null,
              pressed && !reduceMotion ? { transform: [{ scale: 0.985 }] } : null,
            ]}
          >
            <ThemedText style={styles.tabLabel}>{tab.label}</ThemedText>
            <View
              style={[
                styles.countBadge,
                { backgroundColor: selected ? theme.primary : theme.background },
              ]}
            >
              <ThemedText
                style={[styles.countLabel, selected ? { color: theme.onPrimary } : null]}
                themeColor="textSecondary"
              >
                {tab.count}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function ReservationEmptyState({ section }: { section: ReservationSection }) {
  const theme = useTheme();
  const isUpcoming = section === 'upcoming';

  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceMuted }]}>
        <AppIcon
          color={theme.primary}
          name={
            isUpcoming
              ? { ios: 'calendar.badge.plus', android: 'event_available', web: 'event_available' }
              : { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }
          }
          size={30}
        />
      </View>
      <View style={styles.emptyCopy}>
        <ThemedText style={styles.emptyTitle}>
          {isUpcoming ? 'Tu agenda está libre' : 'Aún no tienes historial'}
        </ThemedText>
        <ThemedText style={styles.emptyDescription} themeColor="textSecondary">
          {isUpcoming
            ? 'Cuando reserves una cita, la verás aquí con toda la información necesaria.'
            : 'Las citas completadas, canceladas o anteriores aparecerán en esta sección.'}
        </ThemedText>
      </View>
      {isUpcoming ? (
        <ActionButton label="Explorar barberías" onPress={() => router.push('/explore' as Href)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: { gap: Spacing.four, paddingBottom: Spacing.four },
  inlineError: { gap: Spacing.two },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.one,
    borderRadius: Radius.medium,
    padding: Spacing.one,
  },
  tab: {
    minHeight: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
  },
  tabInactive: { borderColor: 'transparent' },
  tabLabel: { fontSize: TypeScale.label, fontWeight: '800' },
  countBadge: {
    minWidth: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.one,
  },
  countLabel: { fontSize: TypeScale.caption, fontWeight: '800', fontVariant: ['tabular-nums'] },
  separator: { height: Spacing.three },
  card: { gap: Spacing.three, padding: Spacing.three },
  cardTopline: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  cardTitleCopy: { minWidth: 0, flex: 1, gap: Spacing.two },
  cardTitle: { fontSize: TypeScale.title, fontWeight: '800', lineHeight: 26 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  date: { flex: 1, fontSize: TypeScale.label, fontWeight: '700', lineHeight: 20 },
  summaryBlock: { gap: Spacing.one },
  serviceSummary: { fontSize: TypeScale.body, fontWeight: '700', lineHeight: 23 },
  secondaryLine: { fontSize: TypeScale.label, lineHeight: 21 },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  priceCopy: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two },
  price: { fontSize: TypeScale.body, fontWeight: '800', fontVariant: ['tabular-nums'] },
  duration: { fontSize: TypeScale.caption },
  emptyState: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.six,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  emptyCopy: { maxWidth: 420, gap: Spacing.two },
  emptyTitle: { fontSize: TypeScale.title, fontWeight: '800', textAlign: 'center' },
  emptyDescription: { fontSize: TypeScale.body, lineHeight: 24, textAlign: 'center' },
  errorScreen: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.formMaxWidth,
    alignSelf: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
});
