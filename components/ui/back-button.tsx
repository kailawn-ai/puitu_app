// components/navigation/back-button.tsx

import { BlurView } from "expo-blur";
import { useNavigation } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
  size?: number;
  className?: string;
}

export function BackButton({
  onPress,
  color,
  size = 22,
  className = "",
}: BackButtonProps) {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const iconColor = color || (isDarkMode ? "#FFFFFF" : "#111827");

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      className={`w-12 h-12 rounded-full overflow-hidden ${className}`}
    >
      <BlurView
        intensity={110}
        tint={isDarkMode ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
        className="overflow-hidden"
      />

      <View className="flex-1 items-center justify-center mr-1">
        <ChevronLeft size={size} color={iconColor} strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  );
}
