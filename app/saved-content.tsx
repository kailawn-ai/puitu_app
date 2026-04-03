import CourseListCard from "@/components/course/course-list-card";
import { BackButton } from "@/components/ui/back-button";
import {
  CourseInteractionService,
  type SavedCoursesResponse,
  type SavedCourseRecord,
} from "@/lib/services/course-interaction-service";
import { LinearGradient } from "expo-linear-gradient";
import { Bookmark } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PAGE_SIZE = 10;

const normalizeSavedPayload = (payload?: SavedCoursesResponse) => {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      currentPage: 1,
      lastPage: 1,
    };
  }

  return {
    items: payload?.data ?? [],
    currentPage: payload?.current_page ?? 1,
    lastPage: payload?.last_page ?? 1,
  };
};

export default function SavedContentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [items, setItems] = useState<SavedCourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const savedCourses = useMemo(
    () =>
      items
        .map((item) => item.course)
        .filter((course): course is NonNullable<SavedCourseRecord["course"]> =>
          Boolean(course),
        ),
    [items],
  );

  const loadSavedContent = useCallback(
    async (
      nextPage = 1,
      mode: "initial" | "refresh" | "append" = "initial",
    ) => {
      if (mode === "initial") {
        setLoading(true);
        setError(null);
      } else if (mode === "refresh") {
        setRefreshing(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await CourseInteractionService.getUserSavedCourses({
          page: nextPage,
          per_page: PAGE_SIZE,
        });

        const payload = response.data;
        const normalized = normalizeSavedPayload(payload);

        setItems((current) =>
          nextPage === 1
            ? normalized.items
            : [...current, ...normalized.items],
        );
        setPage(normalized.currentPage);
        setLastPage(normalized.lastPage);
      } catch (loadError: any) {
        setError(
          loadError?.data?.message ||
            loadError?.message ||
            "Failed to load saved content.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadSavedContent();
  }, [loadSavedContent]);

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

  const handleRefresh = useCallback(async () => {
    await loadSavedContent(1, "refresh");
  }, [loadSavedContent]);

  const handleLoadMore = useCallback(async () => {
    if (loading || refreshing || loadingMore || page >= lastPage) {
      return;
    }

    await loadSavedContent(page + 1, "append");
  }, [lastPage, loadSavedContent, loading, loadingMore, page, refreshing]);

  return (
    <LinearGradient
      colors={isDark ? ["#09090B", "#18181B"] : ["#F8FAFC", "#E2E8F0"]}
      locations={[0, 1]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1" style={{ paddingTop: insets.top + 8 }}>
        <View className="mb-4 px-4">
          <BackButton onPress={() => router.back()} />
        </View>

        <View className="px-5 pb-4">
          <Text className="text-3xl font-black text-slate-900 dark:text-white">
            Saved Content
          </Text>
          <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Revisit the courses you saved and jump back in anytime.
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="small" color="#7A25FF" />
            <Text className="mt-3 text-slate-500 dark:text-slate-400">
              Loading saved courses...
            </Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-base font-semibold text-rose-600 dark:text-rose-300">
              Unable to load saved content
            </Text>
            <Text className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
              {error}
            </Text>
          </View>
        ) : savedCourses.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/10">
              <Bookmark size={30} color={isDark ? "#FCD34D" : "#D97706"} />
            </View>
            <Text className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
              No saved courses yet
            </Text>
            <Text className="mt-2 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
              Save a course from its detail page and it will show up here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={savedCourses}
            keyExtractor={(item) => `saved-course-${item.id}`}
            renderItem={({ item }) => (
              <View className="px-4">
                <CourseListCard course={item} />
              </View>
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.35}
            ListFooterComponent={
              loadingMore ? (
                <View className="items-center py-4">
                  <ActivityIndicator size="small" color="#7A25FF" />
                </View>
              ) : null
            }
            contentContainerStyle={{
              paddingBottom: insets.bottom + 24,
            }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </LinearGradient>
  );
}
