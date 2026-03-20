import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { View } from "react-native";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SkeletonLine = ({
  width,
  height = 16,
}: {
  width: string;
  height?: number;
}) => (
  <View
    className="rounded-full bg-gray-200 dark:bg-gray-700"
    style={{ width, height }}
  />
);

export default function ManageQualificationSkeleton() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDarkMode = colorScheme === "dark";

  return (
    <View className="flex-1 animate-pulse">
      <LinearGradient
        colors={isDarkMode ? ["#09090b", "#171717"] : ["#F8FAFC", "#E2E8F0"]}
        locations={[0, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ flex: 1 }}
      >
        <View
          className="px-5 flex-row items-center justify-between"
          style={{ paddingTop: insets.top + 4 }}
        >
          <View className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
          <View className="h-7 w-40 rounded-full bg-gray-200 dark:bg-gray-700" />
          <View className="h-12 w-12" />
        </View>

        <View className="mt-4 px-5">
          <View className="rounded-3xl bg-secondary-50 p-5 dark:bg-secondary-800">
            <SkeletonLine width="56%" height={22} />
            <View className="mt-2">
              <SkeletonLine width="86%" />
            </View>
            <View className="mt-2">
              <SkeletonLine width="74%" />
            </View>

            <View className="mt-5 rounded-2xl bg-white p-4 dark:bg-secondary-900">
              <SkeletonLine width="24%" />
              <View className="mt-3">
                <SkeletonLine width="18%" height={32} />
              </View>
              <View className="mt-2">
                <SkeletonLine width="38%" />
              </View>
            </View>

            <View className="mt-5 flex-row flex-wrap">
              {[1, 2, 3, 4].map((item) => (
                <View
                  key={item}
                  className="mb-2 mr-2 h-10 rounded-full bg-gray-300 dark:bg-gray-600"
                  style={{ width: item % 2 === 0 ? 148 : 120 }}
                />
              ))}
            </View>

            <View className="mt-5 h-14 rounded-2xl border border-dashed border-primary-200 bg-white dark:border-primary-700 dark:bg-secondary-900" />
            <View className="mt-3 h-14 rounded-2xl border border-border dark:border-gray-700" />
          </View>
        </View>

        <View className="absolute inset-x-0 bottom-0" pointerEvents="none">
          <LinearGradient
            colors={
              isDarkMode
                ? [
                    "rgba(15, 23, 42, 0)",
                    "rgba(15, 23, 42, 0.88)",
                    "rgba(15, 23, 42, 1)",
                  ]
                : [
                    "rgba(248, 250, 252, 0)",
                    "rgba(248, 250, 252, 0.9)",
                    "rgba(248, 250, 252, 1)",
                  ]
            }
            locations={[0, 0.55, 1]}
            style={{ height: 110, justifyContent: "flex-end" }}
          >
            <View
              className="px-8"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              <View className="h-14 rounded-full bg-primary-300 dark:bg-primary-700" />
            </View>
          </LinearGradient>
        </View>
      </LinearGradient>
    </View>
  );
}
