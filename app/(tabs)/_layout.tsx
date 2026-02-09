// app/(tabs)/_layout.tsx
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import * as Icons from "lucide-react-native";
import { Platform, useColorScheme, View } from "react-native";

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Create a wrapper component to handle icon rendering
  const IconWrapper = ({ name, focused, color, size }: any) => {
    const IconComponent = Icons[name];

    return (
      <IconComponent
        size={size}
        color={color}
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
          height: Platform.OS === "ios" ? 85 : 70,
          paddingBottom: Platform.OS === "ios" ? 25 : 8,
          paddingTop: 6,
          position: "absolute",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={
              isDark
                ? [
                    "rgba(20, 20, 20, 0.500)",
                    "rgba(10, 10, 10, 0.900)",
                    "rgb(0, 0, 0)",
                  ]
                : [
                    "rgba(255, 255, 255, 0.400)", // Top
                    "rgba(255, 255, 255, 0.900)", // Middle
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
              height: Platform.OS === "ios" ? 85 : 70,
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
            <View className="relative">
              <IconWrapper
                name="Home"
                focused={focused}
                color={color}
                size={size}
              />
              {focused && (
                <View className="absolute -top-4 w-7 h-1 bg-primary-500 rounded-full" />
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="course/index"
        options={{
          title: "Course",
          href: "/course",
          tabBarIcon: ({ color, size, focused }) => (
            <View className="relative">
              <IconWrapper
                name="BookOpen"
                focused={focused}
                color={color}
                size={size}
              />
              {focused && (
                <View className="absolute -top-4 w-7 h-1 bg-primary-500 rounded-full" />
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
            <View className="relative">
              <IconWrapper
                name="PlayCircle"
                focused={focused}
                color={color}
                size={size}
              />
              {focused && (
                <View className="absolute -top-4 w-7 h-1 bg-primary-500 rounded-full" />
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
            <View className="relative">
              <IconWrapper
                name="Crown"
                focused={focused}
                color={color}
                size={size}
              />
              {focused && (
                <View className="absolute -top-4 w-7 h-1 bg-primary-500 rounded-full" />
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
            <View className="relative">
              <IconWrapper
                name="User"
                focused={focused}
                color={color}
                size={size}
              />
              {focused && (
                <View className="absolute -top-4 w-7 h-1 justify-center bg-primary-500 rounded-full" />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
