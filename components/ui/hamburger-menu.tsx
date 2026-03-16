// components/ui/hamburger-menu.tsx
import { useDrawerStore } from "@/store/drawer-store";
import { Menu } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { TouchableOpacity } from "react-native";

interface HamburgerMenuProps {
  size?: number;
  iconSize?: number;
  className?: string;
}

export function HamburgerMenu({
  size = 44, // Default size for the button
  iconSize = 24,
  className = "",
}: HamburgerMenuProps) {
  const openDrawer = useDrawerStore((state) => state.openDrawer);
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  // Background color with very low opacity for subtle visibility
  const backgroundColor = isDarkMode
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.05)";

  return (
    <TouchableOpacity
      onPress={openDrawer}
      activeOpacity={0.7}
      className={`items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: backgroundColor,
      }}
    >
      <Menu
        size={iconSize}
        color={isDarkMode ? "#FFFFFF" : "#09090b"}
        strokeWidth={2.5}
      />
    </TouchableOpacity>
  );
}
