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
  // Default size for the button
  iconSize = 24,
}: HamburgerMenuProps) {
  const openDrawer = useDrawerStore((state) => state.openDrawer);
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  return (
    <TouchableOpacity
      onPress={openDrawer}
      activeOpacity={0.7}
      className="p-4 bg-white dark:bg-secondary-700 rounded-2xl"
    >
      <Menu
        size={iconSize}
        color={isDarkMode ? "#FFFFFF" : "#09090b"}
        strokeWidth={2.5}
      />
    </TouchableOpacity>
  );
}
