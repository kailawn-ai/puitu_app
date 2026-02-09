// components/navigation/hamburger-menu.tsx
import { Menu } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { TouchableOpacity } from "react-native";

interface HamburgerMenuProps {
  onPress: () => void;
  size?: number;
}

export function HamburgerMenu({ onPress, size = 24 }: HamburgerMenuProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      onPress={onPress}
      className="p-2 rounded-xl active:opacity-70"
      activeOpacity={0.7}
      style={{
        backgroundColor: isDark
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(0, 0, 0, 0.05)",
      }}
    >
      <Menu
        size={size}
        color={isDark ? "#FFFFFF" : "#374151"}
        strokeWidth={2.5}
      />
    </TouchableOpacity>
  );
}
