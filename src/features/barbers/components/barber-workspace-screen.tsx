import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, Stack, type Href } from 'expo-router';
import Animated, { FadeIn, FadeOut, ReduceMotion, useReducedMotion } from 'react-native-reanimated';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { ActionButton } from '@/shared/components/ui/action-button';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Motion, Radius, TypeScale } from '@/theme/tokens';

import { getBarberWorkspaceRoutes } from '../barber-domain';
import type { Barber, MembershipRole } from '../types';
import { BarberAvatar } from './barber-avatar';

type WorkspaceRowProps = {
  description: string;
  icon: Parameters<typeof AppIcon>[0]['name'];
  isLast?: boolean;
  onPress: () => void;
  title: string;
};

function WorkspaceRow({ description, icon, isLast = false, onPress, title }: WorkspaceRowProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Pressable
      accessibilityHint={description}
      accessibilityLabel={title}
      accessibilityRole="button"
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.navigationRow,
        !isLast ? { borderBottomColor: theme.border, borderBottomWidth: 1 } : null,
        pressed ? { backgroundColor: theme.surfaceMuted } : null,
        isFocused ? { boxShadow: `inset 0 0 0 2px ${theme.focus}` } : null,
        getPressedScaleStyle(pressed, reduceMotion, 0.99),
      ]}
    >
      <View style={[styles.navigationIcon, { backgroundColor: theme.surfaceMuted }]}>
        <AppIcon color={theme.primary} name={icon} size={21} />
      </View>
      <View style={styles.navigationCopy}>
        <ThemedText style={styles.navigationTitle}>{title}</ThemedText>
        <ThemedText style={styles.navigationDescription} themeColor="textSecondary">
          {description}
        </ThemedText>
      </View>
      <AppIcon
        color={theme.textSecondary}
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={17}
      />
    </Pressable>
  );
}

