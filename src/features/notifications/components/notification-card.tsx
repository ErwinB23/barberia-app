import { memo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion, useReducedMotion } from 'react-native-reanimated';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Motion, Radius, TypeScale } from '@/theme/tokens';

import {
  getNotificationPresentation,
  getNotificationReadActions,
  type NotificationPresentationKind,
} from '../notifications-domain';
import type { UserNotification } from '../types';

const notificationDateFormatter = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatNotificationDate(value: string) {
  return notificationDateFormatter.format(new Date(value));
}

function getNotificationIcon(kind: NotificationPresentationKind) {
  if (kind === 'payment') {
    return { ios: 'creditcard', android: 'credit_card', web: 'credit_card' } as const;
  }
  if (kind === 'invitation') {
    return { ios: 'envelope', android: 'mail', web: 'mail' } as const;
  }
  if (kind === 'reminder') {
    return { ios: 'bell', android: 'notifications', web: 'notifications' } as const;
  }
  if (kind === 'reservation') {
    return { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' } as const;
  }
  return { ios: 'bell', android: 'notifications', web: 'notifications' } as const;
}

type CompactMenuActionProps = {
  icon: Parameters<typeof AppIcon>[0]['name'];
  isDestructive?: boolean;
  label: string;
  onPress: () => void;
};

function CompactMenuAction({
  icon,
  isDestructive = false,
  label,
  onPress,
}: CompactMenuActionProps) {
  const theme = useTheme();
  const foreground = isDestructive ? theme.danger : theme.text;

  return (
    <Pressable
      accessibilityRole="menuitem"
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuAction,
        pressed ? { backgroundColor: theme.surfaceMuted } : null,
      ]}
    >
      <AppIcon color={foreground} name={icon} size={19} />
      <ThemedText style={[styles.menuActionLabel, { color: foreground }]}>{label}</ThemedText>
    </Pressable>
  );
}

type NotificationCardProps = {
  notification: UserNotification;
  isMutating: boolean;
  onChangeReadState: (notification: UserNotification, isRead: boolean) => void;
  onDismiss: (notification: UserNotification) => void;
  onOpenDetail: (notification: UserNotification) => void;
};

export const NotificationCard = memo(function NotificationCard({
  notification,
  isMutating,
  onChangeReadState,
  onDismiss,
  onOpenDetail,
}: NotificationCardProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const actions = getNotificationReadActions(notification.isRead);
  const presentation = getNotificationPresentation(notification);

  const runAndClose = (action: () => void) => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <SurfaceCard
      accessibilityLabel={`${notification.isRead ? 'Leída' : 'No leída'}: ${notification.title}`}
      style={[styles.card, !notification.isRead ? { borderColor: theme.primary } : null]}
    >
      <View style={styles.header}>
        <View style={[styles.iconShell, { backgroundColor: theme.surfaceMuted }]}>
          <AppIcon color={theme.primary} name={getNotificationIcon(presentation.kind)} size={22} />
        </View>
        <View style={styles.headingCopy}>
          <View style={styles.typeRow}>
            <ThemedText style={styles.typeLabel} themeColor="primary">
              {presentation.label}
            </ThemedText>
            {!notification.isRead ? (
              <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                <ThemedText style={[styles.unreadBadgeText, { color: theme.onPrimary }]}>
                  Nueva
                </ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText accessibilityRole="header" style={styles.title}>
            {notification.title}
          </ThemedText>
        </View>
        <Pressable
          accessibilityHint="Muestra acciones de lectura y eliminación"
          accessibilityLabel={`Más opciones para ${notification.title}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: isMenuOpen, disabled: isMutating }}
          disabled={isMutating}
          onPress={() => setIsMenuOpen((currentValue) => !currentValue)}
          style={({ pressed }) => [
            styles.menuButton,
            pressed ? { backgroundColor: theme.surfaceMuted } : null,
          ]}
        >
          {isMutating ? (
            <ActivityIndicator color={theme.textSecondary} size="small" />
          ) : (
            <AppIcon
              color={theme.textSecondary}
              name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }}
              size={22}
            />
          )}
        </Pressable>
      </View>

      <ThemedText selectable style={styles.message} themeColor="textSecondary">
        {notification.message}
      </ThemedText>

      <View style={styles.metadata}>
        <ThemedText style={styles.date} themeColor="textSecondary">
          {formatNotificationDate(notification.createdAt)}
        </ThemedText>
        {presentation.contextLabel ? (
          <ThemedText style={styles.context} themeColor="textSecondary">
            {presentation.contextLabel}
          </ThemedText>
        ) : null}
      </View>

      {notification.href ? (
        <Pressable
          accessibilityHint="Abre el contenido relacionado y marca esta notificación como leída"
          accessibilityRole="button"
          accessibilityState={{ disabled: isMutating }}
          disabled={isMutating}
          onPress={() => runAndClose(() => onOpenDetail(notification))}
          style={({ pressed }) => [
            styles.openAction,
            {
              backgroundColor: pressed ? theme.primaryPressed : theme.primary,
            },
            getPressedScaleStyle(pressed, reduceMotion, 0.985),
          ]}
        >
          <ThemedText style={[styles.openActionLabel, { color: theme.onPrimary }]}>
            Abrir detalle
          </ThemedText>
          <AppIcon
            color={theme.onPrimary}
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={17}
          />
        </Pressable>
      ) : null}

      {isMenuOpen ? (
        <Animated.View
          accessibilityRole="menu"
          entering={FadeIn.duration(Motion.state).reduceMotion(ReduceMotion.System)}
          exiting={FadeOut.duration(Motion.exit).reduceMotion(ReduceMotion.System)}
          style={[styles.menu, { borderColor: theme.border }]}
        >
          {actions.canMarkRead ? (
            <CompactMenuAction
              icon={{ ios: 'envelope.open', android: 'mark_email_read', web: 'mark_email_read' }}
              label="Marcar como leída"
              onPress={() => runAndClose(() => onChangeReadState(notification, true))}
            />
          ) : null}
          {actions.canMarkUnread ? (
            <CompactMenuAction
              icon={{
                ios: 'envelope.badge',
                android: 'mark_email_unread',
                web: 'mark_email_unread',
              }}
              label="Marcar como no leída"
              onPress={() => runAndClose(() => onChangeReadState(notification, false))}
            />
          ) : null}
          <CompactMenuAction
            icon={{ ios: 'trash', android: 'delete', web: 'delete' }}
            isDestructive
            label="Eliminar notificación"
            onPress={() => runAndClose(() => onDismiss(notification))}
          />
        </Animated.View>
      ) : null}
    </SurfaceCard>
  );
});

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  iconShell: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  headingCopy: {
    minWidth: 0,
    flex: 1,
    gap: Spacing.one,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  typeLabel: {
    fontSize: TypeScale.caption,
    fontWeight: '800',
  },
  unreadBadge: {
    minHeight: 22,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
  },
  unreadBadgeText: {
    fontSize: TypeScale.caption - 1,
    fontWeight: '800',
  },
  title: {
    fontSize: TypeScale.body,
    fontWeight: '700',
    lineHeight: 23,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  message: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  date: {
    fontSize: TypeScale.caption,
    fontVariant: ['tabular-nums'],
  },
  context: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
  openAction: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
  },
  openActionLabel: {
    fontSize: TypeScale.label,
    fontWeight: '800',
  },
  menu: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  menuAction: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  menuActionLabel: {
    flex: 1,
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
});
