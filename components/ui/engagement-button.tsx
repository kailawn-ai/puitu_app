import LottieView from "lottie-react-native";
import { BookmarkPlus, Heart, Star } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  liked: boolean;
  likeCount: number;
  saved: boolean;
  rating?: number;
  onLike?: (liked: boolean) => Promise<void> | void;
  onSave?: (saved: boolean) => Promise<void> | void;
  onRate?: (rating: number) => Promise<void> | void;
  onShare?: () => void;
}

interface MenuAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function EngagementBar({
  liked,
  likeCount,
  saved,
  rating = 0,
  onLike,
  onSave,
  onRate,
  onShare,
}: Props) {
  const [isLiked, setIsLiked] = useState(liked);
  const [count, setCount] = useState(likeCount);
  const [isSaved, setIsSaved] = useState(saved);
  const [currentRating, setCurrentRating] = useState(rating);

  const [rateMenuVisible, setRateMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const rateMenuAnimation = useRef(new Animated.Value(0)).current;
  const rateButtonWrapperRef = useRef<View>(null);
  const shareLottieRef = useRef<LottieView>(null);

  useEffect(() => {
    setIsLiked(liked);
    setCount(likeCount);
    setIsSaved(saved);
    setCurrentRating(rating);
  }, [liked, likeCount, saved, rating]);

  const openRateMenu = (): void => {
    rateButtonWrapperRef.current?.measureInWindow((x, y, width, height) => {
      setMenuAnchor({ x, y, width, height });
      setRateMenuVisible(true);
      rateMenuAnimation.setValue(0);

      Animated.timing(rateMenuAnimation, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();
    });
  };

  const closeRateMenu = (): void => {
    Animated.timing(rateMenuAnimation, {
      toValue: 0,
      duration: 140,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setRateMenuVisible(false);
    });
  };

  const handleLike = async () => {
    const newLiked = !isLiked;

    setIsLiked(newLiked);
    setCount((prev) => (newLiked ? prev + 1 : Math.max(prev - 1, 0)));

    try {
      await onLike?.(newLiked);
    } catch (error) {
      setIsLiked(!newLiked);
      setCount((prev) => (newLiked ? prev - 1 : prev + 1));
    }
  };

  const handleSave = async () => {
    const newSaved = !isSaved;
    setIsSaved(newSaved);

    try {
      await onSave?.(newSaved);
    } catch (error) {
      setIsSaved(!newSaved);
    }
  };

  const handleSharePress = (): void => {
    shareLottieRef.current?.reset();
    shareLottieRef.current?.play();
    onShare?.();
  };

  const handleRatePress = (): void => {
    if (rateMenuVisible) {
      closeRateMenu();
      return;
    }

    openRateMenu();
  };

  const handleRateSelect = async (selectedRating: number): Promise<void> => {
    const previousRating = currentRating;
    setCurrentRating(selectedRating);

    try {
      await onRate?.(selectedRating);
    } catch (error) {
      setCurrentRating(previousRating);
    } finally {
      closeRateMenu();
    }
  };

  const menuScale = rateMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  const menuTranslateY = rateMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  const screenWidth = Dimensions.get("window").width;
  const estimatedMenuWidth = 138;
  const menuLeft = menuAnchor
    ? Math.min(
        Math.max(menuAnchor.x + menuAnchor.width - estimatedMenuWidth, 8),
        screenWidth - estimatedMenuWidth - 8,
      )
    : 8;
  const menuTop = menuAnchor ? Math.max(menuAnchor.y - 14, 8) : 8;

  return (
    <View className="relative">
      <Modal
        transparent
        visible={rateMenuVisible}
        animationType="none"
        onRequestClose={closeRateMenu}
      >
        <View className="flex-1">
          <Pressable className="absolute inset-0" onPress={closeRateMenu} />

          {!!menuAnchor && (
            <Animated.View
              style={{
                position: "absolute",
                left: menuLeft,
                top: menuTop,
                opacity: rateMenuAnimation,
                transform: [
                  { scale: menuScale },
                  { translateY: menuTranslateY },
                ],
              }}
              className="z-50 flex-row items-center rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-2"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleRateSelect(star)}
                  className="px-1"
                  activeOpacity={0.8}
                >
                  <Star
                    size={22}
                    color={star <= currentRating ? "#F59E0B" : "#9CA3AF"}
                    fill={star <= currentRating ? "#F59E0B" : "transparent"}
                  />
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </View>
      </Modal>

      <View className="flex-row items-center justify-end mt-3">
        <TouchableOpacity
          onPress={handleLike}
          className="flex-row bg-white dark:bg-secondary-700 px-3 py-3 rounded-full elevation-sm"
          activeOpacity={0.7}
        >
          <Text className="mr-1 text-sm text-gray-700 dark:text-gray-300">
            {count}
          </Text>
          <Heart
            size={20}
            color={isLiked ? "#EF4444" : "#6B7280"}
            fill={isLiked ? "#EF4444" : "transparent"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          className="bg-white dark:bg-secondary-700 px-3 py-3 ml-1 rounded-full elevation-sm flex-row items-center"
          activeOpacity={0.7}
        >
          <BookmarkPlus
            size={20}
            color={isSaved ? "#7C3AED" : "#6B7280"}
            fill={isSaved ? "#7C3AED" : "transparent"}
          />
          <Text className="ml-1 text-sm text-gray-500 dark:text-gray-400">
            Save
          </Text>
        </TouchableOpacity>

        <View ref={rateButtonWrapperRef}>
          <TouchableOpacity
            onPress={handleRatePress}
            className="bg-white dark:bg-secondary-700 px-3 py-3 ml-1 rounded-full elevation-sm flex-row items-center"
            activeOpacity={0.7}
          >
            <Star
              size={20}
              color={currentRating > 0 ? "#F59E0B" : "#6B7280"}
              fill={currentRating > 0 ? "#F59E0B" : "transparent"}
            />
            <Text className="ml-1 text-sm text-gray-500 dark:text-gray-400">
              Rate
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSharePress}
          className="bg-white dark:bg-secondary-700 px-3 py-3 ml-1 rounded-full elevation-sm flex-row items-center"
          activeOpacity={0.7}
        >
          <LottieView
            ref={shareLottieRef}
            source={require("../../assets/icons/share.json")}
            autoPlay={false}
            loop={false}
            style={{ width: 20, height: 20 }}
          />
          <Text className="ml-1 text-sm text-gray-700 dark:text-gray-400">
            Share
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
