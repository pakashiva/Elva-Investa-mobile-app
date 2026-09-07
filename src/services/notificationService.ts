import { supabase } from '../lib/supabase';
import {
  isMissingTableError,
  withJwtRetry,
} from '../utils/supabaseErrors';

export type InvestorNotification = {
  id: string;
  kind: 'investment' | 'withdrawal';
  title: string;
  body: string;
  decision: 'approved' | 'rejected';
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  decision: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
};

function mapRow(row: NotificationRow): InvestorNotification {
  return {
    id: row.id,
    kind: row.kind === 'withdrawal' ? 'withdrawal' : 'investment',
    title: row.title,
    body: row.body,
    decision: row.decision === 'rejected' ? 'rejected' : 'approved',
    referenceId: row.reference_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

async function fetchNotifications(
  userId: string
): Promise<InvestorNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(
      'id, kind, title, body, decision, reference_id, is_read, created_at'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []).map(mapRow);
}

async function fetchUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    if (isMissingTableError(error)) {
      return 0;
    }
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    if (isMissingTableError(error)) {
      return;
    }
    throw new Error(error.message);
  }
}

async function markOneRead(userId: string, notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('id', notificationId);

  if (error) {
    if (isMissingTableError(error)) {
      return;
    }
    throw new Error(error.message);
  }
}

export async function getInvestorNotifications(
  userId: string
): Promise<InvestorNotification[]> {
  return withJwtRetry(() => fetchNotifications(userId));
}

export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  return withJwtRetry(() => fetchUnreadCount(userId));
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  return withJwtRetry(() => markAllRead(userId));
}

export async function markNotificationRead(
  userId: string,
  notificationId: string
): Promise<void> {
  return withJwtRetry(() => markOneRead(userId, notificationId));
}

/** Notifications created after `sinceIso` (exclusive), newest first. */
export async function getNotificationsCreatedAfter(
  userId: string,
  sinceIso: string
): Promise<InvestorNotification[]> {
  return withJwtRetry(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select(
        'id, kind, title, body, decision, reference_id, is_read, created_at'
      )
      .eq('user_id', userId)
      .gt('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      if (isMissingTableError(error)) {
        return [];
      }
      throw new Error(error.message);
    }

    return (data ?? []).map(mapRow);
  });
}
