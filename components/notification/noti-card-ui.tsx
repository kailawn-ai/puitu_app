import {
  BadgeCheck,
  BookOpenText,
  BriefcaseBusiness,
  CheckCheck,
  ChevronRight,
  LucideIcon,
  Trash2,
} from "lucide-react-native";
import React, { useMemo, useRef } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type NotificationKind = "course" | "job" | "general";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
  kind?: NotificationKind;
  unread?: boolean;
}

interface NotificationCardProps {
  item: NotificationItem;
  onPress?: (item: NotificationItem) => void;
  onDelete?: (item: NotificationItem) => void;
  onMarkAsRead?: (item: NotificationItem) => void;
}

const kindStyle: Record<
  NotificationKind,
  { icon: LucideIcon; iconColor: string; iconBg: string }
> = {
  course: {
    icon: BookOpenText,
    iconColor: "#2563EB",
    iconBg: "#DBEAFE",
  },
  job: {
    icon: BriefcaseBusiness,
    iconColor: "#B45309",
    iconBg: "#FEF3C7",
  },
  general: {
    icon: BadgeCheck,
    iconColor: "#0F766E",
    iconBg: "#CCFBF1",
  },
};

export default function NotificationCard({
  item,
  onPress,
  onDelete,
  onMarkAsRead,
}: NotificationCardProps) {
  const kind = item.kind ?? "general";
  const Icon = kindStyle[kind].icon;
  const translateX = useRef(new Animated.Value(0)).current;
  const currentOffset = useRef(0);
  const dragDistance = useRef(0);
  const maxLeft = -92;
  const maxRight = item.unread && onMarkAsRead ? 92 : 0;

  const animateTo = (value: number) => {
    currentOffset.current = value;
    Animated.spring(translateX, {
      toValue: value,
      useNativeDriver: true,
      bounciness: 6,
      speed: 18,
    }).start();
  };

  const closeActions = () => {
    animateTo(0);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 10 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderGrant: () => {
          translateX.stopAnimation((value) => {
            currentOffset.current = value;
          });
        },
        onPanResponderMove: (_, gestureState) => {
          dragDistance.current = gestureState.dx;
          const nextValue = Math.min(
            maxRight,
            Math.max(maxLeft, currentOffset.current + gestureState.dx),
          );
          translateX.setValue(nextValue);
        },
        onPanResponderRelease: (_, gestureState) => {
          dragDistance.current = gestureState.dx;
          const finalX = currentOffset.current + gestureState.dx;

          if (finalX <= -42 && onDelete) {
            animateTo(maxLeft);
            return;
          }

          if (finalX >= 42 && item.unread && onMarkAsRead) {
            animateTo(maxRight);
            return;
          }

          closeActions();
        },
        onPanResponderTerminate: closeActions,
      }),
    [item.unread, maxLeft, maxRight, onDelete, onMarkAsRead, translateX],
  );

  return (
    <View className="rounded-[22px] overflow-hidden">
      <View className="absolute inset-0 flex-row items-stretch justify-between">
        <View className="w-24">
          {item.unread && onMarkAsRead ? (
            <Pressable
              onPress={() => {
                onMarkAsRead(item);
                closeActions();
              }}
              className="flex-1 rounded-[22px] bg-emerald-500 items-center justify-center"
            >
              <CheckCheck size={18} color="#FFFFFF" />
              <Text className="mt-1 text-[11px] font-semibold text-white">
                Mark Read
              </Text>
            </Pressable>
          ) : (
            <View className="flex-1 rounded-[22px] bg-slate-100/70 dark:bg-secondary-800" />
          )}
        </View>

        <View className="w-24">
          {onDelete ? (
            <Pressable
              onPress={() => {
                onDelete(item);
                closeActions();
              }}
              className="flex-1 rounded-[22px] bg-rose-500 items-center justify-center"
            >
              <Trash2 size={18} color="#FFFFFF" />
              <Text className="mt-1 text-[11px] font-semibold text-white">
                Delete
              </Text>
            </Pressable>
          ) : (
            <View className="flex-1 rounded-[22px] bg-slate-100/70 dark:bg-secondary-800" />
          )}
        </View>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX }] }}
      >
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => {
            if (
              Math.abs(dragDistance.current) > 8 ||
              currentOffset.current !== 0
            ) {
              closeActions();
              return;
            }

            onPress?.(item);
          }}
          className={`rounded-[22px] px-4 py-3 border ${
            item.unread
              ? "bg-sky-50 border-sky-200 dark:bg-sky-950 dark:border-sky-800/70"
              : "bg-white border-slate-200 dark:bg-secondary-900 dark:border-secondary-700"
          }`}
        >
          <View className="flex-row items-start">
            <View
              className={`w-10 h-10 rounded-xl items-center justify-center mt-0.5 ${
                item.unread ? "ring-1 ring-sky-200 dark:ring-sky-800/70" : ""
              }`}
              style={{
                backgroundColor: item.unread
                  ? kindStyle[kind].iconBg
                  : kind === "course"
                    ? "#EFF6FF"
                    : kind === "job"
                      ? "#FFF7ED"
                      : "#F0FDFA",
              }}
            >
              <Icon size={18} color={kindStyle[kind].iconColor} />
            </View>

            <View className="flex-1 ml-3">
              <View className="flex-row items-center">
                <Text
                  numberOfLines={1}
                  className={`flex-1 text-[15px] ${
                    item.unread
                      ? "font-bold text-slate-950 dark:text-white"
                      : "font-semibold text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {item.title}
                </Text>
                {item.unread && (
                  <View className="ml-2 h-2.5 w-2.5 rounded-full bg-primary-500" />
                )}
              </View>

              <Text
                numberOfLines={2}
                className={`mt-1 text-[13px] leading-5 ${
                  item.unread
                    ? "text-slate-700 dark:text-slate-200"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {item.body}
              </Text>

              <View className="mt-2 flex-row items-center justify-between">
                <Text
                  className={`text-xs ${
                    item.unread
                      ? "font-semibold text-sky-700 dark:text-sky-300"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {item.unread ? "Unread" : "Read"} • {item.timeLabel}
                </Text>
                <ChevronRight
                  size={16}
                  color={item.unread ? "#0284C7" : "#94A3B8"}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
