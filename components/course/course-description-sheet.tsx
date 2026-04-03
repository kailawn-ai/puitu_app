import { X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface CourseDescriptionSheetProps {
  visible: boolean;
  onClose: () => void;
  summary?: string | null;
  likesCount: number;
  viewsCount: number;
  createdAt?: string;
  onBuyCourse?: () => void;
}

export default function CourseDescriptionSheet({
  visible,
  onClose,
  summary,
  likesCount,
  viewsCount,
  createdAt,
  onBuyCourse,
}: CourseDescriptionSheetProps) {
  const [isMounted, setIsMounted] = useState(visible);
  const sheetTranslateY = useRef(new Animated.Value(520)).current;

  useEffect(() => {
    if (visible) {
      setIsMounted(true);

      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      return;
    }

    if (!isMounted) {
      return;
    }

    Animated.timing(sheetTranslateY, {
      toValue: 520,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsMounted(false);
    });
  }, [visible, isMounted, sheetTranslateY]);

  const requestClose = (): void => {
    Animated.timing(sheetTranslateY, {
      toValue: 520,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsMounted(false);
      onClose();
    });
  };

  const formatAgo = (dateValue?: string): string => {
    if (!dateValue) {
      return "Now";
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return "Now";
    }

    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);

    if (minutes < 1) {
      return "Now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={isMounted}
      animationType="none"
      onRequestClose={requestClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/45 dark:bg-black/65"
          onPress={requestClose}
        />

        <Animated.View
          style={{ transform: [{ translateY: sheetTranslateY }] }}
          className="bg-white dark:bg-[#111111] rounded-t-3xl max-h-[78%] px-5 pt-3 pb-8"
        >
          <View className="items-center mb-3">
            <View className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-500" />
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-zinc-900 dark:text-white text-3xl font-extrabold">
              Description
            </Text>
            <TouchableOpacity
              onPress={requestClose}
              className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center"
            >
              <X size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-zinc-800 dark:text-zinc-100 text-[19px] leading-8">
              {summary || "No description yet."}
            </Text>

            <View className="flex-row gap-3 mt-5">
              <View className="flex-1 bg-amber-100 dark:bg-[#301815] rounded-2xl p-4">
                <Text className="text-zinc-900 dark:text-white text-3xl font-extrabold">
                  {likesCount.toLocaleString()}
                </Text>
                <Text className="text-zinc-600 dark:text-zinc-300 mt-1">
                  Likes
                </Text>
              </View>

              <View className="flex-1 bg-amber-100 dark:bg-[#301815] rounded-2xl p-4">
                <Text className="text-zinc-900 dark:text-white text-3xl font-extrabold">
                  {viewsCount.toLocaleString()}
                </Text>
                <Text className="text-zinc-600 dark:text-zinc-300 mt-1">
                  Views
                </Text>
              </View>

              <View className="flex-1 bg-amber-100 dark:bg-[#301815] rounded-2xl p-4">
                <Text className="text-zinc-900 dark:text-white text-3xl font-extrabold">
                  {formatAgo(createdAt)}
                </Text>
                <Text className="text-zinc-600 dark:text-zinc-300 mt-1">
                  Ago
                </Text>
              </View>
            </View>

            {onBuyCourse ? (
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={onBuyCourse}
                className="mt-5 overflow-hidden rounded-3xl"
              >
                <LinearGradient
                  colors={["#16A34A", "#0F766E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="px-5 py-5"
                >
                  <Text className="text-[11px] font-bold uppercase tracking-[1.4px] text-emerald-50/85">
                    Premium Unlock
                  </Text>
                  <Text className="mt-2 text-2xl font-extrabold text-white">
                    Buy Whole Course
                  </Text>
                  <Text className="mt-1 text-sm leading-5 text-emerald-50/90">
                    Open the payment screen with full-course access selected first.
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
