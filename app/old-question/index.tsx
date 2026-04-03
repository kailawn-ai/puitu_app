import OldCardUI from "@/components/old-question/old-card-ui";
import OldSortFilterModal, {
  type OldQuestionSortOption,
} from "@/components/old-question/old-sort-filter-modal";
import { BackButton } from "@/components/ui/back-button";
import {
  OldService,
  type QualificationLite,
  type OldQuestion,
  type PaginatedResponse,
  type SemesterLite,
  type YearLite,
} from "@/lib/services/old-service";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  FileQuestion,
  Filter,
  LayoutGrid,
  List,
  Search,
  X,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PAGE_SIZE = 12;

type ViewMode = "grid" | "list";

const SORT_OPTIONS: OldQuestionSortOption[] = [
  { label: "Newest", sort_by: "created_at", sort_order: "desc" },
  { label: "Oldest", sort_by: "created_at", sort_order: "asc" },
  { label: "Recent", sort_by: "recent" },
  { label: "Title A-Z", sort_by: "title", sort_order: "asc" },
  { label: "Course", sort_by: "course_name", sort_order: "asc" },
  { label: "Year", sort_by: "year_name", sort_order: "asc" },
  { label: "Semester", sort_by: "semester_name", sort_order: "asc" },
];

function parseOptionalNumber(value?: string | string[]) {
  if (Array.isArray(value)) {
    return parseOptionalNumber(value[0]);
  }

  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildTitleFromFilters(filters: {
  title?: string | string[];
  courseId?: string | string[];
  yearId?: string | string[];
  semesterId?: string | string[];
  sectionId?: string | string[];
}) {
  if (typeof filters.title === "string" && filters.title.trim()) {
    return filters.title;
  }

  if (filters.sectionId) return "Subject Old Questions";
  if (filters.semesterId) return "Semester Old Questions";
  if (filters.yearId) return "Year Old Questions";
  if (filters.courseId) return "Course Old Questions";

  return "Old Questions";
}

function OldQuestionGridCard({
  question,
  onPress,
}: {
  question: OldQuestion;
  onPress: () => void;
}) {
  const imageUrl =
    question.detail?.image || question.thumbnail_url || undefined;
  const hasImage = !!imageUrl && /^https?:\/\//i.test(imageUrl);
  const courseText =
    question.course?.title ?? question.course?.name ?? "Unknown course";
  const yearText =
    question.year?.year?.toString() ?? question.year?.name ?? "Year";

  return (
    <Pressable
      onPress={onPress}
      className="flex-1 rounded-[24px] overflow-hidden border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      style={{ minHeight: 250 }}
    >
      <View className="h-36 bg-slate-100 dark:bg-zinc-800">
        {hasImage ? (
          <Image source={{ uri: imageUrl }} className="w-full h-full" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <FileQuestion size={30} color="#94A3B8" />
          </View>
        )}

        <View className="absolute top-3 right-3 rounded-full bg-slate-900/80 px-3 py-1 dark:bg-black/70">
          <Text className="text-xs font-semibold text-white">{yearText}</Text>
        </View>
      </View>

      <View className="flex-1 px-4 py-4">
        <Text
          className="text-base font-semibold text-slate-900 dark:text-white"
          numberOfLines={2}
        >
          {question.title}
        </Text>

        <Text
          className="mt-2 text-sm text-slate-500 dark:text-slate-400"
          numberOfLines={2}
        >
          {courseText}
        </Text>

        <View className="mt-3 self-start rounded-full bg-slate-100 px-3 py-1 dark:bg-zinc-800">
          <Text className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {question.detail?.is_free_preview ? "Free Preview" : "Premium"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function OldQuestionListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams<{
    title?: string;
    courseId?: string;
    yearId?: string;
    semesterId?: string;
    sectionId?: string;
    qualificationId?: string;
  }>();

  const screenTitle = buildTitleFromFilters(params);
  const initialCourseId = parseOptionalNumber(params.courseId);
  const initialYearId = parseOptionalNumber(params.yearId);
  const initialSemesterId = parseOptionalNumber(params.semesterId);
  const sectionId = parseOptionalNumber(params.sectionId);
  const qualificationId = parseOptionalNumber(params.qualificationId);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedSort, setSelectedSort] = useState<OldQuestionSortOption>(
    SORT_OPTIONS[0],
  );
  const [selectedQualificationId, setSelectedQualificationId] = useState<
    number | undefined
  >(qualificationId ?? undefined);
  const [selectedYearId, setSelectedYearId] = useState<number | undefined>(
    initialYearId,
  );
  const [selectedSemesterId, setSelectedSemesterId] = useState<
    number | undefined
  >(initialSemesterId);
  const [showSortFilterModal, setShowSortFilterModal] = useState(false);
  const [questions, setQuestions] = useState<OldQuestion[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<OldQuestion> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qualificationsMeta, setQualificationsMeta] = useState<
    PaginatedResponse<QualificationLite> | null
  >(null);
  const [yearsMeta, setYearsMeta] = useState<PaginatedResponse<YearLite> | null>(
    null,
  );
  const [semestersMeta, setSemestersMeta] = useState<PaginatedResponse<SemesterLite> | null>(
    null,
  );
  const [qualificationsLoading, setQualificationsLoading] = useState(false);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [semestersLoading, setSemestersLoading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timeout);
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

  const mergePaginated = useCallback(
    <T extends { id: number },>(
      current: PaginatedResponse<T> | null,
      incoming: PaginatedResponse<T>,
    ): PaginatedResponse<T> => {
      if (!current || incoming.current_page <= 1) {
        return incoming;
      }

      const merged = [...current.data, ...incoming.data];
      const uniqueMap = new Map<number, T>();
      merged.forEach((item) => uniqueMap.set(item.id, item));

      return {
        ...incoming,
        data: Array.from(uniqueMap.values()),
      };
    },
    [],
  );

  const loadSortOptions = useCallback(
    async (
      options?: {
        qualifications_page?: number;
        years_page?: number;
        semesters_page?: number;
      },
      list?: "qualifications" | "years" | "semesters" | "all",
    ) => {
      const shouldLoadAll = !list || list === "all";
      if (shouldLoadAll || list === "qualifications") {
        setQualificationsLoading(true);
      }
      if (shouldLoadAll || list === "years") setYearsLoading(true);
      if (shouldLoadAll || list === "semesters") setSemestersLoading(true);

      try {
        const response = await OldService.getBrowseSortOptions({
          per_page: 20,
          qualifications_page: options?.qualifications_page,
          years_page: options?.years_page,
          semesters_page: options?.semesters_page,
        });

        if (shouldLoadAll || list === "qualifications") {
          setQualificationsMeta((current) =>
            mergePaginated(current, response.qualifications),
          );
        }

        if (shouldLoadAll || list === "years") {
          setYearsMeta((current) => mergePaginated(current, response.years));
        }

        if (shouldLoadAll || list === "semesters") {
          setSemestersMeta((current) =>
            mergePaginated(current, response.semesters),
          );
        }
      } finally {
        if (shouldLoadAll || list === "qualifications") {
          setQualificationsLoading(false);
        }
        if (shouldLoadAll || list === "years") setYearsLoading(false);
        if (shouldLoadAll || list === "semesters") setSemestersLoading(false);
      }
    },
    [mergePaginated],
  );

  useEffect(() => {
    if (!showSortFilterModal) return;
    if (qualificationsMeta && yearsMeta && semestersMeta) return;
    loadSortOptions(undefined, "all");
  }, [
    showSortFilterModal,
    qualificationsMeta,
    yearsMeta,
    semestersMeta,
    loadSortOptions,
  ]);

  const fetchQuestions = useCallback(
    async (page = 1, mode: "replace" | "append" = "replace") => {
      const shouldAppend = mode === "append";

      if (shouldAppend) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        setError(null);

        const response = await OldService.getOldQuestions({
          page,
          per_page: PAGE_SIZE,
          search: debouncedSearch || undefined,
          qualification_id: selectedQualificationId,
          course_id: initialCourseId,
          year_id: selectedYearId,
          semester_id: selectedSemesterId,
          section_id: sectionId,
          sort_by: selectedSort.sort_by,
          sort_order: selectedSort.sort_order,
        });

        setMeta(response);
        setQuestions((current) =>
          shouldAppend ? [...current, ...response.data] : response.data,
        );
      } catch (err: any) {
        setError(
          err?.data?.message ?? err?.message ?? "Failed to load old questions.",
        );

        if (!shouldAppend) {
          setQuestions([]);
          setMeta(null);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [
      debouncedSearch,
      selectedQualificationId,
      initialCourseId,
      sectionId,
      selectedSemesterId,
      selectedSort.sort_by,
      selectedSort.sort_order,
      selectedYearId,
    ],
  );

  useEffect(() => {
    fetchQuestions(1, "replace");
  }, [fetchQuestions]);

  const appliedFilterBits = useMemo(() => {
    const items: string[] = [];

    if (selectedQualificationId) items.push("Qualification");
    if (initialCourseId) items.push("Course");
    if (selectedYearId) items.push("Year");
    if (selectedSemesterId) items.push("Semester");
    if (sectionId) items.push("Subject");

    return items;
  }, [
    selectedQualificationId,
    initialCourseId,
    sectionId,
    selectedSemesterId,
    selectedYearId,
  ]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchQuestions(1, "replace");
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || !meta) {
      return;
    }

    if (meta.current_page >= meta.last_page) {
      return;
    }

    fetchQuestions(meta.current_page + 1, "append");
  };

  const resultsLabel = meta?.total ?? questions.length;
  const isDarkMode = colorScheme === "dark";

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
            {screenTitle}
          </Text>
          <View className="w-16" />
        </View>
      </View>

      <FlatList
        key={viewMode}
        data={questions}
        numColumns={viewMode === "grid" ? 2 : 1}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={
          viewMode === "grid" ? { gap: 12, paddingHorizontal: 24 } : undefined
        }
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + 28, 36),
          paddingHorizontal: viewMode === "list" ? 1 : 0,
          flexGrow: 1,
        }}
        onEndReachedThreshold={0.35}
        onEndReached={handleLoadMore}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) =>
          viewMode === "list" ? (
            <OldCardUI
              question={item}
              variant="compact"
              onPressPreview={() => router.push(`/old-question/${item.id}`)}
            />
          ) : (
            <OldQuestionGridCard
              question={item}
              onPress={() => router.push(`/old-question/${item.id}`)}
            />
          )
        }
        ListHeaderComponent={
          <View className="px-5 pb-5">
            <View className="mt-5 flex-row items-center rounded-[26px] border border-slate-200 bg-white px-4 py-1 dark:border-zinc-700 dark:bg-zinc-800">
              <Search size={18} color={isDarkMode ? "#94A3B8" : "#64748B"} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search old questions, subjects, courses..."
                placeholderTextColor="#94A3B8"
                className="flex-row px-3 py-3 justify-center text-base text-slate-900 dark:text-white"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {search ? (
                <Pressable
                  onPress={() => setSearch("")}
                  className="h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-zinc-700"
                >
                  <X size={16} color={isDarkMode ? "#E2E8F0" : "#475569"} />
                </Pressable>
              ) : null}
            </View>

            <View className="mt-4 flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-slate-400 dark:text-slate-500">
                  {resultsLabel} questions found
                </Text>
                {!!appliedFilterBits.length && (
                  <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Scoped by {appliedFilterBits.join(" • ")}
                  </Text>
                )}
              </View>

              <View className="flex-row items-center rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-zinc-700 dark:bg-zinc-800">
                <Pressable
                  onPress={() => setViewMode("grid")}
                  className={`rounded-full px-3 py-2 ${
                    viewMode === "grid" ? "bg-white dark:bg-zinc-700" : ""
                  }`}
                >
                  <LayoutGrid
                    size={16}
                    color={isDarkMode ? "#E2E8F0" : "#334155"}
                  />
                </Pressable>
                <Pressable
                  onPress={() => setViewMode("list")}
                  className={`rounded-full px-3 py-2 ${
                    viewMode === "list" ? "bg-white dark:bg-zinc-700" : ""
                  }`}
                >
                  <List size={16} color={isDarkMode ? "#E2E8F0" : "#334155"} />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={() => setShowSortFilterModal(true)}
              className="mt-4 flex-row items-center justify-between rounded-[22px] border border-slate-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <View className="flex-row items-center">
                <Filter size={16} color={isDarkMode ? "#E2E8F0" : "#334155"} />
                <Text className="ml-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Sort & Filter
                </Text>
              </View>
              <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {selectedSort.label}
              </Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="py-6">
              <ActivityIndicator color={isDarkMode ? "#FFFFFF" : "#334155"} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View className="px-5 py-14">
              <ActivityIndicator color={isDarkMode ? "#FFFFFF" : "#334155"} />
              <Text className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Loading old questions...
              </Text>
            </View>
          ) : (
            <View className="mx-5 rounded-[28px] border border-dashed border-slate-300 bg-white/80 px-5 py-10 dark:border-zinc-700 dark:bg-zinc-900/85">
              <Text className="text-center text-lg font-semibold text-slate-900 dark:text-white">
                {error
                  ? "Unable to load old questions"
                  : "No old questions found"}
              </Text>
              <Text className="mt-2 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
                {error ??
                  "Try another search or switch the sort option to explore more results."}
              </Text>
              {!!error && (
                <Pressable
                  onPress={() => fetchQuestions(1, "replace")}
                  className="mt-5 self-center rounded-full bg-slate-900 px-5 py-3 dark:bg-white"
                >
                  <Text className="font-semibold text-white dark:text-zinc-900">
                    Retry
                  </Text>
                </Pressable>
              )}
            </View>
          )
        }
      />

      <OldSortFilterModal
        visible={showSortFilterModal}
        onClose={() => setShowSortFilterModal(false)}
        sortOptions={SORT_OPTIONS}
        initialSort={selectedSort}
        initialQualificationId={selectedQualificationId}
        initialYearId={selectedYearId}
        initialSemesterId={selectedSemesterId}
        qualifications={qualificationsMeta}
        years={yearsMeta}
        semesters={semestersMeta}
        qualificationsLoading={qualificationsLoading}
        yearsLoading={yearsLoading}
        semestersLoading={semestersLoading}
        onLoadMoreQualifications={() => {
          if (!qualificationsMeta || qualificationsLoading) return;
          if (qualificationsMeta.current_page >= qualificationsMeta.last_page) {
            return;
          }
          loadSortOptions(
            {
              qualifications_page: qualificationsMeta.current_page + 1,
              years_page: yearsMeta?.current_page ?? 1,
              semesters_page: semestersMeta?.current_page ?? 1,
            },
            "qualifications",
          );
        }}
        onLoadMoreYears={() => {
          if (!yearsMeta || yearsLoading) return;
          if (yearsMeta.current_page >= yearsMeta.last_page) return;
          loadSortOptions(
            {
              qualifications_page: qualificationsMeta?.current_page ?? 1,
              years_page: yearsMeta.current_page + 1,
              semesters_page: semestersMeta?.current_page ?? 1,
            },
            "years",
          );
        }}
        onLoadMoreSemesters={() => {
          if (!semestersMeta || semestersLoading) return;
          if (semestersMeta.current_page >= semestersMeta.last_page) return;
          loadSortOptions(
            {
              qualifications_page: qualificationsMeta?.current_page ?? 1,
              years_page: yearsMeta?.current_page ?? 1,
              semesters_page: semestersMeta.current_page + 1,
            },
            "semesters",
          );
        }}
        onApply={({ sort, qualificationId, yearId, semesterId }) => {
          setSelectedSort(sort);
          setSelectedQualificationId(qualificationId);
          setSelectedYearId(yearId);
          setSelectedSemesterId(semesterId);
        }}
      />
    </LinearGradient>
  );
}
