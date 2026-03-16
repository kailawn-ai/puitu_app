import { Course } from "@/lib/services/home-service";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  BookOpen,
  Crown,
  FileText,
  Globe,
} from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface Props {
  course: Course;
  onPress?: (courseId: Course["id"]) => void;
}

export default function CourseCard({ course, onPress }: Props) {
  const router = useRouter();

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "beginner":
        return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
      case "intermediate":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
      case "advanced":
        return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
      default:
        return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";
    }
  };

  const handlePress = (): void => {
    if (onPress) {
      onPress(course.id);
      return;
    }

    router.push(`/course/${course.id}`);
  };

  return (
    <TouchableOpacity
      style={{ width: 290, height: 320 }}
      className="mb-1"
      activeOpacity={0.85}
      onPress={handlePress}
    >
      <View className="bg-white dark:bg-secondary-700 rounded-2xl overflow-hidden h-full">
        <View className="relative h-40">
          <Image
            source={{ uri: course.thumbnail_url }}
            className="w-full h-full"
            resizeMode="cover"
          />

          <View className="absolute top-3 right-3 bg-white dark:bg-secondary-800 px-3 py-1 rounded-full elevation-2">
            {course.is_free_preview ? (
              <View className="flex-row items-center">
                <Text className="font-bold text-green-600 dark:text-green-400 mr-1">
                  Free
                </Text>
                <Text className="text-green-600 dark:text-green-400 text-xs">
                  💰
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Crown size={18} color="#F59E0B" />
              </View>
            )}
          </View>

          {course.level && (
            <View className="absolute bottom-3 left-3">
              <View
                className={`px-2 py-1 rounded-full ${getLevelColor(course.level)}`}
              >
                <Text className="text-xs text-zinc-900 dark:text-zinc-100 font-medium capitalize">
                  {course.level}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View className="p-4 flex-1">
          <Text
            className="text-gray-900 dark:text-white font-semibold text-lg mb-2 h-14"
            numberOfLines={2}
          >
            {course.title}
          </Text>

          <View className="h-5 mb-2 justify-center">
            {course.subcategory ? (
              <Text className="text-primary-600 dark:text-primary-400 text-sm font-medium">
                {course.subcategory.name}
              </Text>
            ) : (
              <View />
            )}
          </View>

          <View className="flex-row items-center mt-auto">
            <View className="flex-row items-center flex-1">
              <BookOpen size={16} color="#9CA3AF" />
              <Text
                className="text-gray-500 dark:text-gray-400 text-xs ml-1"
                numberOfLines={1}
              >
                {course.sections_count || 0}{" "}
                {course.sections_count === 1 ? "chapter" : "chapters"}
              </Text>
            </View>

            <View className="flex-row items-center flex-1 ml-3">
              <FileText size={16} color="#9CA3AF" />
              <Text
                className="text-gray-500 dark:text-gray-400 text-xs ml-1"
                numberOfLines={1}
              >
                {course.documents_count || 0} docs
              </Text>
            </View>

            <View className="flex-row items-center flex-1 ml-2">
              {course.language ? (
                <>
                  <Globe size={16} color="#9CA3AF" />
                  <Text
                    className="text-gray-500 dark:text-gray-400 text-xs ml-1 capitalize"
                    numberOfLines={1}
                  >
                    {course.language}
                  </Text>
                </>
              ) : (
                <View />
              )}
            </View>

            <View className="bg-primary dark:bg-primary-900 p-2 ml-2 rounded-full">
              <ArrowRight size={24} color="#ffffff" />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
