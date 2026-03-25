import CourseListCard from "@/components/course/course-list-card";
import { BackButton } from "@/components/ui/back-button";
import {
  CourseService,
  type Course,
  type CourseListResponse,
  type PaginationMeta,
} from "@/lib/services/course-service";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Search, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PAGE_SIZE = 10;

const normalizeCourseResponse = (
  response: CourseListResponse,
): {
  items: Course[];
  meta: PaginationMeta | null;
} => {
  if (Array.isArray(response)) {
    return {
      items: response,
      meta: null,
    };
  }

  return {
    items: response.data ?? [],
    meta: response.meta ?? null,
  };
};

export default function QualificationCoursesScreen() {
  const { qualificationId, title } = useLocalSearchParams<{
    qualificationId?: string;
    title?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const numericQualificationId = qualificationId
    ? Number(qualificationId)
    : NaN;

  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const fetchCourses = useCallback(
    async (page = 1, mode: "replace" | "append" = "replace") => {
      const shouldAppend = mode === "append";

      if (!Number.isFinite(numericQualificationId)) {
        setError("Missing qualification id.");
        setCourses([]);
        setMeta(null);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }

      if (shouldAppend) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        setError(null);

        const response = await CourseService.getCoursesByQualification(
          numericQualificationId,
          {
            page,
            per_page: PAGE_SIZE,
            status: "published",
            is_active: true,
            sort: "-created_at",
          },
        );

        const { items: nextCourses, meta: nextMeta } =
          normalizeCourseResponse(response);

        setMeta(nextMeta);
        setCourses((prev) =>
          shouldAppend ? [...prev, ...nextCourses] : nextCourses,
        );
      } catch (err: any) {
        setError(
          err?.data?.error ||
            err?.data?.message ||
            err?.message ||
            "Failed to load courses for this qualification.",
        );

        if (!shouldAppend) {
          setCourses([]);
          setMeta(null);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [numericQualificationId],
  );

  useEffect(() => {
    fetchCourses(1, "replace");
  }, [fetchCourses]);

  const filteredCourses = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    if (!normalizedQuery) {
      return courses;
    }

    return courses.filter((course) =>
      `${course.title} ${course.summary ?? ""} ${course.subcategory?.name ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [courses, search]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCourses(1, "replace");
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || !meta) {
      return;
    }

    if (meta.current_page >= meta.last_page) {
      return;
    }

    fetchCourses(meta.current_page + 1, "append");
  };

  return (
    <LinearGradient
      colors={isDarkMode ? ["#09090B", "#171717"] : ["#F8FAFC", "#E2E8F0"]}
      locations={[0, 1]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}
    >
      <View
        className="px-5"
        style={{ paddingTop: insets.top + 4, paddingBottom: 8 }}
      >
        <View className="flex-row items-center justify-between">
          <BackButton onPress={() => router.back()} />
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            Courses
          </Text>
          <View className="h-12 w-12" />
        </View>
      </View>

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <CourseListCard course={item} />}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + 24, 32),
          flexGrow: 1,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.35}
        onEndReached={handleLoadMore}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View className="pb-4">
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              {title || "Qualification Courses"}
            </Text>

            <View className="mt-5 flex-row items-center rounded-[30px] border border-slate-200 bg-white px-4 py-1 dark:border-secondary-700 dark:bg-secondary-900">
              <Search size={18} color={isDarkMode ? "#94A3B8" : "#64748B"} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search loaded courses"
                placeholderTextColor="#94A3B8"
                className="flex-1 px-3 py-3 text-base text-slate-900 dark:text-white"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {search ? (
                <TouchableOpacity
                  onPress={() => setSearch("")}
                  className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-secondary-800"
                >
                  <X size={16} color={isDarkMode ? "#CBD5E1" : "#475569"} />
                </TouchableOpacity>
              ) : null}
            </View>

            {meta ? (
              <Text className="mt-3 text-xs font-medium uppercase tracking-[1px] text-slate-400 dark:text-slate-500">
                {search.trim() ? filteredCourses.length : meta.total} courses
                found
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="px-5 py-12">
              <ActivityIndicator color={isDarkMode ? "#FFFFFF" : "#7A25FF"} />
              <Text className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Loading courses...
              </Text>
            </View>
          ) : (
            <View className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 px-5 py-10 dark:border-secondary-700 dark:bg-secondary-900/85">
              <Text className="text-center text-lg font-semibold text-slate-900 dark:text-white">
                {error ? "Unable to load courses" : "No courses found"}
              </Text>
              <Text className="mt-2 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
                {error ||
                  "There are no courses registered for this qualification yet."}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="py-5">
              <ActivityIndicator color={isDarkMode ? "#FFFFFF" : "#7A25FF"} />
            </View>
          ) : null
        }
      />
    </LinearGradient>
  );
}
