import QualificationBrowseCard from "@/components/qualification/qualification-browse-card";
import { BackButton } from "@/components/ui/back-button";
import {
  qualificationService,
  type QualificationListResponse,
  type PaginatedResponse,
  type Qualification,
} from "@/lib/services/qualification-service";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Search, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
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

const PAGE_SIZE = 12;

const normalizeQualificationResponse = (
  response: QualificationListResponse,
): {
  items: Qualification[];
  meta: PaginatedResponse<Qualification> | null;
} => {
  if (Array.isArray(response)) {
    return {
      items: response,
      meta: null,
    };
  }

  return {
    items: response.data ?? [],
    meta: response,
  };
};

export default function CourseQualificationBrowseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Qualification> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

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

  const fetchQualifications = useCallback(
    async (page = 1, mode: "replace" | "append" = "replace") => {
      const shouldAppend = mode === "append";

      if (shouldAppend) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        setError(null);

        const response = await qualificationService.getPublic({
          search: debouncedSearch || undefined,
          per_page: PAGE_SIZE,
          page,
          sort: "name",
        });

        const { items: nextItems, meta: nextMeta } =
          normalizeQualificationResponse(response);

        setMeta(nextMeta);
        setQualifications((prev) =>
          shouldAppend ? [...prev, ...nextItems] : nextItems,
        );
      } catch (err: any) {
        setError(
          err?.data?.error ||
            err?.data?.message ||
            err?.message ||
            "Failed to load qualifications.",
        );

        if (!shouldAppend) {
          setQualifications([]);
          setMeta(null);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch],
  );

  useEffect(() => {
    fetchQualifications(1, "replace");
  }, [fetchQualifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchQualifications(1, "replace");
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || !meta) {
      return;
    }

    if (meta.current_page >= meta.last_page) {
      return;
    }

    fetchQualifications(meta.current_page + 1, "append");
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
        data={qualifications}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        renderItem={({ item }) => (
          <View className="flex-1" style={{ maxWidth: "48%" }}>
            <QualificationBrowseCard
              qualification={item}
              compact
              onPress={(qualification) =>
                router.push({
                  pathname: "/course/list",
                  params: {
                    qualificationId: String(qualification.id),
                    title: qualification.name,
                  },
                })
              }
            />
          </View>
        )}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + 24, 32),
          flexGrow: 1,
          paddingHorizontal: 20,
        }}
        columnWrapperStyle={{
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.35}
        onEndReached={handleLoadMore}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View className="pb-4">
            <View className="mt-5 flex-row items-center rounded-[30px] border border-slate-200 bg-white px-4 py-1 dark:border-secondary-700 dark:bg-secondary-900">
              <Search size={18} color={isDarkMode ? "#94A3B8" : "#64748B"} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search your qualifications"
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
                {meta.total} qualifications found
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="px-5 py-12">
              <ActivityIndicator color={isDarkMode ? "#FFFFFF" : "#7A25FF"} />
              <Text className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Loading qualifications...
              </Text>
            </View>
          ) : (
            <View className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 px-5 py-10 dark:border-secondary-700 dark:bg-secondary-900/85">
              <Text className="text-center text-lg font-semibold text-slate-900 dark:text-white">
                {error
                  ? "Unable to load qualifications"
                  : "No qualifications found"}
              </Text>
              <Text className="mt-2 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
                {error || "Try another search term or refresh the list."}
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
