import { memo, useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import { markAllNotificationsRead, setNotificationReadState } from '../actions';
import { getNotificationErrorMessage } from '../errors';
import { useNotifications } from '../hooks/use-notifications';
import {
  countUnreadNotifications,
  getNotificationReadActions,
  getNotificationTypeLabel,
} from '../notifications-domain';
import type { UserNotification } from '../types';

const notificationDateFormatter = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatNotificationDate(value: string) {
  return notificationDateFormatter.format(new Date(value));
}

type NotificationCardProps = {
  notification: UserNotification;
  isMutating: boolean;
  onChangeReadState: (notification: UserNotification, isRead: boolean) => void;
};

const NotificationCard = memo(function NotificationCard({
  notification,
  isMutating,
  onChangeReadState,
}: NotificationCardProps) {
  const theme = useTheme();
  const actions = getNotificationReadActions(notification.isRead);

  return (
    <SurfaceCard
      accessibilityLabel={`${notification.isRead ? 'Leída' : 'No leída'}: ${notification.title}`}
      style={[styles.card, !notification.isRead ? { borderColor: theme.primary } : null]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeadingCopy}>
          <ThemedText style={styles.typeLabel} themeColor="primary">
            {getNotificationTypeLabel(notification.type)}
          </ThemedText>
          <ThemedText style={styles.cardTitle}>{notification.title}</ThemedText>
        </View>
        <View
          style={[
            styles.readBadge,
            { backgroundColor: notification.isRead ? theme.surfaceMuted : theme.primary },
          ]}
        >
          <ThemedText
            style={[styles.readBadgeText, !notification.isRead ? { color: theme.onPrimary } : null]}
          >
            {notification.isRead ? 'Leída' : 'Nueva'}
          </ThemedText>
        </View>
      </View>
      <ThemedText selectable style={styles.message} themeColor="textSecondary">
        {notification.message}
      </ThemedText>
      <ThemedText style={styles.date} themeColor="textSecondary">
        {formatNotificationDate(notification.createdAt)}
      </ThemedText>
      {notification.href ? (
        <ActionButton
          disabled={isMutating}
          label="Abrir detalle"
          onPress={() => router.push(notification.href as Href)}
          variant="secondary"
        />
      ) : null}
      {actions.canMarkRead ? (
        <ActionButton
          isLoading={isMutating}
          label="Marcar como leída"
          onPress={() => onChangeReadState(notification, true)}
          variant="secondary"
        />
      ) : null}
      {actions.canMarkUnread ? (
        <ActionButton
          isLoading={isMutating}
          label="Marcar como no leída"
          onPress={() => onChangeReadState(notification, false)}
          variant="secondary"
        />
      ) : null}
    </SurfaceCard>
  );
});

export function NotificationsScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const { notifications, isLoading, isRefreshing, error, reload } = useNotifications(
    user?.id ?? null,
  );
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const unreadCount = countUnreadNotifications(notifications);

  const changeReadState = useCallback(
    async (notification: UserNotification, isRead: boolean) => {
      if (!user) return;
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
    [reload, user],
  );

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
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
      />
    ),
    [changeReadState, mutatingId],
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Cargando notificaciones…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={notifications}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(notification) => notification.id}
        ListEmptyComponent={
          <SurfaceCard style={styles.emptyCard}>
            <ThemedText style={styles.cardTitle}>Todo al día</ThemedText>
            <ThemedText themeColor="textSecondary">
              Aquí aparecerán cambios de reservas, pagos e invitaciones generados por el backend.
            </ThemedText>
          </SurfaceCard>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              description="Consulta novedades de tu cuenta y conserva el mensaje original de cada evento."
              eyebrow="Actividad"
              title="Notificaciones"
            />
            <View style={[styles.counter, { backgroundColor: theme.surfaceMuted }]}>
              <ThemedText style={styles.counterValue}>{unreadCount}</ThemedText>
              <ThemedText themeColor="textSecondary">sin leer</ThemedText>
            </View>
            {unreadCount > 0 ? (
              <ActionButton
                isLoading={isMarkingAll}
                label="Marcar todas como leídas"
                onPress={() => void markAllRead()}
                variant="secondary"
              />
            ) : null}
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
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  content: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: { gap: Spacing.three, paddingBottom: Spacing.four },
  counter: {
    minHeight: 44,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
  },
  counterValue: { fontWeight: '800', fontVariant: ['tabular-nums'] },
  separator: { height: Spacing.three },
  card: { gap: Spacing.three, padding: Spacing.four },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  cardHeadingCopy: { flex: 1, gap: Spacing.one },
  typeLabel: { fontSize: TypeScale.caption, fontWeight: '800' },
  cardTitle: { fontSize: TypeScale.title, fontWeight: '700' },
  readBadge: {
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
  },
  readBadgeText: { fontSize: TypeScale.caption, fontWeight: '800' },
  message: { fontSize: TypeScale.body, lineHeight: 24 },
  date: { fontSize: TypeScale.caption },
  emptyCard: { gap: Spacing.two, padding: Spacing.four },
});
