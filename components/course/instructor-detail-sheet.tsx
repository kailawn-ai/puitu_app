import { type User } from "@/lib/services/course-service";
import { Mail, Phone, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface InstructorDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  instructor?: User | null;
  createdAt?: string;
}

export default function InstructorDetailSheet({
  visible,
  onClose,
  instructor,
  createdAt,
}: InstructorDetailSheetProps) {
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

  const instructorName = instructor?.name?.trim() || "Unknown Instructor";
  const initials = instructorName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

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
              Instructor
            </Text>
            <TouchableOpacity
              onPress={requestClose}
              className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center"
            >
              <X size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="items-center mt-1 mb-5">
              <View className="w-20 h-20 rounded-full bg-amber-100 dark:bg-[#301815] items-center justify-center overflow-hidden">
                {instructor?.profile_image ? (
                  <Image
                    source={{ uri: instructor.profile_image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-zinc-900 dark:text-white text-2xl font-extrabold">
                    {initials || "IN"}
                  </Text>
                )}
              </View>

              <Text className="text-zinc-900 dark:text-white text-2xl font-bold mt-3 text-center">
                {instructorName}
              </Text>
            </View>

            <View className="flex-row gap-3 mb-5">
              <View className="flex-1 bg-amber-100 dark:bg-[#301815] rounded-2xl p-4">
                <Text className="text-zinc-900 dark:text-white text-2xl font-extrabold">
                  {formatAgo(createdAt)}
                </Text>
                <Text className="text-zinc-600 dark:text-zinc-300 mt-1">
                  Joined
                </Text>
              </View>
            </View>

            <View className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4">
              <Text className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Contact
              </Text>

              <View className="gap-3">
                <View className="flex-row items-center">
                  <Phone size={16} color="#6B7280" />
                  <Text className="text-zinc-800 dark:text-zinc-200 ml-2 text-base">
                    {instructor?.phone?.trim() || "Not available"}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Mail size={16} color="#6B7280" />
                  <Text className="text-zinc-800 dark:text-zinc-200 ml-2 text-base flex-1">
                    {instructor?.email?.trim() || "Not available"}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
