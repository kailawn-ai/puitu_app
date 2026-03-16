import ChapterSectionUI from "@/components/course/chapter-section-ui";
import CourseDetailUI from "@/components/course/course-detail-ui";
import { BackButton } from "@/components/ui/back-button";
import { CourseService, type Course } from "@/lib/services/course-service";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import { BackHandler, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CourseDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  const fetchCourse = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError("Missing course id");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await CourseService.getCourseById(
        id,
        "subcategory,qualifications,sections,videos",
      );

      const courseData = (res as any)?.data?.id ? (res as any).data : res;
      setCourse(courseData as Course);
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch course");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

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

  if (loading) {
    return (
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#101014", "#171717"]
            : ["#F8FAFC", "#E2E8F0"]
        }
        locations={[0, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center">
          <LottieView
            source={require("../../assets/icons/loader.json")}
            autoPlay
            loop
            style={{ width: 80, height: 80 }}
          />
          <Text className="mt-2 text-gray-500">Loading course...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-4">
        <BackButton
          onPress={() => router.back()}
          className="absolute top-12 left-4 z-10"
        />
        <Text className="text-red-600 font-semibold">Error</Text>
        <Text className="text-red-500 mt-1 text-center">{error}</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <BackButton
          onPress={() => router.back()}
          className="absolute top-12 left-4 z-10"
        />
        <Text className="text-gray-500">No course data</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={
        colorScheme === "dark" ? ["#101014", "#171717"] : ["#F8FAFC", "#E2E8F0"]
      }
      locations={[0, 1]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}
    >
      <BackButton className="absolute top-12 left-4 z-10" />
      <ScrollView className="flex-1">
        <View style={{ paddingTop: insets.top + 1 }}>
          <CourseDetailUI course={course} />
          <ChapterSectionUI
            sections={course.sections}
            course={course}
            onPressItem={(section) =>
              router.push({
                pathname: "/section/[id]",
                params: {
                  id: String(section.id),
                  courseId: String(course.id),
                },
              })
            }
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default CourseDetailScreen;
