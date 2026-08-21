import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import type { User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { AuthLoadingScreen } from '@/features/auth/components/auth-loading-screen';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Motion, Radius, TypeScale } from '@/theme/tokens';

import { getClientFirstName } from '../client-home-domain';
import { useClientHome } from '../hooks/use-client-home';
import { ClientHomeHeader } from './client-home-header';
import { ClientHomeSkeleton } from './client-home-skeleton';
import { HomeBarbershopCard } from './home-barbershop-card';
import { HomeSearchEntry } from './home-search-entry';
import { NoUpcomingReservationCard, UpcomingReservationCard } from './upcoming-reservation-card';

type HomeSectionHeaderProps = {
  actionLabel: string;
  onAction: () => void;
  title: string;
};

function HomeSectionHeader({ actionLabel, onAction, title }: HomeSectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        onPress={onAction}
        style={({ pressed }) => [styles.sectionAction, pressed ? { opacity: 0.65 } : null]}
      >
        <ThemedText style={styles.sectionActionLabel} themeColor="primary">
          {actionLabel}
        </ThemedText>
        <AppIcon
          color={theme.primary}
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={15}
        />
      </Pressable>
    </View>
  );
}

function AuthenticatedClientHome({ user }: { user: User }) {
  const { profile, error: profileError } = useProfile(user);
  const { data, isLoading, error, reload } = useClientHome(user.id);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isWide = width >= Layout.wideBreakpoint;

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top + Spacing.two, Spacing.four) },
          width < Layout.compactBreakpoint ? styles.compactContent : null,
        ]}
        refreshControl={
          <RefreshControl
            colors={[theme.primary]}
            onRefresh={() => void reload()}
            refreshing={isLoading && data !== null}
            tintColor={theme.primary}
          />
        }
      >
        <View style={styles.intro}>
          <ClientHomeHeader
            firstName={getClientFirstName(profile?.fullName)}
            unreadNotificationCount={data?.unreadNotificationCount ?? null}
          />
          <HomeSearchEntry />
        </View>

        {profileError ? <StatusMessage message={profileError} /> : null}
        {error ? (
          <View style={styles.errorGroup}>
            <StatusMessage message={error} />
            {!data ? (
              <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
            ) : null}
          </View>
        ) : null}

        {isLoading && !data ? <ClientHomeSkeleton /> : null}

        {data ? (
          <Animated.View
            entering={FadeIn.duration(Motion.state).reduceMotion(ReduceMotion.System)}
            style={styles.sections}
          >
            <View style={styles.section}>
              {data.upcomingReservation ? (
                <UpcomingReservationCard reservation={data.upcomingReservation} />
              ) : (
                <NoUpcomingReservationCard />
              )}
            </View>

            <View style={styles.section}>
              <HomeSectionHeader
                actionLabel="Ver todas"
                onAction={() => router.push('/explore')}
                title="Barberías disponibles"
              />
              {data.availableBarbershops.length > 0 ? (
                isWide ? (
                  <View style={styles.wideCardGrid}>
                    {data.availableBarbershops.map((barbershop) => (
                      <HomeBarbershopCard
                        key={barbershop.id}
                        barbershop={barbershop}
                        style={styles.wideCard}
                      />
                    ))}
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    contentContainerStyle={styles.horizontalCards}
                    showsHorizontalScrollIndicator={false}
                  >
                    {data.availableBarbershops.map((barbershop) => (
                      <HomeBarbershopCard key={barbershop.id} barbershop={barbershop} />
                    ))}
                  </ScrollView>
                )
              ) : (
                <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
                  <ThemedText style={styles.emptyTitle}>Nuevos espacios llegarán pronto</ThemedText>
                  <ThemedText style={styles.emptyDescription} themeColor="textSecondary">
                    Aún no hay barberías publicadas con reservas disponibles.
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <HomeSectionHeader
                actionLabel="Ver favoritas"
                onAction={() => router.push('/favorites')}
                title="Tus favoritas"
              />
              {data.favorites.length > 0 ? (
                isWide ? (
                  <View style={styles.wideCardGrid}>
                    {data.favorites.map((favorite) => (
                      <HomeBarbershopCard
                        key={favorite.id}
                        barbershop={favorite.barbershop}
                        isPrimary={favorite.isPrimary}
                        style={styles.wideCard}
                      />
                    ))}
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    contentContainerStyle={styles.horizontalCards}
                    showsHorizontalScrollIndicator={false}
                  >
                    {data.favorites.map((favorite) => (
                      <HomeBarbershopCard
                        key={favorite.id}
                        barbershop={favorite.barbershop}
                        isPrimary={favorite.isPrimary}
                      />
                    ))}
                  </ScrollView>
                )
              ) : (
                <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
                  <View style={styles.emptyCopy}>
                    <ThemedText style={styles.emptyTitle}>
                      Guarda tus lugares de confianza
                    </ThemedText>
                    <ThemedText style={styles.emptyDescription} themeColor="textSecondary">
                      Tus favoritas aparecerán aquí para volver a reservar más rápido.
                    </ThemedText>
                  </View>
                  <ActionButton
                    label="Descubrir barberías"
                    onPress={() => router.push('/explore')}
                    variant="secondary"
                  />
                </View>
              )}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

export function AuthenticatedHomeScreen() {
  const { user } = useAuth();

  if (!user) return <AuthLoadingScreen />;

  return <AuthenticatedClientHome key={user.id} user={user} />;
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
    gap: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
  },
  intro: {
    gap: Spacing.three,
  },
  sections: {
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  sectionTitle: {
    flex: 1,
    fontSize: TypeScale.title,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionAction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingLeft: Spacing.two,
  },
  sectionActionLabel: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  horizontalCards: {
    gap: Spacing.three,
    paddingRight: Spacing.three,
  },
  wideCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  wideCard: {
    width: 'auto',
    minWidth: 220,
    maxWidth: 264,
    flexBasis: 220,
    flexGrow: 1,
  },
  errorGroup: {
    gap: Spacing.three,
  },
  emptyState: {
    gap: Spacing.three,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
  },
  emptyCopy: {
    gap: Spacing.one,
  },
  emptyTitle: {
    fontSize: TypeScale.body,
    fontWeight: '700',
  },
  emptyDescription: {
    maxWidth: 520,
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
});
