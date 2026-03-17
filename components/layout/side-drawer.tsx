// components/navigation/side-drawer.tsx
import { getStoredAuthUser } from "@/lib/utils/auth-user-store";
import { useRouter } from "expo-router";
import {
  Award,
  Bell,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Globe,
  Heart,
  HelpCircle,
  Moon,
  Settings,
  Shield,
  Star,
  Users,
  X,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
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
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const translateX = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;

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
          route: "/settings",
          color: "#6B7280",
        },
        {
          icon: Bell,
          label: "Notifications",
          route: "/notifications",
          color: "#EF4444",
          badge: 3,
        },
        {
          icon: Heart,
          label: "Favorites",
          route: "/favorites",
          color: "#EC4899",
        },
        {
          icon: Download,
          label: "Downloads",
          route: "/downloads",
          color: "#10B981",
        },
        {
          icon: Moon,
          label: "Dark Mode",
          action: toggleColorScheme,
          color: "#6366F1",
          rightText: isDark ? "On" : "Off",
        },
      ],
    },
    {
      title: "Learning",
      items: [
        {
          icon: Star,
          label: "Achievements",
          route: "/achievements",
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
          label: "Help Center",
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
          icon: Globe,
          label: "Language",
          route: "/language",
          color: "#3B82F6",
          rightText: "English",
        },
        {
          icon: CreditCard,
          label: "Billing",
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
      if (!stored) return;

      setUserData((prev) => ({
        ...prev,
        name: stored.name || prev.name,
        email: stored.email || prev.email,
        avatar: stored.profile_image || prev.avatar,
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
          <View className="w-6 h-6 bg-primary-500 rounded-full items-center justify-center mr-3">
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
          <View className="pt-12 px-6 pb-8 bg-primary-500 dark:bg-primary-600">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-white text-2xl font-bold">Menu</Text>
              <TouchableOpacity
                onPress={onClose}
                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center active:bg-white/30"
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center">
              <Image
                source={{ uri: userData.avatar }}
                className="w-16 h-16 rounded-2xl border-2 border-white/30"
              />
              <View className="ml-4 flex-1">
                <Text className="text-white text-xl font-bold">
                  {userData.name}
                </Text>
                <Text className="text-primary-200 text-sm mt-1">
                  {userData.email}
                </Text>
                <View className="flex-row items-center mt-2">
                  <View className="bg-amber-500 px-3 py-1 rounded-full">
                    <Text className="text-white text-xs font-bold">
                      {userData.membership}
                    </Text>
                  </View>
                  <View className="ml-3 bg-primary-400 px-3 py-1 rounded-full">
                    <Text className="text-white text-xs">
                      {userData.points} points
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Menu Content */}
          <ScrollView
            className="flex-1 mb-2"
            showsVerticalScrollIndicator={false}
          >
            {menuSections.map((section, index) => (
              <View key={index} className="mb-2">
                {section.title && (
                  <Text className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                    {section.title}
                  </Text>
                )}
                <View className="bg-white dark:bg-secondary-800 rounded-xl mx-4 overflow-hidden border border-gray-100 dark:border-gray-800">
                  {section.items.map((item, itemIndex) =>
                    renderMenuItem(item, itemIndex),
                  )}
                </View>
              </View>
            ))}

            {/* App Version */}
            <View className="items-center pb-8 mt-4">
              <Text className="text-gray-400 dark:text-gray-500 text-sm">
                Puitu v2.0.1
              </Text>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </>
  );
}
