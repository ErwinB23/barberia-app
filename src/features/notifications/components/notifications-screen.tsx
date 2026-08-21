import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import {
  dismissNotification,
  markAllNotificationsRead,
  setNotificationReadState,
} from '../actions';
import { getNotificationErrorMessage } from '../errors';
import { useNotifications } from '../hooks/use-notifications';
import { openNotificationDetail } from '../notification-open-flow';
import {
  countUnreadNotifications,
  excludeNotificationsById,
  NOTIFICATIONS_EMPTY_STATE,
} from '../notifications-domain';
import type { UserNotification } from '../types';
import { NotificationCard } from './notification-card';

function NotificationsLoadingState() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.screen}>
      <View
        accessibilityLabel="Cargando notificaciones"
        accessibilityRole="progressbar"
        style={styles.loadingContent}
      >
        <ScreenHeading
          description="Tus novedades importantes, en un solo lugar."
          title="Notificaciones"
        />
        <SurfaceCard style={styles.loadingCard}>
          <View style={[styles.loadingIcon, { backgroundColor: theme.surfaceMuted }]} />
          <View style={styles.loadingCopy}>
            <View style={[styles.loadingTitle, { backgroundColor: theme.surfaceMuted }]} />
            <View style={[styles.loadingLine, { backgroundColor: theme.surfaceMuted }]} />
            <View style={[styles.loadingLineShort, { backgroundColor: theme.surfaceMuted }]} />
          </View>
        </SurfaceCard>
        <SurfaceCard style={styles.loadingCard}>
          <View style={[styles.loadingIcon, { backgroundColor: theme.surfaceMuted }]} />
          <View style={styles.loadingCopy}>
            <View style={[styles.loadingTitle, { backgroundColor: theme.surfaceMuted }]} />
            <View style={[styles.loadingLine, { backgroundColor: theme.surfaceMuted }]} />
          </View>
        </SurfaceCard>
      </View>
    </ThemedView>
  );
}

