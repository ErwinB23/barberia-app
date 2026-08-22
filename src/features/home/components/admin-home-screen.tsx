import { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import type { User } from '@supabase/supabase-js';
import { router, type Href } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthLoadingScreen } from '@/features/auth/components/auth-loading-screen';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import {
  buildAdminAttentionState,
  getAdminHomeRoutes,
  isAdministrator,
} from '../admin-home-domain';
import { useAdminHome } from '../hooks/use-admin-home';
import { AdminAttentionSection } from './admin-attention-section';
import { AdminHomeHeader } from './admin-home-header';
import { AdminHomeSkeleton } from './admin-home-skeleton';
import { AdminManagementSection } from './admin-management-section';
import { AdminPublicationStatusCard } from './admin-publication-status-card';
import { AdminTodaySummary } from './admin-today-summary';
import { AdminUpcomingAppointments } from './admin-upcoming-appointments';

function OwnBarberSpaceLink({ href }: { href: string }) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.capacitySection}>
      <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
        Tu espacio operativo
      </ThemedText>
      <Pressable
        accessibilityHint="Abre tu perfil y herramientas de trabajo como barbero"
        accessibilityRole="link"
        onBlur={() => setIsFocused(false)}
        onFocus={() => setIsFocused(true)}
        onPress={() => router.push(href as Href)}
        style={({ pressed }) => [
          styles.capacityLink,
          {
            backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
            borderColor: theme.border,
            boxShadow: isFocused ? `0 0 0 2px ${theme.focus}` : undefined,
          },
          getPressedScaleStyle(pressed, reduceMotion, 0.985),
        ]}
      >
        <View style={[styles.capacityIcon, { backgroundColor: theme.surfaceMuted }]}>
          <AppIcon
            color={theme.primary}
            name={{ ios: 'person.crop.circle', android: 'badge', web: 'badge' }}
            size={22}
          />
        </View>
        <View style={styles.capacityCopy}>
          <ThemedText style={styles.capacityTitle}>Mi espacio de barbero</ThemedText>
          <ThemedText style={styles.capacityDescription} themeColor="textSecondary">
            Conserva tu agenda, horario, bloqueos y perfil profesional.
          </ThemedText>
        </View>
        <AppIcon
          color={theme.textSecondary}
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={17}
        />
      </Pressable>
    </View>
  );
}

