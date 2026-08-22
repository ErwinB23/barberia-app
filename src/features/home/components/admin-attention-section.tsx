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

import type { AdminAttentionItem, AdminAttentionState } from '../admin-home-domain';

type AttentionRouteMap = {
  pending_yape: string;
  pending_invitations: string;
  publication_readiness: string;
};

const ATTENTION_COPY = {
  pending_yape: {
    title: (count: number) =>
      `${count} ${count === 1 ? 'pago Yape pendiente' : 'pagos Yape pendientes'}`,
    description: 'Revisa la cita y confirma el pago cuando corresponda.',
    action: 'Revisar pagos',
    icon: { ios: 'creditcard', android: 'payments', web: 'payments' },
  },
  pending_invitations: {
    title: (count: number) =>
      `${count} ${count === 1 ? 'invitación pendiente' : 'invitaciones pendientes'}`,
    description: 'Comprueba el estado de las invitaciones enviadas al personal.',
    action: 'Ver invitaciones',
    icon: { ios: 'envelope', android: 'mail', web: 'mail' },
  },
  publication_readiness: {
    title: (count: number) =>
      `${count} ${count === 1 ? 'requisito pendiente' : 'requisitos pendientes'} para publicar`,
    description: 'Completa la preparación antes de intentar publicar la barbería.',
    action: 'Revisar preparación',
    icon: { ios: 'checklist', android: 'checklist', web: 'checklist' },
  },
} as const;

function AttentionRow({ item, href }: { item: AdminAttentionItem; href: string }) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);
  const copy = ATTENTION_COPY[item.kind];

  return (
    <Pressable
      accessibilityHint={copy.description}
      accessibilityLabel={`${copy.title(item.count)}. ${copy.action}`}
      accessibilityRole="link"
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={() => router.push(href as Href)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
          boxShadow: isFocused ? `0 0 0 2px ${theme.focus}` : undefined,
        },
        getPressedScaleStyle(pressed, reduceMotion, 0.992),
      ]}
    >
      <View style={[styles.icon, { backgroundColor: theme.warningSurface }]}>
        <AppIcon color={theme.warning} name={copy.icon} size={21} />
      </View>
      <View style={styles.copy}>
        <ThemedText style={styles.title}>{copy.title(item.count)}</ThemedText>
        <ThemedText style={styles.description} themeColor="textSecondary">
          {copy.description}
        </ThemedText>
        <ThemedText style={styles.action} themeColor="primary">
          {copy.action}
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

export function AdminAttentionSection({
  state,
  routes,
}: {
  state: AdminAttentionState;
  routes: AttentionRouteMap;
}) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
        Requiere tu atención
      </ThemedText>

      {state.items.length > 0 ? (
        <SurfaceCard style={styles.list}>
          {state.items.map((item, index) => (
            <View key={item.kind}>
              {index > 0 ? (
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
              ) : null}
              <AttentionRow href={routes[item.kind]} item={item} />
            </View>
          ))}
        </SurfaceCard>
      ) : null}

      {state.isAllClear ? (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.clearState, { backgroundColor: theme.successSurface }]}
        >
          <View style={[styles.clearIcon, { borderColor: theme.success }]}>
            <AppIcon
              color={theme.success}
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={18}
            />
          </View>
          <View style={styles.copy}>
            <ThemedText style={[styles.title, { color: theme.success }]}>Todo al día</ThemedText>
            <ThemedText style={styles.description}>
              No hay acciones operativas pendientes en este momento.
            </ThemedText>
          </View>
        </View>
      ) : null}

      {state.hasUnavailableData ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.unavailableState,
            { backgroundColor: theme.warningSurface, borderColor: theme.warning },
          ]}
        >
          <ThemedText style={[styles.unavailableTitle, { color: theme.warning }]}>
            Revisión parcial
          </ThemedText>
          <ThemedText style={styles.description}>
            No pudimos comprobar todas las tareas pendientes. Actualiza para intentarlo otra vez.
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '700', letterSpacing: -0.3 },
  list: { overflow: 'hidden' },
  row: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  icon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  copy: { minWidth: 0, flex: 1, gap: Spacing.one },
  title: { fontSize: TypeScale.body, fontWeight: '700', lineHeight: 22 },
  description: { fontSize: TypeScale.label, lineHeight: 20 },
  action: { fontSize: TypeScale.caption, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: Spacing.three },
  clearState: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
  clearIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  unavailableState: {
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
  unavailableTitle: { fontSize: TypeScale.label, fontWeight: '700' },
});
