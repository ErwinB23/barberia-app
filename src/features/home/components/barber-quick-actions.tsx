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

type QuickAction = {
  href: string;
  icon: Parameters<typeof AppIcon>[0]['name'];
  label: string;
};

function BarberQuickActionRow({ action }: { action: QuickAction }) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="link"
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={() => router.push(action.href as Href)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
          boxShadow: isFocused ? `0 0 0 2px ${theme.focus}` : undefined,
        },
        getPressedScaleStyle(pressed, reduceMotion, 0.99),
      ]}
    >
      <View style={[styles.icon, { backgroundColor: theme.surfaceMuted }]}>
        <AppIcon color={theme.primary} name={action.icon} size={21} />
      </View>
      <ThemedText style={styles.label}>{action.label}</ThemedText>
      <AppIcon
        color={theme.textSecondary}
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={17}
      />
    </Pressable>
  );
}

export function BarberQuickActions({
  agendaHref,
  scheduleHref,
  newBlockHref,
  workspaceHref,
}: {
  agendaHref: string;
  scheduleHref: string;
  newBlockHref: string;
  workspaceHref: string;
}) {
  const theme = useTheme();
  const actions: QuickAction[] = [
    {
      href: agendaHref,
      icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
      label: 'Mi agenda',
    },
    {
      href: scheduleHref,
      icon: { ios: 'clock', android: 'schedule', web: 'schedule' },
      label: 'Mi horario',
    },
    {
      href: newBlockHref,
      icon: { ios: 'calendar.badge.minus', android: 'event_busy', web: 'event_busy' },
      label: 'Crear bloqueo',
    },
    {
      href: workspaceHref,
      icon: { ios: 'person.crop.circle', android: 'badge', web: 'badge' },
      label: 'Mi espacio',
    },
  ];

  return (
    <View style={styles.section}>
      <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
        Acciones rápidas
      </ThemedText>
      <SurfaceCard style={styles.card}>
        {actions.map((action, index) => (
          <View key={action.label}>
            {index > 0 ? (
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            ) : null}
            <BarberQuickActionRow action={action} />
          </View>
        ))}
      </SurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: TypeScale.title,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  card: {
    overflow: 'hidden',
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  label: {
    flex: 1,
    fontSize: TypeScale.body,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.three,
  },
});
