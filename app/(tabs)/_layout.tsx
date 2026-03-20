// app/(tabs)/_layout.tsx
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, usePathname, useRouter } from "expo-router";
import * as Icons from "lucide-react-native";
import { useEffect } from "react";
import { BackHandler, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ROOT_TAB_PATHS = new Set([
  "/home",
  "/short",
  "/community",
  "/subscription",
  "/profile",
]);

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isShortScreen = pathname === "/short";
  const insets = useSafeAreaInsets();
  const TAB_BAR_VISIBLE_HEIGHT = 50;
  const tabBarTotalHeight = TAB_BAR_VISIBLE_HEIGHT + insets.bottom;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (pathname !== "/home" && ROOT_TAB_PATHS.has(pathname)) {
          router.replace("/home");
          return true;
        }

        return false;
      },
    );

    return () => backHandler.remove();
  }, [pathname, router]);

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
          elevation: 0,
          shadowOpacity: 0,
          height: tabBarTotalHeight,
          paddingBottom: insets.bottom,
          paddingTop: 1,
          position: "absolute",
          left: 0,
          right: 0,
          overflow: "hidden",
        },
        tabBarBackground: () => (
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: tabBarTotalHeight,
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={
                isShortScreen || isDark
                  ? [
                      "rgba(0, 0, 0, 0.300)",
                      "rgba(0, 0, 0, 0.800)",
                      "rgb(0, 0, 0)",
                    ]
                  : [
                      "rgba(255, 255, 255, 0.300)",
                      "rgba(255, 255, 255, 0.800)",
                      "rgb(255, 255, 255)",
                    ]
              }
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: TAB_BAR_VISIBLE_HEIGHT,
              }}
            />
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: insets.bottom + 1,
                backgroundColor:
                  isShortScreen || isDark ? "#000000" : "#FFFFFF",
              }}
            />
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor:
                  isShortScreen || isDark
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(0, 0, 0, 0.15)",
              }}
            />
          </View>
        ),
        tabBarActiveTintColor: "#7A25FF",
        tabBarInactiveTintColor:
          isShortScreen || isDark ? "#E8E8E8" : "#1C1C1C",
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