function AuthenticatedAdminHome({
  user,
  barbershopId,
}: {
  user: User;
  barbershopId: string | null;
}) {
  const { data, isLoading, error, reload } = useAdminHome(user.id, barbershopId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isWide = width >= Layout.wideBreakpoint;
  const routes = useMemo(() => {
    if (!barbershopId || !data) return null;
    const ownBarberId = data.ownBarberProfile?.isActive ? data.ownBarberProfile.barberId : null;
    return getAdminHomeRoutes(barbershopId, ownBarberId);
  }, [barbershopId, data]);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await reload();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading && !data) {
    return (
      <ThemedView style={styles.screen}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            width < Layout.compactBreakpoint ? styles.compactContent : null,
            { paddingBottom: Math.max(insets.bottom + Spacing.four, Spacing.six) },
          ]}
          contentInsetAdjustmentBehavior="automatic"
        >
          <AdminHomeSkeleton />
        </ScrollView>
      </ThemedView>
    );
  }

  if (!data || !routes) {
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage
          message={error ?? 'La barbería solicitada no está disponible para tu cuenta.'}
        />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
        <ActionButton label="Volver al inicio" onPress={() => router.replace('/')} />
      </ThemedView>
    );
  }

  const { barbershop } = data.context;
  const isAdmin = isAdministrator(data.context.role);
  const attentionState = buildAdminAttentionState({
    pendingYapeCount: data.pendingYapeCount,
    pendingInvitationCount: data.pendingInvitationCount,
    publicationStatus: barbershop.status,
    publicationReadiness: data.publicationReadiness,
  });

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          width < Layout.compactBreakpoint ? styles.compactContent : null,
          { paddingBottom: Math.max(insets.bottom + Spacing.four, Spacing.six) },
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
        <AdminHomeHeader
          barbershopName={barbershop.name}
          status={barbershop.status}
          unreadNotificationCount={data.unreadNotificationCount}
        />

        {error ? <StatusMessage message={error} /> : null}

        {!isAdmin ? (
          <SurfaceCard style={styles.deniedCard}>
            <View style={styles.deniedCopy}>
              <ThemedText style={styles.sectionTitle}>Acceso administrativo restringido</ThemedText>
              <ThemedText style={styles.deniedDescription} themeColor="textSecondary">
                Tu membresía actual no permite administrar esta barbería.
              </ThemedText>
            </View>
            {routes.ownBarberHome ? (
              <ActionButton
                label="Ir a mi espacio de barbero"
                onPress={() => router.replace(routes.ownBarberHome as Href)}
              />
            ) : null}
          </SurfaceCard>
        ) : (
          <View style={styles.sections}>
            <AdminTodaySummary
              isWide={isWide}
              onOpenAgenda={() => router.push(routes.agenda as Href)}
              onRetry={() => void reload()}
              summary={data.summary}
            />

            <AdminAttentionSection
              routes={{
                pending_yape: routes.agenda,
                pending_invitations: routes.invitations,
                publication_readiness: routes.publication,
              }}
              state={attentionState}
            />

            <View style={[styles.dashboardRow, isWide ? styles.wideRow : null]}>
              <View style={styles.mainColumn}>
                <AdminUpcomingAppointments
                  appointmentHref={routes.appointment}
                  appointments={data.upcomingAppointments}
                  onOpenAgenda={() => router.push(routes.agenda as Href)}
                  onRetry={() => void reload()}
                />
              </View>
              <View style={styles.sideColumn}>
                <AdminManagementSection routes={routes} />
              </View>
            </View>

            <AdminPublicationStatusCard
              publicationHref={routes.publication}
              readiness={data.publicationReadiness}
              status={barbershop.status}
            />

            {routes.ownBarberHome ? <OwnBarberSpaceLink href={routes.ownBarberHome} /> : null}

            {data.unavailableSections.includes('ownBarberProfile') ? (
              <ThemedText style={styles.secondaryError} themeColor="textSecondary">
                No pudimos comprobar tu espacio operativo de barbero.
              </ThemedText>
            ) : null}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

export function AdminHomeScreen({ barbershopId }: { barbershopId: string | null }) {
  const { user } = useAuth();
  if (!user) return <AuthLoadingScreen />;

  return (
    <AuthenticatedAdminHome
      barbershopId={barbershopId}
      key={`${user.id}:${barbershopId}`}
      user={user}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: Layout.clientContentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.four,
    padding: Spacing.five,
    paddingBottom: Spacing.six,
  },
  compactContent: { paddingHorizontal: Spacing.three },
  centered: { flex: 1, justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  sections: { gap: Spacing.five },
  dashboardRow: { gap: Spacing.five },
  wideRow: { flexDirection: 'row', alignItems: 'flex-start' },
  mainColumn: { minWidth: 0, flex: 1.7 },
  sideColumn: { minWidth: 0, flex: 1 },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '700' },
  deniedCard: { gap: Spacing.three, padding: Spacing.four },
  deniedCopy: { gap: Spacing.one },
  deniedDescription: { fontSize: TypeScale.label, lineHeight: 21 },
  capacitySection: { gap: Spacing.three },
  capacityLink: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
  capacityIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  capacityCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  capacityTitle: { fontSize: TypeScale.body, fontWeight: '700' },
  capacityDescription: { fontSize: TypeScale.label, lineHeight: 20 },
  secondaryError: { fontSize: TypeScale.caption, lineHeight: 18 },
});
