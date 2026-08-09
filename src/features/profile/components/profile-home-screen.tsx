import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { getAuthErrorMessage } from '@/features/auth/auth-errors';
import { AuthLoadingScreen } from '@/features/auth/components/auth-loading-screen';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

type ProfileRowProps = {
  label: string;
  value: string;
  isLast?: boolean;
};

function ProfileRow({ label, value, isLast = false }: ProfileRowProps) {
  const theme = useTheme();

  return (
    <View style={[styles.row, isLast ? styles.rowLast : { borderBottomColor: theme.border }]}>
      <ThemedText style={styles.label} themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText selectable style={styles.value}>
        {value}
      </ThemedText>
    </View>
  );
}

type AuthenticatedProfileHomeProps = {
  user: User;
  signOut: () => Promise<void>;
};

function AuthenticatedProfileHome({ user, signOut }: AuthenticatedProfileHomeProps) {
  const { profile, isLoading, error, reload } = useProfile(user);
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

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
      <ScrollView
        contentContainerStyle={[
          styles.content,
          width < Layout.compactBreakpoint ? styles.compactContent : null,
        ]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headingRow}>
          <ScreenHeading
            compact={width < Layout.compactBreakpoint}
            description="Tu espacio personal está conectado y protegido. Aquí verás la información básica de tu cuenta."
            eyebrow="Cuenta"
            title="Tu perfil"
          />
          <View
            accessibilityLabel="Sesión activa"
            accessibilityRole="text"
            style={[styles.sessionBadge, { backgroundColor: theme.successSurface }]}
          >
            <View style={[styles.sessionDot, { backgroundColor: theme.success }]} />
            <ThemedText style={styles.sessionLabel} themeColor="success">
              Sesión activa
            </ThemedText>
          </View>
        </View>

        {error ? (
          <View style={styles.messageGroup}>
            <StatusMessage message={error} />
            <ActionButton label="Reintentar" onPress={reload} variant="secondary" />
          </View>
        ) : null}

        {isLoading ? (
          <SurfaceCard style={styles.loading}>
            <ActivityIndicator color={theme.primary} />
            <ThemedText themeColor="textSecondary">Cargando perfil…</ThemedText>
          </SurfaceCard>
        ) : null}

        {!isLoading && profile ? (
          <SurfaceCard style={styles.card}>
            <View style={styles.profileSummary}>
              <View style={[styles.avatar, { backgroundColor: theme.surfaceMuted }]}>
                <ThemedText style={styles.avatarLabel} themeColor="primary">
                  {(profile.fullName ?? user.email ?? 'B').trim().charAt(0).toUpperCase()}
                </ThemedText>
              </View>
              <View style={styles.profileSummaryText}>
                <ThemedText style={styles.profileName}>
                  {profile.fullName ?? 'Perfil personal'}
                </ThemedText>
                <ThemedText style={styles.profileCaption} themeColor="textSecondary">
                  Información de tu cuenta
                </ThemedText>
              </View>
            </View>
            <ProfileRow label="Nombre" value={profile.fullName ?? 'Sin nombre registrado'} />
            <ProfileRow label="Teléfono" value={profile.phone ?? 'No registrado'} />
            <ProfileRow isLast label="Correo" value={user.email ?? 'No disponible'} />
          </SurfaceCard>
        ) : null}

        <View style={styles.sessionActions}>
          <View style={styles.sessionActionsCopy}>
            <ThemedText style={styles.sessionActionsTitle}>Seguridad de la sesión</ThemedText>
            <ThemedText style={styles.sessionActionsDescription} themeColor="textSecondary">
              Cierra la sesión cuando termines de usar este dispositivo.
            </ThemedText>
          </View>
          {signOutError ? <StatusMessage message={signOutError} /> : null}
          <ActionButton
            isLoading={isSigningOut}
            label="Cerrar sesión"
            onPress={() => void handleSignOut()}
            variant="danger"
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

export function ProfileHomeScreen() {
  const { user, signOut } = useAuth();

  if (!user) {
    return <AuthLoadingScreen />;
  }

  return <AuthenticatedProfileHome key={user.id} signOut={signOut} user={user} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.five,
    padding: Spacing.five,
    paddingVertical: Spacing.six,
  },
  compactContent: {
    gap: Spacing.four,
    padding: Spacing.three,
    paddingVertical: Spacing.four,
  },
  headingRow: {
    gap: Spacing.three,
  },
  sessionBadge: {
    minHeight: 36,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  sessionLabel: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  card: {
    padding: Spacing.five,
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  avatar: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  avatarLabel: {
    fontSize: TypeScale.title,
    fontWeight: '800',
  },
  profileSummaryText: {
    flex: 1,
    gap: Spacing.one,
  },
  profileName: {
    fontSize: TypeScale.title,
    fontWeight: '700',
  },
  profileCaption: {
    fontSize: TypeScale.label,
  },
  row: {
    gap: Spacing.one,
    borderBottomWidth: 1,
    paddingVertical: Spacing.three,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
  value: {
    fontSize: TypeScale.body,
    lineHeight: 24,
  },
  loading: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.five,
  },
  messageGroup: {
    gap: Spacing.three,
  },
  sessionActions: {
    gap: Spacing.three,
    paddingTop: Spacing.one,
  },
  sessionActionsCopy: {
    gap: Spacing.one,
  },
  sessionActionsTitle: {
    fontSize: TypeScale.body,
    fontWeight: '700',
  },
  sessionActionsDescription: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
});
