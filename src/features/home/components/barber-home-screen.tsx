import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { AuthLoadingScreen } from '@/features/auth/components/auth-loading-screen';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Motion } from '@/theme/tokens';

import { getBarberHomeRoutes } from '../barber-home-domain';
import { getClientFirstName } from '../client-home-domain';
import { useBarberHome } from '../hooks/use-barber-home';
import { BarberHomeHeader } from './barber-home-header';
import { BarberHomeSkeleton } from './barber-home-skeleton';
import { BarberNextAppointment, BarberNextAppointmentEmpty } from './barber-next-appointment';
import { BarberQuickActions } from './barber-quick-actions';
import { BarberTodaySummary } from './barber-today-summary';
import { BarberUpcomingAppointments } from './barber-upcoming-appointments';

export function BarberHomeScreen({
  barbershopId,
  barberId,
}: {
  barbershopId: string | null;
  barberId: string | null;
}) {
  const { user } = useAuth();

  if (!user) return <AuthLoadingScreen />;

  return (
    <AuthenticatedBarberHome
      barberId={barberId}
      barbershopId={barbershopId}
      key={`${user.id}:${barbershopId}:${barberId}`}
      user={user}
    />
  );
}

function AuthenticatedBarberHome({
  user,
  barbershopId,
  barberId,
}: {
  user: User;
  barbershopId: string | null;
  barberId: string | null;
}) {
  const profileResource = useProfile(user);
  const { data, isLoading, error, reload } = useBarberHome(user.id, barbershopId, barberId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isWide = width >= Layout.wideBreakpoint;
  const routes = useMemo(
    () => (barbershopId && barberId ? getBarberHomeRoutes(barbershopId, barberId) : null),
    [barberId, barbershopId],
  );
  const nextAppointment = data?.nextAppointment ?? null;

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await reload();
    } finally {
      setIsRefreshing(false);
    }
  };

  const header = (
    <BarberHomeHeader
      barbershopName={data?.barbershopName ?? data?.todayAppointments[0]?.barbershopName ?? null}
      firstName={getClientFirstName(profileResource.profile?.fullName)}
      unreadNotificationCount={data?.unreadNotificationCount ?? null}
    />
  );

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top + Spacing.two, Spacing.four) },
          width < Layout.compactBreakpoint ? styles.compactContent : null,
        ]}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            colors={[theme.primary]}
            onRefresh={() => void refresh()}
            refreshing={isRefreshing}
            tintColor={theme.primary}
          />
        }
      >
        {header}

        {profileResource.error ? <StatusMessage message={profileResource.error} /> : null}
        {error && data ? <StatusMessage message={error} /> : null}

        {isLoading && !data ? <BarberHomeSkeleton /> : null}

        {!isLoading && (!data || !routes) ? (
          <View style={styles.errorState}>
            <StatusMessage message="No pudimos abrir este espacio profesional. Verifica que tu perfil de barbero continúe activo." />
            <View style={styles.errorActions}>
              <ActionButton label="Reintentar" onPress={() => void reload()} />
              <ActionButton
                label="Volver al inicio cliente"
                onPress={() => router.replace('/')}
                variant="secondary"
              />
            </View>
          </View>
        ) : null}

        {data && routes ? (
          <Animated.View
            entering={FadeIn.duration(Motion.state).reduceMotion(ReduceMotion.System)}
            style={styles.sections}
          >
            <View style={[styles.dashboardRow, isWide ? styles.wideRow : null]}>
              <View style={styles.mainColumn}>
                {nextAppointment ? (
                  <BarberNextAppointment
                    appointment={nextAppointment}
                    onOpen={() => router.push(routes.appointment(nextAppointment.id) as Href)}
                  />
                ) : (
                  <BarberNextAppointmentEmpty
                    emptyState={data.emptyState ?? 'day_complete'}
                    onOpenAgenda={() => router.push(routes.agenda as Href)}
                  />
                )}
              </View>
              <View style={styles.sideColumn}>
                <BarberTodaySummary summary={data.summary} />
              </View>
            </View>

            <View style={[styles.dashboardRow, isWide ? styles.wideRow : null]}>
              <View style={styles.mainColumn}>
                <BarberUpcomingAppointments
                  appointmentHref={routes.appointment}
                  appointments={data.followingAppointments}
                  onOpenAgenda={() => router.push(routes.agenda as Href)}
                />
              </View>
              <View style={styles.sideColumn}>
                <BarberQuickActions
                  agendaHref={routes.agenda}
                  newBlockHref={routes.newBlock}
                  scheduleHref={routes.schedule}
                  workspaceHref={routes.workspace}
                />
              </View>
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: Layout.clientContentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.four,
    padding: Spacing.five,
    paddingBottom: Spacing.six,
  },
  compactContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
  },
  sections: {
    gap: Spacing.four,
  },
  dashboardRow: {
    gap: Spacing.four,
  },
  wideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainColumn: {
    minWidth: 0,
    flex: 2,
  },
  sideColumn: {
    minWidth: 0,
    flex: 1,
  },
  errorState: {
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  errorActions: {
    gap: Spacing.two,
  },
});
