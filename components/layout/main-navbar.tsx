import { BlurView } from "expo-blur"; // Ensure expo-blur is installed
import { Link, usePathname } from "expo-router";
import { BookOpen, Crown, Home, PlayCircle, User } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  route: string;
}

export function MainNavbar() {
  const pathname = usePathname();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const navItems: NavItem[] = [
    { id: "home", label: "Home", icon: Home, route: "/home" },
    { id: "courses", label: "Courses", icon: BookOpen, route: "/course" },
    { id: "shorts", label: "Shorts", icon: PlayCircle, route: "/short" },
    {
      id: "subscription",
      label: "Premium",
      icon: Crown,
      route: "/subscription",
    },
    { id: "profile", label: "Profile", icon: User, route: "/profile" },
  ];

  // Logic: Light Mode Active = Black, Dark Mode Active = White
  const getActiveColor = () => (isDark ? "#FFFFFF" : "#000000");
  const getInactiveColor = () => (isDark ? "#828282" : "#8E8E93");

  return (
    <View className="absolute bottom-6 left-0 right-0 items-center justify-center px-4">
      <View className="w-full max-w-md overflow-hidden rounded-[24px] border border-white/20 shadow-2xl">
        <BlurView
          intensity={Platform.OS === "ios" ? 40 : 100}
          tint={isDark ? "dark" : "light"}
          style={styles.blurContainer}
        >
          <View className="flex-row items-center justify-around py-2 px-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.route || pathname.startsWith(item.route);
              const Icon = item.icon;

              return (
                <Link key={item.id} href={item.route as any} asChild>
                  <TouchableOpacity
                    className="flex-1 items-center justify-center"
                    activeOpacity={0.7}
                  >
                    {/* Square Active Indicator */}
                    <View
                      className={`items-center justify-center p-2 rounded-xl ${
                        isActive
                          ? isDark
                            ? "bg-white/10"
                            : "bg-black/5"
                          : "bg-transparent"
                      }`}
                    >
                      <Icon
                        size={22}
                        color={isActive ? getActiveColor() : getInactiveColor()}
                        strokeWidth={isActive ? 2.5 : 2}
                      />

                      {/* Active Dot or Label */}
                      <Text
                        style={{
                          color: isActive
                            ? getActiveColor()
                            : getInactiveColor(),
                          fontSize: 10,
                          marginTop: 2,
                          fontWeight: isActive ? "700" : "500",
                        }}
                      >
                        {item.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    paddingVertical: 4,
    borderRadius: 24,
    // Fallback for Android which has poorer Blur support
    backgroundColor:
      Platform.OS === "android" ? "rgba(255, 255, 255, 0.85)" : "transparent",
  },
});