export function NotificationsScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const { notifications, isLoading, isRefreshing, error, reload, updateReadStateLocally } =
    useNotifications(user?.id ?? null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const dismissingIdsRef = useRef(new Set<string>());
  const openingIdsRef = useRef(new Set<string>());
  const visibleNotifications = useMemo(
    () => excludeNotificationsById(notifications, dismissedIds),
    [dismissedIds, notifications],
  );
  const unreadCount = countUnreadNotifications(visibleNotifications);

  const changeReadState = useCallback(
    async (notification: UserNotification, isRead: boolean) => {
      if (!user || mutatingId) return;
      setMutatingId(notification.id);
      setMutationError(null);
      setFeedback(null);
      try {
        await setNotificationReadState(user.id, notification.id, isRead);
        setFeedback(
          isRead ? 'Notificación marcada como leída.' : 'Notificación marcada como nueva.',
        );
        await reload();
      } catch (operationError) {
        setMutationError(getNotificationErrorMessage(operationError));
      } finally {
        setMutatingId(null);
      }
    },
    [mutatingId, reload, user],
  );

  const dismiss = useCallback(
    async (notification: UserNotification) => {
      if (!user || mutatingId || dismissingIdsRef.current.has(notification.id)) return;

      dismissingIdsRef.current.add(notification.id);
      setMutatingId(notification.id);
      setMutationError(null);
      setFeedback(null);
      setDismissedIds((currentIds) => new Set(currentIds).add(notification.id));

      try {
        await dismissNotification(notification.id);
        setFeedback('Notificación eliminada de tu centro.');
        await reload();
      } catch (operationError) {
        setDismissedIds((currentIds) => {
          const restoredIds = new Set(currentIds);
          restoredIds.delete(notification.id);
          return restoredIds;
        });
        setMutationError(getNotificationErrorMessage(operationError));
      } finally {
        dismissingIdsRef.current.delete(notification.id);
        setMutatingId(null);
      }
    },
    [mutatingId, reload, user],
  );

  const openDetail = useCallback(
    async (notification: UserNotification) => {
      if (!user || !notification.href || mutatingId || openingIdsRef.current.has(notification.id)) {
        return;
      }

      openingIdsRef.current.add(notification.id);
      setMutatingId(notification.id);
      setMutationError(null);
      setFeedback(null);

      try {
        const result = await openNotificationDetail({
          notification,
          markRead: () => setNotificationReadState(user.id, notification.id, true),
          navigate: (href) => router.push(href as Href),
          onReadError: (operationError) => {
            setMutationError(getNotificationErrorMessage(operationError));
          },
          setLocalReadState: (isRead) => {
            updateReadStateLocally(notification.id, isRead);
          },
        });

        if (result === 'marked-read') await reload();
      } catch (operationError) {
        setMutationError(getNotificationErrorMessage(operationError));
      } finally {
        openingIdsRef.current.delete(notification.id);
        setMutatingId(null);
      }
    },
    [mutatingId, reload, updateReadStateLocally, user],
  );

  const markAllRead = async () => {
    if (!user || unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    setMutationError(null);
    setFeedback(null);
    try {
      await markAllNotificationsRead(user.id);
      setFeedback('Todas tus notificaciones quedaron marcadas como leídas.');
      await reload();
    } catch (operationError) {
      setMutationError(getNotificationErrorMessage(operationError));
    } finally {
      setIsMarkingAll(false);
    }
  };

  const renderNotification = useCallback(
    ({ item }: { item: UserNotification }) => (
      <NotificationCard
        isMutating={mutatingId === item.id}
        notification={item}
        onChangeReadState={(notification, isRead) => void changeReadState(notification, isRead)}
        onDismiss={(notification) => void dismiss(notification)}
        onOpenDetail={(notification) => void openDetail(notification)}
      />
    ),
    [changeReadState, dismiss, mutatingId, openDetail],
  );

  if (isLoading) return <NotificationsLoadingState />;

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={visibleNotifications}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(notification) => notification.id}
        ListEmptyComponent={
          <SurfaceCard style={styles.emptyCard}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceMuted }]}>
              <AppIcon
                color={theme.primary}
                name={{ ios: 'bell.slash', android: 'notifications_off', web: 'notifications_off' }}
                size={28}
              />
            </View>
            <View style={styles.emptyCopy}>
              <ThemedText accessibilityRole="header" style={styles.emptyTitle}>
                {NOTIFICATIONS_EMPTY_STATE.title}
              </ThemedText>
              <ThemedText style={styles.emptyDescription} themeColor="textSecondary">
                {NOTIFICATIONS_EMPTY_STATE.description}
              </ThemedText>
            </View>
          </SurfaceCard>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              description="Tus novedades importantes, en un solo lugar."
              title="Notificaciones"
            />
            <View style={styles.summaryRow}>
              <View style={[styles.counter, { backgroundColor: theme.surfaceMuted }]}>
                <ThemedText style={styles.counterValue}>{unreadCount}</ThemedText>
                <ThemedText style={styles.counterLabel} themeColor="textSecondary">
                  sin leer
                </ThemedText>
              </View>
              {unreadCount > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ busy: isMarkingAll, disabled: isMarkingAll }}
                  disabled={isMarkingAll}
                  onPress={() => void markAllRead()}
                  style={({ pressed }) => [
                    styles.markAllAction,
                    pressed ? { backgroundColor: theme.surfaceMuted } : null,
                  ]}
                >
                  {isMarkingAll ? <ActivityIndicator color={theme.primary} size="small" /> : null}
                  <ThemedText style={styles.markAllLabel} themeColor="primary">
                    Marcar todo como leído
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
            {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
            {error || mutationError ? <StatusMessage message={mutationError ?? error!} /> : null}
          </View>
        }
        refreshControl={
          <RefreshControl
            colors={[theme.primary]}
            onRefresh={() => void reload()}
            refreshing={isRefreshing}
            tintColor={theme.primary}
          />
        }
        renderItem={renderNotification}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: Layout.feedMaxWidth,
    flexGrow: 1,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  loadingContent: {
    width: '100%',
    maxWidth: Layout.feedMaxWidth,
    alignSelf: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
  },
  loadingCard: {
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  loadingIcon: { width: 40, height: 40, borderRadius: Radius.medium },
  loadingCopy: { flex: 1, gap: Spacing.two },
  loadingTitle: { width: '56%', height: 20, borderRadius: Radius.small },
  loadingLine: { width: '100%', height: 14, borderRadius: Radius.small },
  loadingLineShort: { width: '74%', height: 14, borderRadius: Radius.small },
  header: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  summaryRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  counter: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
  },
  counterValue: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  counterLabel: {
    fontSize: TypeScale.label,
  },
  markAllAction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
  },
  markAllLabel: {
    fontSize: TypeScale.label,
    fontWeight: '800',
  },
  separator: {
    height: Spacing.three,
  },
  emptyCard: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  emptyCopy: {
    maxWidth: 440,
    gap: Spacing.one,
  },
  emptyTitle: {
    fontSize: TypeScale.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: TypeScale.body,
    lineHeight: 24,
    textAlign: 'center',
  },
});
