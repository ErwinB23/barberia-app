import type { UserNotification } from './types';

type ReadStateNotification = Pick<UserNotification, 'id' | 'isRead' | 'readAt'>;

type OpenNotificationDetailInput = {
  notification: Pick<UserNotification, 'id' | 'href' | 'isRead'>;
  markRead: () => Promise<void>;
  navigate: (href: string) => void;
  onReadError: (error: unknown) => void;
  setLocalReadState: (isRead: boolean) => void;
};

export type OpenNotificationDetailResult =
  'already-read' | 'marked-read' | 'no-destination' | 'read-failed';

export function setNotificationReadStateLocally<T extends ReadStateNotification>(
  notifications: readonly T[],
  notificationId: string,
  isRead: boolean,
  readAt = isRead ? new Date().toISOString() : null,
): T[] {
  return notifications.map((notification) =>
    notification.id === notificationId
      ? { ...notification, isRead, readAt: isRead ? readAt : null }
      : notification,
  );
}

export async function openNotificationDetail({
  notification,
  markRead,
  navigate,
  onReadError,
  setLocalReadState,
}: OpenNotificationDetailInput): Promise<OpenNotificationDetailResult> {
  if (!notification.href) return 'no-destination';

  if (notification.isRead) {
    navigate(notification.href);
    return 'already-read';
  }

  setLocalReadState(true);

  let readRequest: Promise<void>;
  try {
    readRequest = markRead();
  } catch (error) {
    setLocalReadState(false);
    onReadError(error);
    navigate(notification.href);
    return 'read-failed';
  }

  navigate(notification.href);

  try {
    await readRequest;
    return 'marked-read';
  } catch (error) {
    setLocalReadState(false);
    onReadError(error);
    return 'read-failed';
  }
}
