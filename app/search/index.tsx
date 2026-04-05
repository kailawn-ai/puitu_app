import SearchResultCard from "@/components/search/search-result-card";
import { BackButton } from "@/components/ui/back-button";
import {
  SearchEntityType,
  SearchListItem,
  SearchService,
} from "@/lib/services/search-service";
import { useAlert } from "@/providers/alert-provider";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  BriefcaseBusiness,
  CircleHelp,
  FileQuestion,
  MoveUpRight,
  Search,
  Users,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FILTERS: {
  label: string;
  value: SearchEntityType;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}[] = [
  { label: "Courses", value: "course", icon: Search },
  { label: "Quizzes", value: "quiz", icon: CircleHelp },
  { label: "Jobs", value: "job", icon: BriefcaseBusiness },
  { label: "Old Qs", value: "old_question", icon: FileQuestion },
  { label: "Community", value: "community_group", icon: Users },
];

export default function SearchScreen() {
  const router = useRouter();
  const { showInfo } = useAlert();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<SearchEntityType[]>([]);
  const [results, setResults] = useState<SearchListItem[]>([]);
  const [suggestions, setSuggestions] = useState<SearchListItem[]>([]);
  const [featured, setFeatured] = useState<SearchListItem[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  const trimmedQuery = query.trim();
  const deferredQuery = useDeferredValue(trimmedQuery);

  const filterSummary = useMemo(() => {
    if (!selectedTypes.length) return "All collections";
    if (selectedTypes.length === 1) {
      return FILTERS.find((filter) => filter.value === selectedTypes[0])?.label;
    }
    return `${selectedTypes.length} filters on`;
  }, [selectedTypes]);

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
    let isActive = true;

    const loadFeatured = async () => {
      try {
        const items = await SearchService.searchAllItems({ per_page: 12 });
        if (isActive) {
          setFeatured(items);
        }
      } catch (error: any) {
        console.log("Featured search load error:", error);
      } finally {
        if (isActive) {
          setBootstrapping(false);
        }
      }
    };

    loadFeatured();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    if (!deferredQuery) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return () => {
        isActive = false;
      };
    }

    setLoadingSuggestions(true);
    const timeout = setTimeout(async () => {
      try {
        const items = await SearchService.getSuggestionItems(deferredQuery);
        if (isActive) {
          setSuggestions(items);
        }
      } catch (error: any) {
        console.log("Search suggestions error:", error);
        if (isActive) {
          setSuggestions([]);
        }
      } finally {
        if (isActive) {
          setLoadingSuggestions(false);
        }
      }
    }, 110);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [deferredQuery]);

  useEffect(() => {
    let isActive = true;

    if (!deferredQuery && !selectedTypes.length) {
      setResults([]);
      return () => {
        isActive = false;
      };
    }

    setLoadingResults(true);
    const timeout = setTimeout(async () => {
      try {
        const items = await SearchService.searchAllItems({
          q: deferredQuery || undefined,
          types: selectedTypes.length ? selectedTypes : undefined,
          per_page: 24,
        });

        if (isActive) {
          setResults(items);
        }
      } catch (error: any) {
        console.log("Search load error:", error);
        if (isActive) {
          setResults([]);
        }
      } finally {
        if (isActive) {
          setLoadingResults(false);
        }
      }
    }, 140);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [deferredQuery, selectedTypes]);

  const toggleType = (type: SearchEntityType) => {
    setSelectedTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  };

  const handlePressItem = (item: SearchListItem) => {
    if (item.entityType === "quiz") {
      showInfo(
        "Quiz screen not ready",
        "Search is already returning quiz results. We just need to wire the quiz detail screen route next.",
      );
      return;
    }

    if (item.entityType === "community_group") {
      router.push("/community");
      return;
    }

    router.push(item.route as never);
  };

  const handlePickSuggestion = (item: SearchListItem) => {
    setQuery(item.title);
    handlePressItem(item);
  };

  const activeItems = trimmedQuery || selectedTypes.length ? results : featured;
  const showSuggestions = trimmedQuery.length >= 2 && suggestions.length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <BackButton className="absolute top-12 left-4 z-10" />
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#09090b", "#171717"] // Using your secondary-900 and secondary-800
            : ["#F8FAFC", "#E2E8F0"]
        } // Light mode gradient
        locations={[0, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + 1,
            paddingBottom: insets.bottom + 28,
          }}
        >
          <View className="px-3">
            <View className="rounded-[30px] border border-white/70 bg-white/92 p-4 dark:border-secondary-700 dark:bg-secondary-900">
              <View className="mt-14 flex-row items-center rounded-2xl bg-white px-4 py-1 dark:bg-secondary-800">
                <Search size={18} color="#64748B" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search biology, jobs, communities..."
                  placeholderTextColor="#94A3B8"
                  returnKeyType="search"
                  className="ml-3 flex-1 text-[15px] text-slate-900 dark:text-white"
                />
                {!!trimmedQuery && (
                  <TouchableOpacity onPress={() => setQuery("")}>
                    <Text className="text-sm font-semibold text-primary-500">
                      Clear
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {trimmedQuery.length >= 2 ? (
                <View className="mt-4 rounded-2xl bg-slate-50 px-3 py-3 dark:bg-secondary-800/80">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-slate-500 dark:text-slate-400">
                      Suggestions
                    </Text>
                    {loadingSuggestions ? (
                      <ActivityIndicator size="small" color="#7A25FF" />
                    ) : null}
                  </View>

                  {showSuggestions ? (
                    <View className="mt-3">
                      {suggestions.slice(0, 5).map((item) => (
                        <TouchableOpacity
                          key={`suggestion-${item.id}`}
                          onPress={() => handlePickSuggestion(item)}
                          className="mb-2 flex-row items-center justify-between rounded-2xl bg-white px-3 py-3 dark:bg-secondary-900"
                        >
                          <View className="mr-3 flex-1">
                            <Text
                              numberOfLines={1}
                              className="text-sm font-semibold text-slate-900 dark:text-white"
                            >
                              {item.title}
                            </Text>
                            {!!item.subtitle && (
                              <Text
                                numberOfLines={1}
                                className="mt-1 text-xs text-slate-500 dark:text-slate-400"
                              >
                                {item.subtitle}
                              </Text>
                            )}
                          </View>

                          <View className="flex-row items-center">
                            {!!item.badge && (
                              <Text className="mr-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                                {item.badge}
                              </Text>
                            )}
                            <MoveUpRight size={14} color="#94A3B8" />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : !loadingSuggestions ? (
                    <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      Keep typing and I’ll surface the closest matches.
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <View className="mt-4 flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {filterSummary}
                </Text>
                {!!selectedTypes.length && (
                  <TouchableOpacity onPress={() => setSelectedTypes([])}>
                    <Text className="text-sm font-semibold text-primary-500">
                      Reset filters
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 14, paddingVertical: 2 }}
              >
                {FILTERS.map((filter) => {
                  const active = selectedTypes.includes(filter.value);
                  const Icon = filter.icon;

                  return (
                    <TouchableOpacity
                      key={filter.value}
                      onPress={() => toggleType(filter.value)}
                      className={`mr-3 flex-row items-center rounded-full px-4 py-3 ${
                        active
                          ? "bg-primary-500"
                          : "bg-white dark:bg-secondary-800 elevation-sm"
                      }`}
                    >
                      <Icon
                        size={15}
                        color={
                          active
                            ? "#FFFFFF"
                            : colorScheme === "dark"
                              ? "#E2E8F0"
                              : "#334155"
                        }
                      />
                      <Text
                        className={`ml-2 text-sm font-semibold ${
                          active
                            ? "text-white"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View className="mt-6 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-semibold text-slate-900 dark:text-white">
                  {trimmedQuery || selectedTypes.length
                    ? "Results"
                    : "Featured to Explore"}
                </Text>
                <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {trimmedQuery || selectedTypes.length
                    ? "Ranked by title strength, freshness, popularity, and close matches."
                    : "Fresh picks from your indexed content."}
                </Text>
              </View>

              {loadingResults && (trimmedQuery || selectedTypes.length) ? (
                <ActivityIndicator size="small" color="#7A25FF" />
              ) : null}
            </View>

            {bootstrapping ? (
              <View className="items-center py-16">
                <ActivityIndicator size="small" color="#7A25FF" />
                <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Preparing your search space...
                </Text>
              </View>
            ) : activeItems.length ? (
              <View className="mt-4">
                {activeItems.map((item) => (
                  <SearchResultCard
                    key={item.id}
                    item={item}
                    onPress={handlePressItem}
                  />
                ))}
              </View>
            ) : (
              <View className="mt-4 rounded-[30px] border border-dashed border-slate-300 bg-white/85 px-5 py-8 dark:border-secondary-700 dark:bg-secondary-900">
                <Text className="text-lg font-semibold text-slate-900 dark:text-white">
                  Nothing matched yet
                </Text>
                <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Try a broader keyword, remove a filter, or search by a title
                  you already know.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
