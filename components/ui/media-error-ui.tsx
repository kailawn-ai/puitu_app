import { AlertTriangle, RotateCcw, ShoppingCart, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface MediaErrorUIProps {
  visible: boolean;
  title?: string;
  message?: string | null;
  onClose: () => void;
  onRetry?: () => void;
  onBuy?: () => void;
  buyLabel?: string;
}

export default function MediaErrorUI({
  visible,
  title = "Something went wrong",
  message,
  onClose,
  onRetry,
  onBuy,
  buyLabel = "Buy this content",
}: MediaErrorUIProps) {
  const [isMounted, setIsMounted] = useState(visible);
  const sheetTranslateY = useRef(new Animated.Value(420)).current;

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
      toValue: 420,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setIsMounted(false));
  }, [visible, isMounted, sheetTranslateY]);

  const requestClose = () => {
    Animated.timing(sheetTranslateY, {
      toValue: 420,
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
    <Modal transparent visible={isMounted} animationType="none" onRequestClose={requestClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/45 dark:bg-black/65" onPress={requestClose} />

        <Animated.View
          style={{ transform: [{ translateY: sheetTranslateY }] }}
          className="bg-white dark:bg-[#111111] rounded-t-3xl px-5 pt-4 pb-8"
        >
          <View className="items-center mb-3">
            <View className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-500" />
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-red-100 dark:bg-red-900/30 mr-3">
                <AlertTriangle size={20} color="#DC2626" />
              </View>
              <Text className="text-zinc-900 dark:text-white text-xl font-bold">{title}</Text>
            </View>
            <TouchableOpacity
              onPress={requestClose}
              className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center"
            >
              <X size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <Text className="text-zinc-600 dark:text-zinc-300 text-base leading-6">
            {message || "An unexpected error occurred."}
          </Text>

          <View className="mt-5 flex-row gap-3">
            {!!onRetry && (
              <TouchableOpacity
                onPress={onRetry}
                className="h-12 rounded-xl bg-blue-500 items-center justify-center flex-row flex-1"
              >
                <RotateCcw size={16} color="#fff" />
                <Text className="ml-2 text-white font-semibold">Try Again</Text>
              </TouchableOpacity>
            )}

            {!!onBuy && (
              <TouchableOpacity
                onPress={onBuy}
                className="h-12 rounded-xl bg-emerald-600 items-center justify-center flex-row flex-1"
              >
                <ShoppingCart size={16} color="#fff" />
                <Text className="ml-2 text-white font-semibold" numberOfLines={1}>
                  {buyLabel}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
