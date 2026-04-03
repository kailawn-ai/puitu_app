import { BackButton } from "@/components/ui/back-button";
import JobService, {
  type Job,
  type JobListParams,
  type PaginatedResponse,
} from "@/lib/services/job-service";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowDownUp,
  BriefcaseBusiness,
  Check,
  Search,
  X,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PAGE_SIZE = 12;

type SortOption = {
  label: string;
  sort_by: NonNullable<JobListParams["sort_by"]>;
  sort_dir: NonNullable<JobListParams["sort_dir"]>;
};

const SORT_OPTIONS: SortOption[] = [
  { label: "Newest", sort_by: "created_at", sort_dir: "desc" },
  { label: "Oldest", sort_by: "created_at", sort_dir: "asc" },
  { label: "Title A-Z", sort_by: "title", sort_dir: "asc" },
  { label: "Job Type", sort_by: "job_type", sort_dir: "asc" },
];

const JOB_TYPE_LABEL: Record<Job["job_type"], string> = {
  government: "Government",
  public: "Public",
  private: "Private",
};

const JOB_TYPE_OPTIONS: Array<{
  label: string;
  value: NonNullable<JobListParams["job_type"]>;
}> = [
  { label: "Government", value: "government" },
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
];

function typeLabel(jobType: Job["job_type"] | undefined): string {
  if (!jobType) return "Job";
  return JOB_TYPE_LABEL[jobType] ?? jobType;
}

