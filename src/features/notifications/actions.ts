import { supabase } from '@/infrastructure/supabase/client';

export async function setNotificationReadState(
  userId: string,
  notificationId: string,
  isRead: boolean,
) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: isRead, read_at: isRead ? new Date().toISOString() : null })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .is('dismissed_at', null)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Notification not found');
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false)
    .is('dismissed_at', null);

  if (error) throw error;
}

export async function dismissNotification(notificationId: string) {
  const { data, error } = await supabase.rpc('dismiss_notification', {
    p_notification_id: notificationId,
  });

  if (error) throw error;
  if (!data) throw new Error('Notification not found');
}
