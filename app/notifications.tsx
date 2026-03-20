import NotificationCard from "@/components/notification/noti-card-ui";
import { BackButton } from "@/components/ui/back-button";
import {
  AppNotificationItem,
  NotificationService,
} from "@/lib/services/notification-service";
import { getStoredAuthUser } from "@/lib/utils/auth-user-store";
import { useAlert } from "@/providers/alert-provider";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PAGE_SIZE = 20;

type NotificationListRow =
  | { type: "header"; id: string; label: string }
  | { type: "item"; id: string; item: AppNotificationItem };

const getDayLabel = (value?: string | null) => {
  if (!value) return "Earlier";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Earlier";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (today.getTime() - itemDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return itemDay.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      itemDay.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
};

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { showError, showWarning } = useAlert();

  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications],
  );

  const rows = useMemo<NotificationListRow[]>(() => {
    const items: NotificationListRow[] = [];
    let previousLabel = "";

    notifications.forEach((item) => {
      const label = getDayLabel(item.createdAt);

      if (label !== previousLabel) {
        items.push({
          type: "header",
          id: `header-${label}`,
          label,
        });
        previousLabel = label;
      }

      items.push({
        type: "item",
        id: item.id,
        item,
      });
    });

    return items;
  }, [notifications]);

  const syncRealtimeUnreadState = useCallback(async () => {
    const stored = await getStoredAuthUser();
    if (!stored?.id) return () => {};

    return NotificationService.subscribeToUserNotifications(
      stored.id,
      (items) => {
        setNotifications((current) => {
          if (!current.length) return current;

          const unreadMap = new Map(items.map((item) => [item.id, item.unread]));
          return current.map((item) =>
            unreadMap.has(item.id)
              ? { ...item, unread: unreadMap.get(item.id) }
              : item,
          );
        });
      },
      (error) => {
        console.log("Notifications realtime sync error:", error);
      },
    );
  }, []);

  const loadNotifications = useCallback(
    async (nextPage = 1, mode: "initial" | "refresh" | "append" = "initial") => {
      if (mode === "initial") {
        setLoadingInitial(true);
        setLoadError(null);
      } else if (mode === "refresh") {
        setRefreshing(true);
        setLoadError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await NotificationService.fetchUserNotificationsPage({
          page: nextPage,
          per_page: PAGE_SIZE,
        });

        setNotifications((current) =>
          nextPage === 1 ? response.data : [...current, ...response.data],
        );
        setPage(response.current_page);
        setLastPage(response.last_page);
      } catch (error: any) {
        const message =
          error?.data?.error ||
          error?.data?.message ||
          error?.message ||
          "Failed to load notifications.";

        if (nextPage === 1) {
          setLoadError(message);
        } else {
          showError("Unable to load more", message);
        }
      } finally {
        setLoadingInitial(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [showError],
  );

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.back();
        return true;
      },
    );

    return () => backHandler.remove();
  }, [router]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    let unsubscribe = () => {};

    syncRealtimeUnreadState().then((cleanup) => {
      unsubscribe = cleanup;
    });

    return () => {
      unsubscribe();
    };
  }, [syncRealtimeUnreadState]);

  const handleRefresh = useCallback(async () => {
    await loadNotifications(1, "refresh");
  }, [loadNotifications]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || loadingInitial || refreshing || page >= lastPage) return;
    await loadNotifications(page + 1, "append");
  }, [lastPage, loadNotifications, loadingInitial, loadingMore, page, refreshing]);

  const handlePressItem = useCallback(
    async (item: AppNotificationItem) => {
      const previousNotifications = notifications;

      try {
        if (item.unread) {
          setNotifications((current) =>
            current.map((notification) =>
              notification.id === item.id
                ? { ...notification, unread: false }
                : notification,
            ),
          );
          await NotificationService.markAsRead(item.id);
        }
      } catch (error) {
        console.log("Notification open mark as read failed:", error);
        setNotifications(previousNotifications);
      }

      if (item.route) {
        router.push(item.route as never);
      }
    },
    [notifications, router],
  );

  const handleMarkAsRead = useCallback(async (item: AppNotificationItem) => {
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
      console.log("Notification mark as read failed:", error);
      setNotifications(previousNotifications);
    }
  }, [notifications]);

  const performDelete = useCallback(async (item: AppNotificationItem) => {
    const previousNotifications = notifications;
    setNotifications((current) =>
      current.filter((notification) => notification.id !== item.id),
    );

    try {
      await NotificationService.deleteNotification(item.id);
    } catch (error) {
      console.log("Notification delete failed:", error);
      setNotifications(previousNotifications);
    }
  }, [notifications]);

  const handleDelete = useCallback((item: AppNotificationItem) => {
    showWarning(
      "Delete Notification",
      "Remove this notification from your history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void performDelete(item);
          },
        },
      ],
    );
  }, [performDelete, showWarning]);

  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0) return;

    const previousNotifications = notifications;
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, unread: false })),
    );

    try {
      await NotificationService.markAllAsRead();
    } catch (error) {
      console.log("Notification mark all as read failed:", error);
      setNotifications(previousNotifications);
    }
  }, [notifications, unreadCount]);

  const renderItem = ({ item }: { item: NotificationListRow }) => {
    if (item.type === "header") {
      return (
        <View className="px-5 pt-6 pb-3">
          <Text className="text-base font-bold text-slate-900 dark:text-white">
            {item.label}
          </Text>
        </View>
      );
    }

    return (
      <View className="px-5 pb-3">
        <NotificationCard
          item={item.item}
          onPress={(pressedItem) => void handlePressItem(pressedItem as AppNotificationItem)}
          onDelete={(pressedItem) => handleDelete(pressedItem as AppNotificationItem)}
          onMarkAsRead={(pressedItem) =>
            void handleMarkAsRead(pressedItem as AppNotificationItem)
          }
        />
      </View>
    );
  };

  return (
    <LinearGradient
      colors={isDark ? ["#09090b", "#171717"] : ["#F8FAFC", "#E2E8F0"]}
      locations={[0, 1]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}
    >
      <View
        className="px-5 flex-row items-center justify-between"
        style={{ paddingTop: insets.top + 8 }}
      >
        <BackButton onPress={() => router.back()} />
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          Notifications
        </Text>
        <TouchableOpacity
          onPress={() => void handleMarkAllRead()}
          className="rounded-full bg-white/80 px-3 py-2 dark:bg-secondary-800"
          disabled={unreadCount === 0}
        >
          <Text
            className={`text-xs font-semibold ${
              unreadCount === 0
                ? "text-slate-400 dark:text-slate-500"
                : "text-primary-500"
            }`}
          >
            Mark all
          </Text>
        </TouchableOpacity>
      </View>

      <View className="px-5 mt-4">
        <Text className="text-sm text-slate-500 dark:text-slate-400">
          {unreadCount > 0
            ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
            : "Everything is caught up"}
        </Text>
      </View>

      {loadingInitial ? (
        <View className="flex-1 items-center justify-center px-5">
          <ActivityIndicator size="small" color="#7A25FF" />
          <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Loading notifications...
          </Text>
        </View>
      ) : loadError ? (
        <View className="flex-1 justify-center px-5">
          <View className="rounded-[28px] border border-red-200 bg-white/90 px-5 py-6 dark:border-red-900/60 dark:bg-secondary-900/95">
            <Text className="text-lg font-semibold text-slate-900 dark:text-white">
              Unable to load notifications
            </Text>
            <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {loadError}
            </Text>

            <TouchableOpacity
              className="mt-5 items-center rounded-full bg-primary px-6 py-4"
              onPress={() => void loadNotifications(1, "initial")}
            >
              <Text className="text-base font-semibold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onEndReached={() => void handleLoadMore()}
          onEndReachedThreshold={0.35}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom + 24, 24),
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View className="px-5 pt-6">
              <View className="rounded-[28px] border border-dashed border-slate-300 bg-white/85 px-5 py-8 dark:border-secondary-700 dark:bg-secondary-900">
                <Text className="text-lg font-semibold text-slate-900 dark:text-white">
                  No notifications yet
                </Text>
                <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  When new updates arrive, they will show up here.
                </Text>
              </View>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="items-center py-5">
                <ActivityIndicator size="small" color="#7A25FF" />
              </View>
            ) : null
          }
        />
      )}
    </LinearGradient>
  );
}
