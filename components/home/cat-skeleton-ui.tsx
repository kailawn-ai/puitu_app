import { View } from "react-native";

export default function HomeSkeleton() {
  return (
    <View className="px-5 mt-4">
      {/* Categories Skeleton */}
      <View className="flex-row flex-wrap">
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ width: "50%" }} className="px-1 mb-2">
            <View className="flex-row items-center bg-gray-200 dark:bg-gray-700 p-3 rounded-xl animate-pulse">
              <View className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-xl mr-3" />
              <View className="flex-1 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
            </View>
          </View>
        ))}
      </View>

      {/* Course cards skeleton */}
      <View className="mt-6 flex-row">
        {[1, 2].map((i) => (
          <View
            key={i}
            className="w-60 mr-3 bg-gray-200 dark:bg-gray-700 rounded-xl p-3"
          >
            <View className="w-full h-32 bg-gray-300 dark:bg-gray-600 rounded-lg" />
            <View className="h-4 bg-gray-300 dark:bg-gray-600 mt-3 rounded" />
            <View className="h-3 bg-gray-300 dark:bg-gray-600 mt-2 rounded w-1/2" />
          </View>
        ))}
      </View>
    </View>
  );
}
