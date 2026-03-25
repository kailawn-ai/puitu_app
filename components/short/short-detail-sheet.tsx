import { X } from "lucide-react-native";
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

interface ShortDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  creatorLabel: string;
  description?: string | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
}

export default function ShortDetailSheet({
  visible,
  onClose,
  title,
  creatorLabel,
  description,
  likesCount,
  commentsCount,
  sharesCount,
}: ShortDetailSheetProps) {
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

    if (!isMounted) return;

    Animated.timing(sheetTranslateY, {
      toValue: 520,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsMounted(false);
    });
  }, [visible, isMounted, sheetTranslateY]);

  const requestClose = () => {
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

  if (!isMounted) return null;

  return (
    <Modal
      transparent
      visible={isMounted}
      animationType="none"
      onRequestClose={requestClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/50"
          onPress={requestClose}
        />

        <Animated.View
          style={{ transform: [{ translateY: sheetTranslateY }] }}
          className="rounded-t-[32px] bg-[#111111] px-5 pb-8 pt-3"
        >
          <View className="mb-3 items-center">
            <View className="h-1.5 w-12 rounded-full bg-white/20" />
          </View>

          <View className="mb-4 flex-row items-start justify-between">
            <View className="mr-4 flex-1">
              <Text className="text-xs font-bold uppercase tracking-[1.5px] text-white/55">
                Short Details
              </Text>
              <Text className="mt-2 text-2xl font-extrabold text-white">
                {title}
              </Text>
              <Text className="mt-1 text-sm font-semibold text-white/70">
                {creatorLabel}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={requestClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
            >
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <Text className="text-xs font-bold uppercase tracking-[1.5px] text-white/55">
                Description
              </Text>
              <Text className="mt-3 text-[16px] leading-7 text-white/80">
                {description?.trim() || "No description yet."}
              </Text>
            </View>

            <View className="mt-4 flex-row gap-3">
              <View className="flex-1 rounded-[22px] border border-white/10 bg-[#1A1A1A] p-4">
                <Text className="text-2xl font-extrabold text-white">
                  {likesCount.toLocaleString()}
                </Text>
                <Text className="mt-1 text-sm font-medium text-white/60">
                  Likes
                </Text>
              </View>

              <View className="flex-1 rounded-[22px] border border-white/10 bg-[#1A1A1A] p-4">
                <Text className="text-2xl font-extrabold text-white">
                  {commentsCount.toLocaleString()}
                </Text>
                <Text className="mt-1 text-sm font-medium text-white/60">
                  Comments
                </Text>
              </View>

              <View className="flex-1 rounded-[22px] border border-white/10 bg-[#1A1A1A] p-4">
                <Text className="text-2xl font-extrabold text-white">
                  {sharesCount.toLocaleString()}
                </Text>
                <Text className="mt-1 text-sm font-medium text-white/60">
                  Shares
                </Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