function dateLabel(input?: string): string {
  if (!input) return "Recently posted";

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return "Recently posted";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function JobListCard({ job, onPress }: { job: Job; onPress: () => void }) {
  const qualificationText =
    job.qualifications?.map((q) => q.name).filter(Boolean).join(", ") ||
    "All qualifications";

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
    >
      <View className="flex-row p-4">
        <View className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-100 dark:bg-zinc-800">
          {job.image ? (
            <Image source={{ uri: job.image }} className="h-full w-full" />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <BriefcaseBusiness size={26} color="#94A3B8" />
            </View>
          )}
        </View>

        <View className="ml-3 flex-1">
          <Text
            className="text-base font-semibold text-slate-900 dark:text-white"
            numberOfLines={2}
          >
            {job.title}
          </Text>

          <View className="mt-2 flex-row flex-wrap items-center">
            <View className="mr-2 rounded-full bg-blue-50 px-2.5 py-1 dark:bg-blue-900/30">
              <Text className="text-xs font-medium text-blue-700 dark:text-blue-300">
                {typeLabel(job.job_type)}
              </Text>
            </View>

            {!!job.tag && (
              <View className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-zinc-800">
                <Text className="text-xs text-slate-600 dark:text-slate-300">
                  {job.tag}
                </Text>
              </View>
            )}
          </View>

          <Text
            className="mt-2 text-xs text-slate-500 dark:text-slate-400"
            numberOfLines={1}
          >
            {qualificationText}
          </Text>

          <Text className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {dateLabel(job.created_at)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function JobListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSort, setSelectedSort] = useState<SortOption>(SORT_OPTIONS[0]);
  const [selectedJobType, setSelectedJobType] = useState<
    JobListParams["job_type"] | undefined
  >(undefined);
  const [showJobTypeModal, setShowJobTypeModal] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Job> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 320);

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

  const fetchJobs = useCallback(
    async (page = 1, mode: "replace" | "append" = "replace") => {
      const shouldAppend = mode === "append";

      if (shouldAppend) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        setError(null);

        const response = await JobService.getPublicJobs({
          page,
          per_page: PAGE_SIZE,
          search: debouncedSearch || undefined,
          job_type: selectedJobType,
          sort_by: selectedSort.sort_by,
          sort_dir: selectedSort.sort_dir,
        });

        setMeta(response);
        setJobs((current) =>
          shouldAppend ? [...current, ...response.data] : response.data,
        );
      } catch (err: any) {
        setError(
          err?.data?.message || err?.message || "Failed to load job vacancies.",
        );

        if (!shouldAppend) {
          setJobs([]);
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
      selectedJobType,
      selectedSort.sort_by,
      selectedSort.sort_dir,
    ],
  );

  useEffect(() => {
    fetchJobs(1, "replace");
  }, [fetchJobs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchJobs(1, "replace");
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || !meta) {
      return;
    }

    if (meta.current_page >= meta.last_page) {
      return;
    }

    fetchJobs(meta.current_page + 1, "append");
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
            Job Vacancy
          </Text>
          <View className="h-12 w-12" />
        </View>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + 24, 32),
          flexGrow: 1,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.3}
        onEndReached={handleLoadMore}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => (
          <JobListCard
            job={item}
            onPress={() => router.push(`/job/${item.id}`)}
          />
        )}
        ListHeaderComponent={
          <View className="pb-4">
            <View className="mt-5 flex-row items-center rounded-[30px] border border-slate-200 bg-white px-4 py-1 dark:border-zinc-700 dark:bg-zinc-900">
              <Search size={18} color={isDarkMode ? "#94A3B8" : "#64748B"} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search jobs, tags, keywords..."
                placeholderTextColor="#94A3B8"
                className="flex-1 px-3 py-3 text-base text-slate-900 dark:text-white"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {search ? (
                <Pressable
                  onPress={() => setSearch("")}
                  className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800"
                >
                  <X size={16} color={isDarkMode ? "#CBD5E1" : "#475569"} />
                </Pressable>
              ) : null}
            </View>

            <View className="mt-4 flex-row items-center">
              <View className="mr-2 rounded-full bg-slate-100 px-3 py-2 dark:bg-zinc-800">
                <ArrowDownUp
                  size={14}
                  color={isDarkMode ? "#CBD5E1" : "#475569"}
                />
              </View>

              <FlatList
                horizontal
                data={SORT_OPTIONS}
                keyExtractor={(item) => `${item.sort_by}-${item.sort_dir}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 6 }}
                ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
                renderItem={({ item }) => {
                  const active =
                    selectedSort.sort_by === item.sort_by &&
                    selectedSort.sort_dir === item.sort_dir;

                  return (
                    <Pressable
                      onPress={() => {
                        if (item.sort_by === "job_type") {
                          setSelectedSort(item);
                          setShowJobTypeModal(true);
                          return;
                        }

                        setSelectedSort(item);
                      }}
                      className={`rounded-full px-4 py-2.5 ${
                        active
                          ? "bg-slate-900 dark:bg-white"
                          : "border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          active
                            ? "text-white dark:text-zinc-900"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            </View>

            <Text className="mt-3 text-xs font-medium uppercase tracking-[1px] text-slate-400 dark:text-slate-500">
              {meta?.total ?? jobs.length} jobs found
            </Text>
            {!!selectedJobType && (
              <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Filtered by {typeLabel(selectedJobType)}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="px-5 py-12">
              <ActivityIndicator color={isDarkMode ? "#FFFFFF" : "#334155"} />
              <Text className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Loading jobs...
              </Text>
            </View>
          ) : (
            <View className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 px-5 py-10 dark:border-zinc-700 dark:bg-zinc-900/85">
              <Text className="text-center text-lg font-semibold text-slate-900 dark:text-white">
                {error ? "Unable to load jobs" : "No jobs found"}
              </Text>
              <Text className="mt-2 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
                {error ||
                  "Try another search or switch sorting to explore more vacancies."}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="py-5">
              <ActivityIndicator color={isDarkMode ? "#FFFFFF" : "#334155"} />
            </View>
          ) : null
        }
      />

      <Modal
        visible={showJobTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJobTypeModal(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/35 px-6">
          <View className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-slate-900 dark:text-white">
                Select Job Type
              </Text>
              <Pressable
                onPress={() => setShowJobTypeModal(false)}
                className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800"
              >
                <X size={16} color={isDarkMode ? "#E2E8F0" : "#334155"} />
              </Pressable>
            </View>

            <View className="mt-4">
              <Pressable
                onPress={() => {
                  setSelectedJobType(undefined);
                  setShowJobTypeModal(false);
                }}
                className="mb-2 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  All Types
                </Text>
                {!selectedJobType && (
                  <Check size={16} color={isDarkMode ? "#E2E8F0" : "#334155"} />
                )}
              </Pressable>

              {JOB_TYPE_OPTIONS.map((option) => {
                const active = selectedJobType === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setSelectedJobType(option.value);
                      setShowJobTypeModal(false);
                    }}
                    className={`mb-2 flex-row items-center justify-between rounded-2xl border px-4 py-3 ${
                      active
                        ? "border-slate-900 bg-slate-900 dark:border-white dark:bg-white"
                        : "border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        active
                          ? "text-white dark:text-zinc-900"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {option.label}
                    </Text>
                    {active && (
                      <Check
                        size={16}
                        color={isDarkMode ? "#09090B" : "#FFFFFF"}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}
