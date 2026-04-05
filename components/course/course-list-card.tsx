import { type Course } from "@/lib/services/course-service";
import { useRouter } from "expo-router";
import {
  BookOpen,
  ChevronRight,
  FileText,
  Globe,
  Star,
} from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface CourseListCardProps {
  course: Course;
  onPress?: (course: Course) => void;
}

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80";

const getLevelTone = (level?: string | null) => {
  switch (level?.toLowerCase()) {
    case "beginner":
      return {
        background: "#DCFCE7",
        color: "#166534",
      };
    case "intermediate":
      return {
        background: "#FEF3C7",
        color: "#92400E",
      };
    case "advanced":
      return {
        background: "#FEE2E2",
        color: "#991B1B",
      };
    default:
      return {
        background: "#E2E8F0",
        color: "#334155",
      };
  }
};

export default function CourseListCard({
  course,
  onPress,
}: CourseListCardProps) {
  const router = useRouter();
  const levelTone = getLevelTone(course.level);
  const rating =
    typeof course.average_rating === "number"
      ? Number(course.average_rating).toFixed(1)
      : null;

  const handlePress = () => {
    if (onPress) {
      onPress(course);
      return;
    }

    router.push(`/course/${course.id}`);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handlePress}
      className="mb-3 overflow-hidden rounded-[26px] border border-slate-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <View className="flex-row p-3">
        <Image
          source={{ uri: course.thumbnail_url || PLACEHOLDER_IMAGE }}
          className="h-24 w-24 rounded-[10px] bg-slate-200 dark:bg-secondary-800"
          resizeMode="cover"
        />

        <View className="ml-3 flex-1 justify-between">
          <View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                {course.level ? (
                  <View
                    className="rounded-full px-2.5 py-1"
                    style={{ backgroundColor: levelTone.background }}
                  >
                    <Text
                      className="text-[11px] font-semibold capitalize"
                      style={{ color: levelTone.color }}
                    >
                      {course.level}
                    </Text>
                  </View>
                ) : null}

                {course.is_free ? (
                  <View className="ml-2 rounded-full bg-emerald-50 px-2.5 py-1">
                    <Text className="text-[11px] font-semibold text-emerald-700">
                      Free
                    </Text>
                  </View>
                ) : null}
              </View>

              <View className="rounded-full bg-primary p-2">
                <ChevronRight size={16} color="#FFFFFF" />
              </View>
            </View>

            <Text
              numberOfLines={2}
              className="mt-3 text-base font-semibold leading-6 text-slate-900 dark:text-white"
            >
              {course.title}
            </Text>

            {!!course.subcategory?.name && (
              <Text
                numberOfLines={1}
                className="mt-1 text-sm font-medium text-primary dark:text-primary-300"
              >
                {course.subcategory.name}
              </Text>
            )}
          </View>

          <View className="mt-3 flex-row flex-wrap items-center">
            <View className="mr-3 flex-row items-center">
              <BookOpen size={14} color="#64748B" />
              <Text className="ml-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {course.sections_count ?? 0} sections
              </Text>
            </View>

            <View className="mr-3 flex-row items-center">
              <FileText size={14} color="#64748B" />
              <Text className="ml-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {course.documents_count ?? 0} docs
              </Text>
            </View>

            {!!course.language && (
              <View className="mr-3 flex-row items-center">
                <Globe size={14} color="#64748B" />
                <Text className="ml-1 text-xs font-medium capitalize text-slate-500 dark:text-slate-400">
                  {course.language}
                </Text>
              </View>
            )}

            {rating ? (
              <View className="flex-row items-center">
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text className="ml-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {rating}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
