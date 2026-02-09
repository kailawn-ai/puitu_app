// components/ui/back-button.tsx
import { useNavigation } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
  size?: number;
  className?: string;
  showBackground?: boolean;
}

export function BackButton({
  onPress,
  color = "#FFFFFF",
  size = 24,
  className = "",
  showBackground = true,
}: BackButtonProps) {
  const navigation = useNavigation();

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
      className={`${showBackground ? "bg-black/20 backdrop-blur-xl" : ""} w-14 h-14 rounded-full items-center justify-center border border-white/20 ${className}`}
      activeOpacity={0.7}
      style={
        showBackground
          ? {
              // iOS-like backdrop filter fallback
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              // Shadow for depth
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }
          : {}
      }
    >
      <View
        style={
          showBackground
            ? {
                // Inner glow effect
                position: "absolute",
                top: 1,
                left: 1,
                right: 1,
                bottom: 1,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.1)",
              }
            : {}
        }
      />

      <ChevronLeft size={size} color={color} />
    </TouchableOpacity>
  );
}
