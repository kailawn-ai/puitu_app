import { BackButton } from "@/components/ui/back-button";
import { LinearGradient } from "expo-linear-gradient";
import { Clock } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="flex-1 bg-stone-100 dark:bg-neutral-950">
      <LinearGradient
        colors={
          isDark
            ? ["#0F172A", "#111827", "#020617"]
            : ["#E5E7EB", "#CBD5E1", "#93C5FD"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <BackButton
          className="absolute left-4 top-12 z-10"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }

            router.replace("/home");
          }}
        />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: insets.top + 1,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 py-8">
            <View className="flex-row items-center mb-6">
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: "#3B82F615" }}
              >
                <Clock size={24} color="#3B82F6" />
              </View>
              <View>
                <Text
                  className="text-2xl font-bold"
                  style={{ color: isDark ? "#FFFFFF" : "#18181B" }}
                >
                  Learning History
                </Text>
                <Text
                  className="text-sm mt-1"
                  style={{ color: isDark ? "#CBD5E1" : "#57534E" }}
                >
                  Track your learning progress and completed courses
                </Text>
              </View>
            </View>

            <View className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-200 dark:border-neutral-800">
              <Text
                className="text-center text-lg font-medium"
                style={{ color: isDark ? "#FFFFFF" : "#18181B" }}
              >
                No learning history yet
              </Text>
              <Text
                className="text-center text-sm mt-2"
                style={{ color: isDark ? "#CBD5E1" : "#57534E" }}
              >
                Start learning to see your progress here
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
