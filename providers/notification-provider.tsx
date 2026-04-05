import {
  AppNotificationItem,
  NotificationService,
} from "@/lib/services/notification-service";
import { getStoredAuthUser } from "@/lib/utils/auth-user-store";
import { getAuth } from "@react-native-firebase/auth";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface NotificationContextType {
  notifications: AppNotificationItem[];
  unreadCount: number;
  loading: boolean;
  isLive: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (item: AppNotificationItem) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (item: AppNotificationItem) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationUserId, setNotificationUserId] = useState<string | null>(
    null,
  );

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications],
  );

  const resolveNotificationUserId = useCallback(async () => {
    const authUserId = getAuth().currentUser?.uid;
    if (authUserId) {
      setNotificationUserId((current) =>
        current === authUserId ? current : authUserId,
      );
      return authUserId;
    }

    const storedUser = await getStoredAuthUser();
    const storedId = storedUser?.id ?? null;
    setNotificationUserId((current) => (current === storedId ? current : storedId));
    return storedId;
  }, []);

  useEffect(() => {
    void resolveNotificationUserId();
  }, [resolveNotificationUserId]);

  useEffect(() => {
    const unsubscribeAuth = getAuth().onAuthStateChanged((firebaseUser) => {
      const nextId = firebaseUser?.uid ?? null;
      setNotificationUserId((current) => (current === nextId ? current : nextId));
    });

    return unsubscribeAuth;
  }, []);

  const refreshNotifications = useCallback(async () => {
    const userId = await resolveNotificationUserId();
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const items = await NotificationService.fetchUserNotificationsRealtimeOnly();
      setNotifications(items);
    } catch (error) {
      console.log("Realtime notification fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, [resolveNotificationUserId]);

  useEffect(() => {
    if (!notificationUserId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = NotificationService.subscribeToRealtimeNotificationItems(
      notificationUserId,
      (items) => {
        setNotifications(items);
        setLoading(false);
      },
      (error) => {
        console.log("Realtime notifications subscription failed:", error);
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [notificationUserId]);

  const markAsRead = useCallback(
    async (item: AppNotificationItem) => {
      if (!item.unread) return;

      const previousNotifications = notifications;
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === item.id
            ? { ...notification, unread: false }
            : notification,
        ),
      );

      try {
        await NotificationService.markAsRead(item.id);
      } catch (error) {
        console.log("Mark notification as read failed:", error);
        setNotifications(previousNotifications);
      }
    },
    [notifications],
  );

  const markAllAsRead = useCallback(async () => {
    if (unreadCount === 0) return;

    const previousNotifications = notifications;
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, unread: false })),
    );

    try {
      await NotificationService.markAllAsRead();
    } catch (error) {
      console.log("Mark all notifications as read failed:", error);
      setNotifications(previousNotifications);
    }
  }, [notifications, unreadCount]);

  const deleteNotification = useCallback(
    async (item: AppNotificationItem) => {
      const previousNotifications = notifications;
      setNotifications((current) =>
        current.filter((notification) => notification.id !== item.id),
      );

      try {
        await NotificationService.deleteNotification(item.id);
      } catch (error) {
        console.log("Delete notification failed:", error);
        setNotifications(previousNotifications);
      }
    },
    [notifications],
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        isLive: !!notificationUserId,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
