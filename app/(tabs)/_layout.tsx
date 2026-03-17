// app/(tabs)/_layout.tsx
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import * as Icons from "lucide-react-native";
import { useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const TAB_BAR_VISIBLE_HEIGHT = 50;

  // Create a wrapper component to handle icon rendering
  const IconWrapper = ({ name, focused, color, size }: any) => {
    const IconComponent = Icons[name];

    return (
      <IconComponent
        size={size}
        color={focused ? "#FFFFFF" : color}
        strokeWidth={focused ? 2.5 : 2}
      />
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          height: TAB_BAR_VISIBLE_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 1,
          position: "absolute",
          left: 0,
          right: 0,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={
              isDark
                ? [
                    "rgba(20, 20, 20, 0.400)",
                    "rgba(10, 10, 10, 0.950)",
                    "rgb(0, 0, 0)",
                  ]
                : [
                    "rgba(255, 255, 255, 0.400)", // Top
                    "rgba(255, 255, 255, 0.950)", // Middle
                    "rgb(255, 255, 255)", // Bottom
                  ]
            }
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: TAB_BAR_VISIBLE_HEIGHT + insets.bottom,
            }}
          >
            {/* Optional: Add a subtle border at top of tab bar */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.15)"
                  : "rgba(0, 0, 0, 0.15)",
              }}
            />
          </LinearGradient>
        ),
        tabBarActiveTintColor: "#7A25FF",
        tabBarInactiveTintColor: isDark ? "#E8E8E8" : "#1C1C1C",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: "Home",
          href: "/home",
          tabBarIcon: ({ color, size, focused }) => (
            <View className="items-center justify-center">
              <IconWrapper
                name="Home"
                focused={focused}
                color={color}
                size={size}
              />
              {focused && (
                <View className="absolute w-16 h-10 bg-primary-500 -z-10 rounded-full" />
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="short/index"
        options={{
          title: "Short",
          href: "/short",
          tabBarIcon: ({ color, size, focused }) => (
            <View className="items-center justify-center">
              <IconWrapper
                name="PlayCircle"
                focused={focused}
                color={color}
                size={size}
              />
              {focused && (
                <View className="absolute w-16 h-10 bg-primary-500 -z-10 rounded-full" />
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="community/index"
        options={{
          title: "Community",
          href: "/community",
          tabBarIcon: ({ color, size, focused }) => (
            <View className="items-center justify-center">
              <IconWrapper
                name="Send"
                focused={focused}
                color={color}
                size={size}
              />
              {focused && (
                <View className="absolute w-16 h-10 bg-primary-500 -z-10 rounded-full" />
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="subscription/index"
        options={{
          title: "Premium",
          href: "/subscription",
          tabBarIcon: ({ color, size, focused }) => (
            <View className="items-center justify-center">
              <IconWrapper
                name="Crown"
                focused={focused}
                color={color}
                size={size}
              />
              {focused && (
                <View className="absolute w-16 h-10 bg-primary-500 -z-10 rounded-full" />
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          href: "/profile",
          tabBarIcon: ({ color, size, focused }) => (
            <View className="items-center justify-center">
              <IconWrapper
                name="User"
                focused={focused}
                color={color}
                size={size}
              />
              {focused && (
                <View className="absolute w-16 h-10 bg-primary-500 -z-10 rounded-full" />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
