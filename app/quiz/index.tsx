import QuizCard from "@/components/quiz/quiz-card-ui";
import { BackButton } from "@/components/ui/back-button";
import ProfileResponseService from "@/lib/services/profile-response-service";
import QuizService, {
  type PaginatedResponse,
  type Quiz,
} from "@/lib/services/quiz-service";
import { useAlert } from "@/providers/alert-provider";
import { useProfileResponseStore } from "@/store/profile-response-store";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Search, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

type QuizMetaMap = Record<
  number,
  Pick<PaginatedResponse<Quiz>, "current_page" | "last_page" | "total">
>;

const dedupeQuizzes = (items: Quiz[]) => {
  const seen = new Set<number>();

  return items.filter((quiz) => {
    if (seen.has(quiz.id)) {
      return false;
    }

    seen.add(quiz.id);
    return true;
  });
};

export default function QualificationQuizListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showError } = useAlert();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const profileResponse = useProfileResponseStore(
    (state) => state.profileResponse,
  );
  const setProfileResponseStore = useProfileResponseStore(
    (state) => state.setProfileResponse,
  );

  const [search, setSearch] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [metaByQualification, setMetaByQualification] = useState<QuizMetaMap>(
    {},
  );
  const [qualificationIds, setQualificationIds] = useState<number[]>([]);
  const [qualificationNames, setQualificationNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const metaByQualificationRef = useRef<QuizMetaMap>({});

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

  useEffect(() => {
    if (profileResponse) {
      const nextQualifications = profileResponse.detail?.qualifications ?? [];
      setQualificationIds(nextQualifications.map((item) => item.id));
      setQualificationNames(
        nextQualifications
          .map((item) => item.name?.trim())
          .filter((item): item is string => !!item),
      );
      setHasLoadedProfile(true);
      return;
    }

    let isActive = true;

    const loadProfile = async () => {
      try {
        const response = await ProfileResponseService.getProfileResponse();

        if (!isActive) {
          return;
        }

        setProfileResponseStore(response);
        const nextQualifications = response.detail?.qualifications ?? [];
        setQualificationIds(nextQualifications.map((item) => item.id));
        setQualificationNames(
          nextQualifications
            .map((item) => item.name?.trim())
            .filter((item): item is string => !!item),
        );
      } catch (err: any) {
        if (!isActive) {
          return;
        }

        const errorMessage =
          err?.data?.error ||
          err?.data?.message ||
          err?.message ||
          "Failed to load your qualifications.";
        setError(errorMessage);
        showError("Error", errorMessage);
      } finally {
        if (isActive) {
          setHasLoadedProfile(true);
        }
      }
    };

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [profileResponse, setProfileResponseStore, showError]);

  const fetchQuizzes = useCallback(
    async (mode: "replace" | "append" = "replace") => {
      const shouldAppend = mode === "append";

      if (!qualificationIds.length) {
        setQuizzes([]);
        setMetaByQualification({});
        metaByQualificationRef.current = {};
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

        const qualificationPages = qualificationIds
          .map((qualificationId) => {
            const currentMeta = metaByQualificationRef.current[qualificationId];
            const nextPage = shouldAppend
              ? (currentMeta?.current_page ?? 0) + 1
              : 1;

            if (
              shouldAppend &&
              currentMeta &&
              currentMeta.current_page >= currentMeta.last_page
            ) {
              return null;
            }

            return {
              qualificationId,
              page: nextPage,
            };
          })
          .filter(
            (
              item,
            ): item is {
              qualificationId: number;
              page: number;
            } => item !== null,
          );

        if (!qualificationPages.length) {
          return;
        }

        const responses = await Promise.all(
          qualificationPages.map(async ({ qualificationId, page }) => ({
            qualificationId,
            response: await QuizService.getPublishedQuizzes({
              qualification_id: qualificationId,
              page,
              per_page: PAGE_SIZE,
              sort_by: "created_at",
              sort_dir: "desc",
            }),
          })),
        );

        setMetaByQualification((prev) => {
          const next = shouldAppend ? { ...prev } : {};

          responses.forEach(({ qualificationId, response }) => {
            next[qualificationId] = {
              current_page: response.current_page,
              last_page: response.last_page,
              total: response.total,
            };
          });

          return next;
        });
        metaByQualificationRef.current = shouldAppend
          ? {
              ...metaByQualificationRef.current,
              ...Object.fromEntries(
                responses.map(({ qualificationId, response }) => [
                  qualificationId,
                  {
                    current_page: response.current_page,
                    last_page: response.last_page,
                    total: response.total,
                  },
                ]),
              ),
            }
          : Object.fromEntries(
              responses.map(({ qualificationId, response }) => [
                qualificationId,
                {
                  current_page: response.current_page,
                  last_page: response.last_page,
                  total: response.total,
                },
              ]),
            );

        const nextQuizzes = dedupeQuizzes(
          responses.flatMap(({ response }) => response.data ?? []),
        );

        setQuizzes((prev) =>
          shouldAppend ? dedupeQuizzes([...prev, ...nextQuizzes]) : nextQuizzes,
        );
      } catch (err: any) {
        const errorMessage =
          err?.data?.error ||
          err?.data?.message ||
          err?.message ||
          "Failed to load quizzes for your qualifications.";

        setError(errorMessage);

        if (!shouldAppend) {
          setQuizzes([]);
          setMetaByQualification({});
          metaByQualificationRef.current = {};
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [qualificationIds],
  );

  useEffect(() => {
    if (!hasLoadedProfile) {
      return;
    }

    fetchQuizzes("replace");
  }, [fetchQuizzes, hasLoadedProfile]);

  const filteredQuizzes = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    if (!normalizedQuery) {
      return quizzes;
    }

    return quizzes.filter((quiz) =>
      `${quiz.title} ${quiz.description ?? ""} ${quiz.course?.title ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [quizzes, search]);

  const hasMore = useMemo(
    () =>
      qualificationIds.some((qualificationId) => {
        const meta = metaByQualification[qualificationId];
        return meta ? meta.current_page < meta.last_page : false;
      }),
    [metaByQualification, qualificationIds],
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchQuizzes("replace");
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || !hasMore) {
      return;
    }

    fetchQuizzes("append");
  };

  const subtitle = qualificationNames.length
    ? `Showing quizzes matched to: ${qualificationNames.join(", ")}`
    : "Add a qualification to see quizzes assigned to your profile.";

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
            Quizzes
          </Text>
          <View className="h-12 w-12" />
        </View>
      </View>

      <FlatList
        data={filteredQuizzes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <QuizCard
            quiz={item}
            fullWidth
            onPress={() => router.push(`/quiz/${item.id}`)}
          />
        )}
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
            <Text className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {subtitle}
            </Text>

            <View className="mt-5 flex-row items-center rounded-[30px] border border-slate-200 bg-white px-4 py-1 dark:border-secondary-700 dark:bg-secondary-900">
              <Search size={18} color={isDarkMode ? "#94A3B8" : "#64748B"} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search loaded quizzes"
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

            {qualificationIds.length ? (
              <Text className="mt-3 text-xs font-medium uppercase tracking-[1px] text-slate-400 dark:text-slate-500">
                {search.trim() ? filteredQuizzes.length : quizzes.length}{" "}
                quizzes found
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="px-5 py-12">
              <ActivityIndicator color={isDarkMode ? "#FFFFFF" : "#7A25FF"} />
              <Text className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Loading quizzes...
              </Text>
            </View>
          ) : (
            <View className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 px-5 py-10 dark:border-secondary-700 dark:bg-secondary-900/85">
              <Text className="text-center text-lg font-semibold text-slate-900 dark:text-white">
                {error
                  ? "Unable to load quizzes"
                  : qualificationIds.length
                    ? "No quizzes found"
                    : "No qualifications added"}
              </Text>
              <Text className="mt-2 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
                {error ||
                  (qualificationIds.length
                    ? "There are no published quizzes mapped to your qualifications yet."
                    : "Add one or more qualifications in your profile to unlock personalized quizzes here.")}
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
