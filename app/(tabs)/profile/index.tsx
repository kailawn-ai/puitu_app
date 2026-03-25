// app/(tabs)/profile.tsx
import RequestCreatorCard from "@/components/creator/request-creator-card";
import {
  ProfileResponseService,
  type ProfileResponseData,
} from "@/lib/services/profile-response-service";
import { useProfileResponseStore } from "@/store/profile-response-store";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Award,
  Bell,
  BookOpen,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Globe,
  GraduationCap,
  Heart,
  HelpCircle,
  Lock,
  Moon,
  Settings,
  Shield,
  Star,
  User,
  Users,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const formatTimeSpent = (minutes?: number) => {
  const safeMinutes = Math.max(minutes ?? 0, 0);
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours <= 0) {
    return `${remainingMinutes}m`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const setProfileResponseStore = useProfileResponseStore(
    (state) => state.setProfileResponse,
  );
  const [profileResponse, setProfileResponse] =
    React.useState<ProfileResponseData | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadProfileData = React.useCallback(async () => {
    const response = await ProfileResponseService.getProfileResponse();
    setProfileResponse(response);
    setProfileResponseStore(response);
  }, [setProfileResponseStore]);

  React.useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  useFocusEffect(
    React.useCallback(() => {
      loadProfileData();
    }, [loadProfileData]),
  );

  const userData = {
    name: profileResponse?.user?.name || "User",
    email: profileResponse?.user?.email || "No email",
    avatar:
      profileResponse?.user?.profile_image ||
      "https://cdn-icons-png.flaticon.com/512/9187/9187532.png",
    joinDate: profileResponse?.detail?.joined_label
      ? `Joined ${profileResponse.detail.joined_label}`
      : "Joined recently",
    level:
      (profileResponse?.detail?.qualification_count ?? 0) > 0
        ? `${profileResponse?.detail?.qualification_count ?? 0} qualifications added`
        : "Complete your profile",
    points: profileResponse?.points?.available_points ?? 0,
    qualifications: profileResponse?.detail?.qualification_count ?? 0,
    purchases: profileResponse?.stats?.purchase_count ?? 0,
    learningTime: formatTimeSpent(
      profileResponse?.stats?.online_time_spent_minutes ?? 0,
    ),
  };

  const stats = [
    { icon: "🎯", label: "Points", value: userData.points, color: "#7A25FF" },
    {
      icon: "🎓",
      label: "Qualifications",
      value: userData.qualifications,
      color: "#F59E0B",
    },
    {
      icon: "📚",
      label: "Purchases",
      value: userData.purchases,
      color: "#10B981",
    },
    {
      icon: "⏱️",
      label: "Time",
      value: userData.learningTime,
      color: "#3B82F6",
    },
  ];

  const menuSections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Edit Profile", color: "#7A25FF" },
        {
          icon: GraduationCap,
          label: "Manage Qualification",
          color: "#10B981",
        },
        {
          icon: Bell,
          label: "Notifications",
          color: "#F59E0B",
          hasSwitch: true,
          value: true,
        },
        {
          icon: Moon,
          label: "Dark Mode",
          color: "#6B7280",
          hasSwitch: true,
          value: colorScheme === "dark",
        },
      ],
    },
    {
      title: "Learning",
      items: [
        { icon: BookOpen, label: "My Courses", color: "#8B5CF6", badge: 4 },
        { icon: Award, label: "Achievements", color: "#F59E0B", badge: 12 },
        { icon: Clock, label: "Learning History", color: "#3B82F6" },
        { icon: Star, label: "Saved Items", color: "#EC4899", badge: 8 },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", color: "#6B7280" },
        { icon: Download, label: "Download Content", color: "#10B981" },
        { icon: Heart, label: "Rate Puitu", color: "#EC4899" },
      ],
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProfileData();
    } finally {
      setRefreshing(false);
    }
  };

  const renderStatItem = (stat: any, index: number) => (
    <View
      key={index}
      className="flex-1 items-center p-4 bg-secondary-50 dark:bg-secondary-800 rounded-2xl mx-1"
    >
      <Text className="text-2xl mb-2">{stat.icon}</Text>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">
        {stat.value}
      </Text>
      <Text className="text-sm font-medium mt-1" style={{ color: stat.color }}>
        {stat.label}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      {/* Header */}
      <View className="px-5" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile
          </Text>
          <TouchableOpacity
            className="p-2 bg-white dark:bg-secondary-800 rounded-xl"
            onPress={() => router.push("/profile/settings")}
          >
            <Settings size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View className="px-5 mb-8">
          <View className="flex-row items-center bg-secondary-50 dark:bg-secondary-800 rounded-3xl p-6 shadow-sm">
            <View className="relative">
              <Image
                source={{ uri: userData.avatar }}
                className="w-24 h-24 rounded-2xl"
              />
              <View className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary-500 rounded-full items-center justify-center">
                <Text className="text-white font-bold">👑</Text>
              </View>
            </View>

            <View className="flex-1 ml-6">
              <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {userData.name}
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 mb-2">
                {userData.email}
              </Text>
              <Text className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                {userData.level}
              </Text>
              <Text className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                {userData.joinDate}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="mb-8">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 14 }}
          >
            {stats.map(renderStatItem)}
          </ScrollView>
        </View>

        {/* Menu Sections */}
        <View className="px-5">
          {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} className="mb-8">
              <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {section.title}
              </Text>

              <View className="bg-secondary-50 dark:bg-secondary-800 rounded-2xl overflow-hidden shadow-sm">
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={itemIndex}
                    className={`flex-row items-center justify-between px-4 py-4 ${
                      itemIndex !== section.items.length - 1
                        ? "border-b border-white dark:border-gray-700"
                        : ""
                    }`}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (item.label === "Dark Mode") {
                        toggleColorScheme();
                      } else if (item.label === "Manage Qualification") {
                        router.push("/qualification/manage");
                      } else if (item.label === "Edit Profile") {
                        router.push("/profile/edit");
                      }
                      // Add more navigation handlers as needed
                    }}
                  >
                    <View className="flex-row items-center flex-1">
                      <View
                        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: `${item.color}15` }}
                      >
                        <item.icon size={20} color={item.color} />
                      </View>

                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-medium">
                          {item.label}
                        </Text>
                        {item.rightText && (
                          <Text className="text-gray-500 dark:text-gray-400 text-sm">
                            {item.rightText}
                          </Text>
                        )}
                      </View>

                      {item.badge && (
                        <View className="w-6 h-6 bg-primary-500 rounded-full items-center justify-center mr-3">
                          <Text className="text-white text-xs font-bold">
                            {item.badge}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-row items-center">
                      {item.hasSwitch ? (
                        <Switch
                          value={item.value}
                          onValueChange={() => {
                            if (item.label === "Dark Mode") {
                              toggleColorScheme();
                            }
                          }}
                          trackColor={{ false: "#D1D5DB", true: "#7A25FF" }}
                          thumbColor="#FFFFFF"
                        />
                      ) : (
                        <ChevronRight size={20} color="#9CA3AF" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        <RequestCreatorCard
          isDark={colorScheme === "dark"}
          onPress={() => router.push("/creator/request")}
        />

        {/* App Info */}
        <View className="px-5">
          <View className="items-center">
            <Text className="text-gray-500 dark:text-gray-400 text-sm mb-2">
              Puitu v2.0.1
            </Text>
            <Text className="text-gray-400 dark:text-gray-500 text-xs">
              © 2024 Puitu Inc. All rights reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
