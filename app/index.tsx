import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "@react-native-firebase/auth";
import {
  hasCompletedProfileOnboarding,
  resolveOnboardingIdentity,
} from "@/lib/utils/onboarding-status";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const router = useRouter();

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
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
