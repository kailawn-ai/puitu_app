import { BackButton } from "@/components/ui/back-button";
import { AuthService } from "@/lib/services/auth-service";
import { AUTH_USER_STORE_KEYS } from "@/lib/utils/auth-user-store";
import { useAlert } from "@/providers/alert-provider";
import { getAuth } from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  Bell,
  ChevronRight,
  Globe,
  Lock,
  LogOut,
  Moon,
  Shield,
  Smartphone,
  UserCog,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect } from "react";
import {
  BackHandler,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SettingItem = {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  subtitle?: string;
  rightText?: string;
  hasSwitch?: boolean;
  value?: boolean;
  color: string;
};

const SettingsScreen = () => {
  const alert = useAlert();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const auth = getAuth();

  const [notifications, setNotifications] = React.useState(true);
  const [downloadOverWifi, setDownloadOverWifi] = React.useState(true);
  const [biometricLock, setBiometricLock] = React.useState(false);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.back();
        return true;
      },
    );

    return () => backHandler.remove();
  }, [router]);

  const sections: { title: string; items: SettingItem[] }[] = [
    {
      title: "Account",
      items: [
        {
          icon: UserCog,
          label: "Profile Details",
          subtitle: "Name, photo, and personal info",
          color: "#7A25FF",
        },
        {
          icon: Globe,
          label: "Language",
          subtitle: "Choose your app language",
          rightText: "English",
          color: "#3B82F6",
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: Bell,
          label: "Push Notifications",
          subtitle: "Course updates and reminders",
          hasSwitch: true,
          value: notifications,
          color: "#F59E0B",
        },
        {
          icon: Moon,
          label: "Dark Mode",
          subtitle: "Use dark appearance",
          hasSwitch: true,
          value: colorScheme === "dark",
          color: "#6B7280",
        },
        {
          icon: Smartphone,
          label: "Download on Wi-Fi",
          subtitle: "Save mobile data usage",
          hasSwitch: true,
          value: downloadOverWifi,
          color: "#10B981",
        },
      ],
    },
    {
      title: "Security",
      items: [
        {
          icon: Lock,
          label: "Biometric Lock",
          subtitle: "Face ID / Fingerprint for app unlock",
          hasSwitch: true,
          value: biometricLock,
          color: "#EF4444",
        },
        {
          icon: Shield,
          label: "Privacy Settings",
          subtitle: "Manage data and permissions",
          color: "#14B8A6",
        },
      ],
    },
  ];

  const onToggle = (label: string) => {
    if (label === "Dark Mode") {
      toggleColorScheme();
      return;
    }
    if (label === "Push Notifications") {
      setNotifications((prev) => !prev);
      return;
    }
    if (label === "Download on Wi-Fi") {
      setDownloadOverWifi((prev) => !prev);
      return;
    }
    if (label === "Biometric Lock") {
      setBiometricLock((prev) => !prev);
    }
  };

  const handleLogout = () => {
    alert.showWarning("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await SecureStore.deleteItemAsync("auth_uid");
            await SecureStore.deleteItemAsync("auth_token");
            await SecureStore.deleteItemAsync(
              AUTH_USER_STORE_KEYS.AUTH_USER_JSON,
            );
            await SecureStore.deleteItemAsync(AUTH_USER_STORE_KEYS.AUTH_EMAIL);
            await SecureStore.deleteItemAsync(AUTH_USER_STORE_KEYS.AUTH_PHONE);
            await SecureStore.deleteItemAsync(AUTH_USER_STORE_KEYS.AUTH_NAME);
            await SecureStore.deleteItemAsync(AUTH_USER_STORE_KEYS.AUTH_IMAGE);
            await SecureStore.deleteItemAsync(
              AUTH_USER_STORE_KEYS.AUTH_PROVIDER,
            );
            await AuthService.logout();
            router.replace("/(auth)/login");
          } catch (error) {
            alert.showError("Logout error:", error);
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <View
        className="px-5 flex-row items-center justify-between"
        style={{ paddingTop: insets.top + 8 }}
      >
        <BackButton onPress={() => router.back()} />
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </Text>
        <View className="w-11 h-11" />
      </View>

      <ScrollView
        className="mt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <View className="px-5">
          {sections.map((section) => (
            <View key={section.title} className="mb-7">
              <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">
                {section.title}
              </Text>

              <View className="bg-secondary-50 dark:bg-secondary-800 rounded-2xl overflow-hidden">
                {section.items.map((item, index) => (
                  <TouchableOpacity
                    key={item.label}
                    activeOpacity={item.hasSwitch ? 1 : 0.75}
                    onPress={() => {
                      if (!item.hasSwitch) return;
                      onToggle(item.label);
                    }}
                    className={`px-4 py-4 flex-row items-center justify-between ${
                      index !== section.items.length - 1
                        ? "border-b border-white dark:border-gray-700"
                        : ""
                    }`}
                  >
                    <View className="flex-row flex-1 items-center">
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
                        {item.subtitle && (
                          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {item.subtitle}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View className="ml-3">
                      {item.hasSwitch ? (
                        <Switch
                          value={!!item.value}
                          onValueChange={() => onToggle(item.label)}
                          trackColor={{ false: "#D1D5DB", true: "#7A25FF" }}
                          thumbColor="#FFFFFF"
                        />
                      ) : item.rightText ? (
                        <View className="flex-row items-center">
                          <Text className="text-sm text-gray-500 dark:text-gray-400 mr-1">
                            {item.rightText}
                          </Text>
                          <ChevronRight size={18} color="#9CA3AF" />
                        </View>
                      ) : (
                        <ChevronRight size={18} color="#9CA3AF" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <View className="mb-7">
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">
              Account Actions
            </Text>
            <TouchableOpacity
              className="flex-row items-center justify-center bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl"
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <LogOut size={20} color="#EF4444" />
              <Text className="text-red-600 dark:text-red-400 font-semibold ml-3">
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
