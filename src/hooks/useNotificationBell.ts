import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationRealtime } from '../contexts/NotificationRealtimeContext';
import { navigationRef } from '../navigation/navigationRef';
import { getUnreadNotificationCount } from '../services/notificationService';
import { isMissingTableError } from '../utils/supabaseErrors';

export function useNotificationBell() {
  const { session } = useAuth();
  const { notificationTick } = useNotificationRealtime();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await getUnreadNotificationCount(userId);
      setUnreadCount(count);
    } catch (error) {
      if (isMissingTableError(error)) {
        setUnreadCount(0);
        return;
      }
      console.warn(
        'Unread notifications:',
        error instanceof Error ? error.message : error
      );
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      refreshUnread();
    }, [refreshUnread])
  );

  useEffect(() => {
    if (notificationTick > 0) {
      refreshUnread();
    }
  }, [notificationTick, refreshUnread]);

  const openNotifications = useCallback(() => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Notifications');
    }
  }, []);

  return {
    unreadCount,
    hasUnread: unreadCount > 0,
    openNotifications,
    refreshUnread,
  };
}
