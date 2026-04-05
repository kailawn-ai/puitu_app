// components/navigation/side-drawer.tsx
import { RequestCreatorCard } from "@/components/creator/request-creator-card";
import { getStoredAuthUser } from "@/lib/utils/auth-user-store";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Award,
  Bell,
  ChevronRight,
  Clock,
  Film,
  HelpCircle,
  HelpCircleIcon,
  Save,
  Settings,
  Shield,
  UserCog2Icon,
  Users,
  X,
  Sparkles,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useNotifications } from "@/providers/notification-provider";
import React from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.85;

interface SideDrawerProps {
  isVisible: boolean;
  onClose: () => void;
}

export function SideDrawer({ isVisible, onClose }: SideDrawerProps) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const translateX = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const { unreadCount } = useNotifications();

  const [userData, setUserData] = React.useState({
    name: "User",
    email: "No email",
    avatar: "https://cdn-icons-png.flaticon.com/512/9187/9187532.png",
    membership: "Member",
    points: 0,
  });

  const menuSections = [
    {
      title: "Account",
      items: [
        {
          icon: Settings,
          label: "Settings",
          route: "/profile/settings",
          color: "#6B7280",
        },
        {
          icon: Bell,
          label: "Notifications",
          route: "/notifications",
          color: "#00bd4f",
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
        {
          icon: Film,
          label: "My Shorts",
          route: "/short/my",
          color: "#F43F5E",
        },
      ],
    },
    {
      title: "Learning",
      items: [
        {
          icon: Save,
          label: "Saved Content",
          route: "/saved-content",
          color: "#F59E0B",
        },
        {
          icon: Award,
          label: "Certificates",
          route: "/certificates",
          color: "#8B5CF6",
        },
        {
          icon: Clock,
          label: "Learning History",
          route: "/history",
          color: "#3B82F6",
        },
        {
          icon: Users,
          label: "Community",
          route: "/community",
          color: "#EC4899",
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help 24X7",
          route: "/help",
          color: "#6B7280",
        },
        {
          icon: Shield,
          label: "Privacy Policy",
          route: "/privacy",
          color: "#10B981",
        },
        {
          icon: HelpCircleIcon,
          label: "Support",
          route: "/language",
          color: "#3B82F6",
        },
        {
          icon: UserCog2Icon,
          label: "About Us",
          route: "/billing",
          color: "#8B5CF6",
        },
      ],
    },
  ];

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: isVisible ? 0 : -DRAWER_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  React.useEffect(() => {
    const loadUser = async () => {
      const stored = await getStoredAuthUser();

      setUserData((prev) => ({
        ...prev,
        name: stored?.name || prev.name,
        email: stored?.email || prev.email,
        avatar: stored?.profile_image || prev.avatar,
        points:
          typeof stored?.points === "number" ? stored.points : prev.points,
      }));
    };

    loadUser();
  }, [isVisible]);

  const handleNavigation = (route: string) => {
    onClose();
    setTimeout(() => {
      if (route.startsWith("/")) {
        router.push(route as any);
      }
    }, 300);
  };

  const renderMenuItem = (item: any, index: number) => (
    <TouchableOpacity
      key={index}
      onPress={() =>
        item.action ? item.action() : item.route && handleNavigation(item.route)
      }
      className={`flex-row items-center justify-between px-6 py-4 ${
        index !== menuSections.flatMap((s) => s.items).length - 1
          ? "border-b border-gray-200 dark:border-gray-800"
          : ""
      }`}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center flex-1">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-4"
          style={{ backgroundColor: `${item.color}15` }}
        >
          <item.icon size={20} color={item.color} />
        </View>
        <Text className="text-secondary-900 dark:text-white text-base font-medium flex-1">
          {item.label}
        </Text>

        {item.badge && (
          <View className="w-6 h-6 bg-red-500 rounded-full items-center justify-center mr-3">
            <Text className="text-white text-xs font-bold">{item.badge}</Text>
          </View>
        )}

        {item.rightText && (
          <Text className="text-gray-500 dark:text-gray-400 text-sm mr-2">
            {item.rightText}
          </Text>
        )}
      </View>

      <ChevronRight size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <>
      {/* Overlay */}
      {isVisible && (
        <TouchableOpacity
          className="absolute inset-0 z-40"
          style={{
            backgroundColor: isDark
              ? "rgba(0, 0, 0, 0.7)"
              : "rgba(0, 0, 0, 0.5)",
          }}
          activeOpacity={1}
          onPress={onClose}
        />
      )}

      {/* Drawer Content */}
      <Animated.View
        className="absolute top-0 left-0 bottom-0 z-50"
        style={{
          width: DRAWER_WIDTH,
          transform: [{ translateX }],
          shadowColor: "#000",
          shadowOffset: { width: 2, height: 0 },
          shadowOpacity: isDark ? 0.5 : 0.25,
          shadowRadius: 10,
          elevation: 20,
        }}
      >
        <View className="flex-1 bg-white dark:bg-secondary-900">
          {/* Header with User Info */}
          <LinearGradient
            colors={
              isDark
                ? ["#1E1B2E", "#2D1B4E", "#4C1D95"]
                : ["#6366F1", "#8B5CF6", "#A855F7"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="pt-12 pb-2"
          >
            <View className="px-5 flex-row justify-end">
              <TouchableOpacity
                onPress={onClose}
                className="w-10 h-10 bg-white/20 backdrop-blur-lg rounded-full items-center justify-center active:bg-white/30"
              >
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View className="px-5 mt-2">
              <View className="flex-row items-center">
                <View className="relative">
                  <Image
                    source={{ uri: userData.avatar }}
                    className="w-20 h-20 rounded-2xl border-3 border-white/40"
                  />
                  <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-white text-2xl font-bold">
                    {userData.name}
                  </Text>
                  <Text className="text-white/70 text-sm mt-0.5">
                    {userData.email}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mt-4 gap-2">
                <View className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex-row items-center">
                  <Sparkles size={14} color="#FFD700" />
                  <Text className="text-white text-xs font-medium ml-1.5">
                    {userData.membership}
                  </Text>
                </View>
                <View className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex-row items-center">
                  <Award size={14} color="#FFD700" />
                  <Text className="text-white text-xs font-medium ml-1.5">
                    {userData.points} pts
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Menu Content */}
          <ScrollView
            className="flex-1 mb-2 pt-2"
            showsVerticalScrollIndicator
            indicatorStyle={isDark ? "white" : "black"}
            persistentScrollbar
          >
            <RequestCreatorCard
              isDark={isDark}
              onPress={() => handleNavigation("/creator/request")}
            />

            {menuSections.map((section, index) => (
              <View key={index} className="mb-2">
                {section.title && (
                  <Text className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                    {section.title}
                  </Text>
                )}
                <View className="bg-secondary-50 dark:bg-secondary-800 rounded-xl mx-4 overflow-hidden border border-gray-100 dark:border-gray-800">
                  {section.items.map((item, itemIndex) =>
                    renderMenuItem(item, itemIndex),
                  )}
                </View>
              </View>
            ))}

            {/* App Version */}
            <View className="items-center pb-8 mt-4">
              <Text className="text-gray-400 dark:text-gray-500 text-sm">
                Puitu v1.0.0
              </Text>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </>
  );
}