export function BarberWorkspaceScreen({
  barber,
  barbershopName,
  confirmingDeactivation,
  error,
  isDeactivating,
  isRefreshing,
  role,
  onCancelDeactivation,
  onConfirmDeactivation,
  onRefresh,
  onRequestDeactivation,
}: {
  barber: Barber;
  barbershopName: string | null;
  confirmingDeactivation: boolean;
  error: string | null;
  isDeactivating: boolean;
  isRefreshing: boolean;
  role: MembershipRole | null;
  onCancelDeactivation: () => void;
  onConfirmDeactivation: () => void;
  onRefresh: () => void;
  onRequestDeactivation: () => void;
}) {
  const theme = useTheme();
  const routes = getBarberWorkspaceRoutes(barber.barbershopId, barber.id);
  const mainItems = [
    {
      title: 'Perfil profesional',
      description: 'Nombre, presentación y foto pública',
      href: routes.profile,
      icon: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
    },
    {
      title: 'Servicios asignados',
      description: 'Consulta lo que puedes realizar',
      href: routes.services,
      icon: { ios: 'list.bullet.rectangle', android: 'design_services', web: 'design_services' },
    },
    {
      title: 'Mi horario',
      description: 'Organiza tus intervalos semanales',
      href: routes.schedule,
      icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
    },
    {
      title: 'Bloqueos',
      description: 'Registra ausencias excepcionales',
      href: routes.blocks,
      icon: { ios: 'calendar.badge.minus', android: 'event_busy', web: 'event_busy' },
    },
  ] as const;
  const secondaryItems = [
    {
      title: 'Inicio profesional',
      description: 'Vuelve al resumen de tu jornada',
      href: routes.professionalHome,
      icon: { ios: 'house', android: 'home', web: 'home' },
    },
    {
      title: 'Mi agenda',
      description: 'Consulta y opera tus citas',
      href: routes.agenda,
      icon: { ios: 'calendar.day.timeline.left', android: 'event_note', web: 'event_note' },
    },
    {
      title: 'Volver al espacio Cliente',
      description: 'Explora y gestiona tus reservas personales',
      href: routes.clientHome,
      icon: { ios: 'person', android: 'person', web: 'person' },
    },
  ] as const;

  return (
    <>
      <Stack.Screen options={{ title: 'Mi espacio' }} />
      <ThemedView style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              colors={[theme.primary]}
              onRefresh={onRefresh}
              refreshing={isRefreshing}
              tintColor={theme.primary}
            />
          }
        >
          <SurfaceCard elevated style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <BarberAvatar displayName={barber.displayName} photoUrl={barber.photoUrl} size={80} />
              <View style={styles.profileCopy}>
                <View style={styles.statusRow}>
                  <ThemedText style={styles.contextLabel} themeColor="textSecondary">
                    Mi espacio de barbero
                  </ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: theme.successSurface }]}>
                    <ThemedText style={[styles.statusLabel, { color: theme.success }]}>
                      Activo
                    </ThemedText>
                  </View>
                </View>
                <ThemedText accessibilityRole="header" selectable style={styles.profileName}>
                  {barber.displayName}
                </ThemedText>
                <View style={styles.barbershopRow}>
                  <AppIcon
                    color={theme.textSecondary}
                    name={{ ios: 'building.2', android: 'storefront', web: 'storefront' }}
                    size={17}
                  />
                  <ThemedText selectable style={styles.barbershopName} themeColor="textSecondary">
                    {barbershopName ?? 'Barbería actual'}
                  </ThemedText>
                </View>
              </View>
            </View>
            <ThemedText selectable style={styles.bio} themeColor="textSecondary">
              {barber.bio ??
                'Añade una breve presentación para que los clientes conozcan tu trabajo.'}
            </ThemedText>
          </SurfaceCard>

          {error ? <StatusMessage message={error} /> : null}

          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
                Actividad profesional
              </ThemedText>
              <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
                Gestiona únicamente tu operación dentro de esta barbería.
              </ThemedText>
            </View>
            <SurfaceCard style={styles.navigationCard}>
              {mainItems.map((item, index) => (
                <WorkspaceRow
                  description={item.description}
                  icon={item.icon}
                  isLast={index === mainItems.length - 1}
                  key={item.title}
                  onPress={() => router.push(item.href as Href)}
                  title={item.title}
                />
              ))}
            </SurfaceCard>
          </View>

          <View style={styles.section}>
            <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
              Cambiar de contexto
            </ThemedText>
            <SurfaceCard style={styles.navigationCard}>
              {secondaryItems.map((item, index) => (
                <WorkspaceRow
                  description={item.description}
                  icon={item.icon}
                  isLast={index === secondaryItems.length - 1 && role !== 'administrator'}
                  key={item.title}
                  onPress={() =>
                    item.href === routes.clientHome || item.href === routes.professionalHome
                      ? router.replace(item.href as Href)
                      : router.push(item.href as Href)
                  }
                  title={item.title}
                />
              ))}
              {role === 'administrator' ? (
                <WorkspaceRow
                  description="Abre la gestión separada de esta barbería"
                  icon={{
                    ios: 'building.2',
                    android: 'admin_panel_settings',
                    web: 'admin_panel_settings',
                  }}
                  isLast
                  onPress={() => router.push(routes.administration as Href)}
                  title="Administrar barbería"
                />
              ) : null}
            </SurfaceCard>
          </View>

          <View style={styles.section}>
            <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
              Estado profesional
            </ThemedText>
            <SurfaceCard style={styles.stateCard}>
              {confirmingDeactivation ? (
                <Animated.View
                  entering={FadeIn.duration(Motion.state).reduceMotion(ReduceMotion.System)}
                  exiting={FadeOut.duration(Motion.exit).reduceMotion(ReduceMotion.System)}
                  style={styles.deactivationConfirmation}
                >
                  <ThemedText style={styles.stateTitle}>¿Desactivar tu perfil?</ThemedText>
                  <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
                    No podrás operar como barbero. La acción será rechazada si tienes reservas
                    futuras activas.
                  </ThemedText>
                  <View style={styles.deactivationActions}>
                    <ActionButton
                      disabled={isDeactivating}
                      label="Cancelar"
                      onPress={onCancelDeactivation}
                      variant="secondary"
                    />
                    <ActionButton
                      isLoading={isDeactivating}
                      label="Sí, desactivar perfil"
                      onPress={onConfirmDeactivation}
                      variant="danger"
                    />
                  </View>
                </Animated.View>
              ) : (
                <ActionButton
                  label="Desactivar mi perfil de barbero"
                  onPress={onRequestDeactivation}
                  size="compact"
                  variant="danger"
                />
              )}
            </SurfaceCard>
          </View>
        </ScrollView>
      </ThemedView>
    </>
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
  profileCard: { gap: Spacing.three, padding: Spacing.four },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  profileCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  statusRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two },
  contextLabel: { flex: 1, fontSize: TypeScale.caption, lineHeight: 18 },
  statusBadge: { borderRadius: Radius.pill, paddingHorizontal: Spacing.two, paddingVertical: 3 },
  statusLabel: { fontSize: TypeScale.caption, fontWeight: '800' },
  profileName: { fontSize: TypeScale.headline, fontWeight: '800', lineHeight: 36 },
  barbershopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  barbershopName: { minWidth: 0, flex: 1, fontSize: TypeScale.label, lineHeight: 21 },
  bio: { fontSize: TypeScale.body, lineHeight: 24 },
  section: { gap: Spacing.two },
  sectionHeading: { gap: Spacing.one, paddingHorizontal: Spacing.one },
  sectionTitle: { fontSize: TypeScale.body, fontWeight: '800', lineHeight: 23 },
  sectionDescription: { fontSize: TypeScale.label, lineHeight: 21 },
  navigationCard: { overflow: 'hidden' },
  navigationRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  navigationIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  navigationCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  navigationTitle: { fontSize: TypeScale.body, fontWeight: '700', lineHeight: 22 },
  navigationDescription: { fontSize: TypeScale.caption, lineHeight: 18 },
  stateCard: { gap: Spacing.three, padding: Spacing.three },
  stateTitle: { fontSize: TypeScale.body, fontWeight: '800' },
  deactivationConfirmation: { gap: Spacing.three },
  deactivationActions: { gap: Spacing.two },
});
