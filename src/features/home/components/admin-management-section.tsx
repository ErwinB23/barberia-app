import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

type ManagementLink = {
  href: string;
  icon: Parameters<typeof AppIcon>[0]['name'];
  label: string;
};

function PrimaryManagementLink({ link }: { link: ManagementLink }) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="link"
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={() => router.push(link.href as Href)}
      style={({ pressed }) => [
        styles.primaryLink,
        {
          backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
          borderColor: theme.border,
          boxShadow: isFocused ? `0 0 0 2px ${theme.focus}` : undefined,
        },
        getPressedScaleStyle(pressed, reduceMotion, 0.985),
      ]}
    >
      <View style={[styles.primaryIcon, { backgroundColor: theme.surfaceMuted }]}>
        <AppIcon color={theme.primary} name={link.icon} size={22} />
      </View>
      <ThemedText numberOfLines={2} style={styles.primaryLabel}>
        {link.label}
      </ThemedText>
      <AppIcon
        color={theme.textSecondary}
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={16}
      />
    </Pressable>
  );
}

function SecondaryManagementLink({ link }: { link: ManagementLink }) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="link"
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={() => router.push(link.href as Href)}
      style={({ pressed }) => [
        styles.secondaryLink,
        {
          backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
          boxShadow: isFocused ? `0 0 0 2px ${theme.focus}` : undefined,
        },
        getPressedScaleStyle(pressed, reduceMotion, 0.992),
      ]}
    >
      <AppIcon color={theme.textSecondary} name={link.icon} size={19} />
      <ThemedText style={styles.secondaryLabel}>{link.label}</ThemedText>
      <AppIcon
        color={theme.textSecondary}
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={16}
      />
    </Pressable>
  );
}

export function AdminManagementSection({
  routes,
}: {
  routes: {
    services: string;
    barbers: string;
    schedules: string;
    invitations: string;
    closures: string;
    edit: string;
    settings: string;
    paymentSettings: string;
  };
}) {
  const theme = useTheme();
  const primaryLinks: ManagementLink[] = [
    {
      href: routes.services,
      icon: { ios: 'scissors', android: 'content_cut', web: 'content_cut' },
      label: 'Servicios y estilos',
    },
    {
      href: routes.barbers,
      icon: { ios: 'person.2', android: 'groups', web: 'groups' },
      label: 'Barberos',
    },
    {
      href: routes.schedules,
      icon: { ios: 'clock', android: 'schedule', web: 'schedule' },
      label: 'Horarios',
    },
    {
      href: routes.invitations,
      icon: { ios: 'person.badge.plus', android: 'person_add', web: 'person_add' },
      label: 'Invitaciones',
    },
  ];
  const secondaryLinks: ManagementLink[] = [
    {
      href: routes.closures,
      icon: { ios: 'calendar.badge.minus', android: 'event_busy', web: 'event_busy' },
      label: 'Cierres excepcionales',
    },
    {
      href: routes.edit,
      icon: { ios: 'pencil', android: 'edit', web: 'edit' },
      label: 'Datos generales',
    },
    {
      href: routes.settings,
      icon: { ios: 'gearshape', android: 'settings', web: 'settings' },
      label: 'Ajustes',
    },
    {
      href: routes.paymentSettings,
      icon: { ios: 'creditcard', android: 'payments', web: 'payments' },
      label: 'Configuración Yape',
    },
  ];

  return (
    <View style={styles.section}>
      <View style={styles.headingCopy}>
        <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
          Gestión
        </ThemedText>
        <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
          Accesos directos para operar esta barbería.
        </ThemedText>
      </View>

      <View style={styles.primaryGrid}>
        {primaryLinks.map((link) => (
          <PrimaryManagementLink key={link.label} link={link} />
        ))}
      </View>

      <ThemedText style={styles.secondaryHeading} themeColor="textSecondary">
        Configuración
      </ThemedText>
      <SurfaceCard style={styles.secondaryList}>
        {secondaryLinks.map((link, index) => (
          <View key={link.label}>
            {index > 0 ? (
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            ) : null}
            <SecondaryManagementLink link={link} />
          </View>
        ))}
      </SurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
  headingCopy: { gap: Spacing.one },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '700', letterSpacing: -0.3 },
  sectionDescription: { fontSize: TypeScale.label, lineHeight: 20 },
  primaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  primaryLink: {
    minWidth: 144,
    minHeight: 88,
    flexBasis: '46%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
  primaryIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  primaryLabel: {
    minWidth: 0,
    flex: 1,
    fontSize: TypeScale.label,
    fontWeight: '700',
    lineHeight: 19,
  },
  secondaryHeading: { paddingTop: Spacing.one, fontSize: TypeScale.caption, fontWeight: '700' },
  secondaryList: { overflow: 'hidden' },
  secondaryLink: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  secondaryLabel: { minWidth: 0, flex: 1, fontSize: TypeScale.label, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: Spacing.three },
});
