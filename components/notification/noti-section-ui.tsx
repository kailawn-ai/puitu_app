import NotificationCard, {
  NotificationItem,
} from "@/components/notification/noti-card-ui";
import { X } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface NotificationSectionProps {
  notifications: NotificationItem[];
  loading?: boolean;
  unreadCount?: number;
  isLive?: boolean;
  onClose: () => void;
  onPressItem?: (item: NotificationItem) => void;
  onMarkAllRead?: () => void;
  onDeleteItem?: (item: NotificationItem) => void;
  onMarkAsReadItem?: (item: NotificationItem) => void;
}

export default function NotificationSection({
  notifications,
  loading = false,
  unreadCount = 0,
  isLive = false,
  onClose,
  onPressItem,
  onMarkAllRead,
  onDeleteItem,
  onMarkAsReadItem,
}: NotificationSectionProps) {
  return (
    <View className="mx-5 mt-2 mb-3 rounded-3xl bg-white dark:bg-secondary-900 border border-slate-200 dark:border-secondary-700 shadow-lg">
      <View className="px-4 py-1 flex-row items-center justify-between border-b border-slate-100 dark:border-secondary-700">
        <View>
          <Text className="text-lg font-bold text-slate-900 dark:text-white">
            Notifications
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
              : isLive}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {!!notifications.length && unreadCount > 0 && (
            <TouchableOpacity
              onPress={onMarkAllRead}
              className="px-3 py-2 rounded-full bg-slate-100 dark:bg-secondary-800"
            >
              <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Mark all read
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 items-center justify-center rounded-full bg-slate-100 dark:bg-secondary-800"
          >
            <X size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="px-4 py-10 items-center justify-center">
          <ActivityIndicator size="small" color="#0EA5E9" />
          <Text className="text-slate-500 dark:text-slate-300 mt-3">
            Loading notifications...
          </Text>
        </View>
      ) : notifications.length === 0 ? (
        <View className="px-4 py-8 items-center justify-center">
          <Text className="text-slate-600 dark:text-slate-300 font-medium">
            No notifications yet
          </Text>
          <Text className="text-xs text-slate-400 mt-1">
            We will show new updates here.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="max-h-96"
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingVertical: 12,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              onPress={onPressItem}
              onDelete={onDeleteItem}
              onMarkAsRead={onMarkAsReadItem}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
