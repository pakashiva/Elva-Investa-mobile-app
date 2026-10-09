import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus, StyleSheet, View } from 'react-native';
import { useAuth } from './AuthContext';
import NotificationToastBanner, {
  NotificationToastPayload,
} from '../components/NotificationToastBanner';
import { navigationRef } from '../navigation/navigationRef';
import {
  getNotificationsCreatedAfter,
  InvestorNotification,
} from '../services/notificationService';

const POLL_INTERVAL_MS = 8000;

type NotificationRealtimeContextValue = {
  /** Increments whenever a new notification arrives. */
  notificationTick: number;
};

const NotificationRealtimeContext =
  createContext<NotificationRealtimeContextValue>({ notificationTick: 0 });

export function useNotificationRealtime() {
  return useContext(NotificationRealtimeContext);
}

function toToast(item: InvestorNotification): NotificationToastPayload {
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    decision: item.decision,
    kind: item.kind,
  };
}

export function NotificationRealtimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const [toast, setToast] = useState<NotificationToastPayload | null>(null);
  const [notificationTick, setNotificationTick] = useState(0);

  const sinceIsoRef = useRef<string>(new Date().toISOString());
  const toastedIdsRef = useRef<Set<string>>(new Set());
  const pollingRef = useRef(false);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const openNotifications = useCallback(() => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Notifications');
    }
  }, []);

  const presentToast = useCallback((next: NotificationToastPayload) => {
    if (toastedIdsRef.current.has(next.id)) {
      return;
    }
    toastedIdsRef.current.add(next.id);
    setToast(next);
    setNotificationTick((n) => n + 1);
  }, []);

  const pollForNew = useCallback(async () => {
    if (!userId || pollingRef.current) {
      return;
    }
    pollingRef.current = true;
    try {
      const items = await getNotificationsCreatedAfter(
        userId,
        sinceIsoRef.current
      );
      if (items.length === 0) {
        return;
      }

      // Advance watermark to newest row so we don't re-fetch the same set.
      const newest = items[0];
      if (newest?.createdAt) {
        sinceIsoRef.current = newest.createdAt;
      }

      // Show the newest unseen notification.
      const unseen = items.find((item) => !toastedIdsRef.current.has(item.id));
      if (unseen) {
        presentToast(toToast(unseen));
      }
    } catch (error) {
      console.warn(
        'Notification poll:',
        error instanceof Error ? error.message : error
      );
    } finally {
      pollingRef.current = false;
    }
  }, [userId, presentToast]);

  // Reset listeners when the signed-in user changes.
  useEffect(() => {
    sinceIsoRef.current = new Date().toISOString();
    toastedIdsRef.current = new Set();
    setToast(null);

    if (!userId) {
      return;
    }

    void pollForNew();
    const intervalId = setInterval(() => {
      void pollForNew();
    }, POLL_INTERVAL_MS);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        void pollForNew();
      }
    };
    const appSub = AppState.addEventListener('change', onAppState);

    return () => {
      clearInterval(intervalId);
      appSub.remove();
    };
  }, [userId, presentToast, pollForNew]);

  const value = useMemo(
    () => ({ notificationTick }),
    [notificationTick]
  );

  return (
    <NotificationRealtimeContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        <NotificationToastBanner
          toast={toast}
          onDismiss={dismissToast}
          onPress={openNotifications}
        />
      </View>
    </NotificationRealtimeContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
