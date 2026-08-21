import { useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';

import { getAuthErrorMessage } from '@/features/auth/auth-errors';
import { AuthLoadingScreen } from '@/features/auth/components/auth-loading-screen';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useUnreadNotificationCount } from '@/features/notifications/hooks/use-unread-notification-count';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useProfileSpaces } from '@/features/profile/hooks/use-profile-spaces';
import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Motion, TypeScale } from '@/theme/tokens';

import { ProfileAvatar } from './profile-avatar';
import { ProfileNavigationRow } from './profile-navigation-row';
import { ProfilePersonalForm } from './profile-personal-form';

type ProfileSectionProps = {
  children: ReactNode;
  description?: string;
  title: string;
};

function ProfileSection({ children, description, title }: ProfileSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <ThemedText
          accessibilityRole="header"
          style={styles.sectionTitle}
          themeColor="textSecondary"
        >
          {title}
        </ThemedText>
        {description ? (
          <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
      {children}
    </View>
  );
}

type AuthenticatedProfileHomeProps = {
  user: User;
  signOut: () => Promise<void>;
};

function AuthenticatedProfileHome({ user, signOut }: AuthenticatedProfileHomeProps) {
  const { profile, isLoading, error, reload, save } = useProfile(user);
  const {
    spaces,
    isLoading: areSpacesLoading,
    error: spacesError,
    reload: reloadSpaces,
  } = useProfileSpaces(user.id);
  const { count: unreadNotificationCount } = useUnreadNotificationCount(user.id);
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [isEditing, setIsEditing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const isCompact = width < Layout.compactBreakpoint;
  const displayName = profile?.fullName ?? user.email?.split('@')[0] ?? 'Tu cuenta';

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(null);

    try {
      await signOut();
    } catch (signOutFailure) {
      setSignOutError(getAuthErrorMessage(signOutFailure));
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={72}
        style={styles.screen}
      >
        <ScrollView
          contentContainerStyle={[styles.content, isCompact ? styles.compactContent : null]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeading
            compact={isCompact}
            description="Tus datos personales, favoritas y notificaciones en un solo lugar."
            title="Perfil"
          />

          <SurfaceCard elevated style={styles.profileCard}>
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={theme.primary} />
                <ThemedText themeColor="textSecondary">Cargando tu perfil...</ThemedText>
              </View>
            ) : (
              <View style={[styles.profileHeader, isCompact ? styles.compactProfileHeader : null]}>
                <ProfileAvatar avatarUrl={profile?.avatarUrl ?? null} displayName={displayName} />
                <View style={styles.profileCopy}>
                  <ThemedText accessibilityRole="header" style={styles.profileName}>
                    {displayName}
                  </ThemedText>
                  {user.email ? (
                    <ThemedText selectable style={styles.profileDetail} themeColor="textSecondary">
                      {user.email}
                    </ThemedText>
                  ) : null}
                  {profile?.phone ? (
                    <ThemedText selectable style={styles.profileDetail} themeColor="textSecondary">
                      {profile.phone}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
            )}
          </SurfaceCard>

          {error ? (
            <View style={styles.messageGroup}>
              <StatusMessage message={error} />
              <ActionButton label="Reintentar" onPress={reload} variant="secondary" />
            </View>
          ) : null}

          <ProfileSection title="Mi cuenta">
            <SurfaceCard style={styles.listCard}>
              <ProfileNavigationRow
                description="Nombre, teléfono y foto de perfil"
                icon={{ ios: 'person', android: 'person', web: 'person' }}
                onPress={() => setIsEditing((currentValue) => !currentValue)}
                title="Datos personales"
              />
              <ProfileNavigationRow
                description="Tus barberías guardadas y tu favorita principal"
                icon={{ ios: 'heart', android: 'favorite', web: 'favorite' }}
                onPress={() => router.push('/favorites')}
                title="Favoritas"
              />
              <ProfileNavigationRow
                badgeCount={unreadNotificationCount}
                description="Reservas, pagos e invitaciones"
                icon={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
                onPress={() => router.push('/notifications')}
                title="Notificaciones"
              />
              <ProfileNavigationRow
                description="Solicitudes para trabajar o administrar"
                icon={{ ios: 'envelope', android: 'mail', web: 'mail' }}
                isLast
                onPress={() => router.push('/invitations')}
                title="Invitaciones"
              />
            </SurfaceCard>
          </ProfileSection>

          {isEditing && profile ? (
            <Animated.View
              entering={FadeIn.duration(Motion.state).reduceMotion(ReduceMotion.System)}
              exiting={FadeOut.duration(Motion.exit).reduceMotion(ReduceMotion.System)}
            >
              <SurfaceCard style={styles.editorCard}>
                <ProfilePersonalForm
                  onClose={() => setIsEditing(false)}
                  onSave={save}
                  profile={profile}
                />
              </SurfaceCard>
            </Animated.View>
          ) : null}

          {areSpacesLoading ? (
            <ProfileSection
              description="Estamos comprobando tus accesos adicionales."
              title="Mis espacios"
            >
              <SurfaceCard style={styles.loadingRow}>
                <ActivityIndicator color={theme.primary} />
                <ThemedText themeColor="textSecondary">Cargando espacios...</ThemedText>
              </SurfaceCard>
            </ProfileSection>
          ) : spacesError ? (
            <ProfileSection title="Mis espacios">
              <View style={styles.messageGroup}>
                <StatusMessage message={spacesError} />
                <ActionButton
                  label="Reintentar"
                  onPress={() => void reloadSpaces()}
                  variant="secondary"
                />
              </View>
            </ProfileSection>
          ) : spaces.length > 0 ? (
            <ProfileSection
              description="Tu cuenta puede conservar la experiencia cliente y entrar a estos espacios."
              title="Mis espacios"
            >
              <SurfaceCard style={styles.listCard}>
                {spaces.map((space, index) => (
                  <ProfileNavigationRow
                    description={space.description}
                    icon={
                      space.kind === 'barber'
                        ? { ios: 'scissors', android: 'content_cut', web: 'content_cut' }
                        : { ios: 'building.2', android: 'storefront', web: 'storefront' }
                    }
                    isLast={index === spaces.length - 1}
                    key={space.id}
                    onPress={() => router.push(space.href as Href)}
                    title={space.title}
                  />
                ))}
              </SurfaceCard>
            </ProfileSection>
          ) : null}

          <ProfileSection title="Cuenta">
            <SurfaceCard style={styles.listCard}>
              <ProfileNavigationRow
                accessibilityHint="Cierra la sesión en este dispositivo"
                icon={{
                  ios: 'rectangle.portrait.and.arrow.right',
                  android: 'logout',
                  web: 'logout',
                }}
                isLast
                isLoading={isSigningOut}
                onPress={() => void handleSignOut()}
                showsChevron={false}
                title="Cerrar sesión"
                tone="danger"
              />
            </SurfaceCard>
            {signOutError ? <StatusMessage message={signOutError} /> : null}
          </ProfileSection>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

export function ProfileHomeScreen() {
  const { user, signOut } = useAuth();

  if (!user) return <AuthLoadingScreen />;

  return <AuthenticatedProfileHome key={user.id} signOut={signOut} user={user} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.four,
    padding: Spacing.five,
    paddingBottom: Spacing.six,
  },
  compactContent: {
    gap: Spacing.four,
    padding: Spacing.three,
    paddingBottom: Spacing.five,
  },
  profileCard: {
    padding: Spacing.three,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  compactProfileHeader: {
    alignItems: 'flex-start',
  },
  profileCopy: {
    minWidth: 0,
    flex: 1,
    gap: Spacing.one,
  },
  profileName: {
    fontSize: TypeScale.headline,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  profileDetail: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
  section: {
    gap: Spacing.two,
  },
  sectionHeading: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  sectionTitle: {
    fontSize: TypeScale.body,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  sectionDescription: {
    maxWidth: 620,
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
  listCard: {
    overflow: 'hidden',
  },
  editorCard: {
    padding: Spacing.four,
  },
  loadingRow: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  messageGroup: {
    gap: Spacing.three,
  },
});
