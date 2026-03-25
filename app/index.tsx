import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "@react-native-firebase/auth";
import {
  hasCompletedProfileOnboarding,
  resolveOnboardingIdentity,
} from "@/lib/utils/onboarding-status";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function Index() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  useEffect(() => {
    const checkAppState = async () => {
      try {
        const hasOnboarded = await AsyncStorage.getItem("hasOnboarded");
        const user = getAuth().currentUser;

        // 1️⃣ First time open app
        if (!hasOnboarded) {
          router.replace("/intro");
          return;
        }

        // 2️⃣ Not logged in
        if (!user) {
          router.replace("/login");
          return;
        }

        // 3️⃣ Logged in
        const identity = resolveOnboardingIdentity({
          uid: user.uid,
          email: user.email,
          phone: user.phoneNumber,
        });
        const completed = await hasCompletedProfileOnboarding(identity);
        router.replace(completed ? "/home" : "/onboarding");
      } catch (err) {
        console.log("App bootstrap error:", err);
        router.replace("/login");
      }
    };

    checkAppState();
  }, []);

  return (
    <LinearGradient
      colors={isDarkMode ? ["#09090B", "#171717"] : ["#F8FAFC", "#E2E8F0"]}
      locations={[0, 1]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1 items-center justify-center px-6">
        <ActivityIndicator
          size="large"
          color={isDarkMode ? "#FFFFFF" : "#7A25FF"}
        />
        <Text className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Checking app state...
        </Text>
      </View>
    </LinearGradient>
  );
}
