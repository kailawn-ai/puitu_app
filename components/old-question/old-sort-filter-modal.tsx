import type {
  QualificationLite,
  OldQuestionSortBy,
  PaginatedResponse,
  SemesterLite,
  YearLite,
} from "@/lib/services/old-service";
import { Check, Search, SlidersHorizontal, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterTab = "qualification" | "year" | "semester";
type SelectItem = { id: number; label: string };

export type OldQuestionSortOption = {
  label: string;
  sort_by: OldQuestionSortBy;
  sort_order?: "asc" | "desc";
};

type ApplyPayload = {
  sort: OldQuestionSortOption;
  qualificationId?: number;
  yearId?: number;
  semesterId?: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  sortOptions: OldQuestionSortOption[];
  initialSort: OldQuestionSortOption;
  initialQualificationId?: number;
  initialYearId?: number;
  initialSemesterId?: number;
  qualifications: PaginatedResponse<QualificationLite> | null;
  years: PaginatedResponse<YearLite> | null;
  semesters: PaginatedResponse<SemesterLite> | null;
  qualificationsLoading: boolean;
  yearsLoading: boolean;
  semestersLoading: boolean;
  onLoadMoreQualifications: () => void;
  onLoadMoreYears: () => void;
  onLoadMoreSemesters: () => void;
  onApply: (payload: ApplyPayload) => void;
};

const tabConfig: Array<{ key: FilterTab; label: string; searchLabel: string }> =
  [
    {
      key: "qualification",
      label: "Qualifications",
      searchLabel: "Search qualifications...",
    },
    { key: "year", label: "Years", searchLabel: "Search years..." },
    { key: "semester", label: "Semesters", searchLabel: "Search semesters..." },
  ];

function normalize(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function qualificationName(item: QualificationLite): string {
  return item.name ?? "Untitled qualification";
}

function yearName(item: YearLite): string {
  if (typeof item.year === "number") return `Year ${item.year}`;
  return item.name ?? "Year";
}

function semesterName(item: SemesterLite): string {
  return item.name ?? "Semester";
}

export default function OldSortFilterModal({
  visible,
  onClose,
  sortOptions,
  initialSort,
  initialQualificationId,
  initialYearId,
  initialSemesterId,
  qualifications,
  years,
  semesters,
  qualificationsLoading,
  yearsLoading,
  semestersLoading,
  onLoadMoreQualifications,
  onLoadMoreYears,
  onLoadMoreSemesters,
  onApply,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [activeTab, setActiveTab] = useState<FilterTab>("qualification");
  const [search, setSearch] = useState<Record<FilterTab, string>>({
    qualification: "",
    year: "",
    semester: "",
  });
  const [draftSort, setDraftSort] =
    useState<OldQuestionSortOption>(initialSort);
  const [draftQualificationId, setDraftQualificationId] = useState<
    number | undefined
  >(initialQualificationId);
  const [draftYearId, setDraftYearId] = useState<number | undefined>(
    initialYearId,
  );
  const [draftSemesterId, setDraftSemesterId] = useState<number | undefined>(
    initialSemesterId,
  );

  useEffect(() => {
    if (!visible) return;
    setDraftSort(initialSort);
    setDraftQualificationId(initialQualificationId);
    setDraftYearId(initialYearId);
    setDraftSemesterId(initialSemesterId);
  }, [
    visible,
    initialSort,
    initialQualificationId,
    initialYearId,
    initialSemesterId,
  ]);

  const filteredQualifications = useMemo(() => {
    const q = normalize(search.qualification);
    const list: SelectItem[] =
      qualifications?.data.map((item) => ({
        id: item.id,
        label: qualificationName(item),
      })) ?? [];
    if (!q) return list;
    return list.filter((item) => normalize(item.label).includes(q));
  }, [qualifications?.data, search.qualification]);

  const filteredYears = useMemo(() => {
    const q = normalize(search.year);
    const list: SelectItem[] =
      years?.data.map((item) => ({ id: item.id, label: yearName(item) })) ?? [];
    if (!q) return list;
    return list.filter((item) => normalize(item.label).includes(q));
  }, [years?.data, search.year]);

  const filteredSemesters = useMemo(() => {
    const q = normalize(search.semester);
    const list: SelectItem[] =
      semesters?.data.map((item) => ({
        id: item.id,
        label: semesterName(item),
      })) ?? [];
    if (!q) return list;
    return list.filter((item) => normalize(item.label).includes(q));
  }, [semesters?.data, search.semester]);

  const activeState = useMemo(() => {
    if (activeTab === "qualification") {
      return {
        data: filteredQualifications,
        loading: qualificationsLoading,
        hasMore:
          !!qualifications &&
          qualifications.current_page < qualifications.last_page,
        onLoadMore: onLoadMoreQualifications,
        selectedId: draftQualificationId,
        onSelect: setDraftQualificationId,
      };
    }

    if (activeTab === "year") {
      return {
        data: filteredYears,
        loading: yearsLoading,
        hasMore: !!years && years.current_page < years.last_page,
        onLoadMore: onLoadMoreYears,
        selectedId: draftYearId,
        onSelect: setDraftYearId,
      };
    }

    return {
      data: filteredSemesters,
      loading: semestersLoading,
      hasMore: !!semesters && semesters.current_page < semesters.last_page,
      onLoadMore: onLoadMoreSemesters,
      selectedId: draftSemesterId,
      onSelect: setDraftSemesterId,
    };
  }, [
    activeTab,
    filteredQualifications,
    filteredSemesters,
    filteredYears,
    qualificationsLoading,
    yearsLoading,
    semestersLoading,
    qualifications,
    years,
    semesters,
    onLoadMoreQualifications,
    onLoadMoreYears,
    onLoadMoreSemesters,
    draftQualificationId,
    draftYearId,
    draftSemesterId,
  ]);

  const handleClearAll = () => {
    setDraftSort(sortOptions[0]);
    setDraftQualificationId(undefined);
    setDraftYearId(undefined);
    setDraftSemesterId(undefined);
    setSearch({ qualification: "", year: "", semester: "" });
  };

  const handleApply = () => {
    onApply({
      sort: draftSort,
      qualificationId: draftQualificationId,
      yearId: draftYearId,
      semesterId: draftSemesterId,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/35">
        <View className="h-[86%] rounded-t-[30px] border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <View className="flex-row items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-zinc-700">
            <View className="flex-row items-center">
              <SlidersHorizontal
                size={18}
                color={isDarkMode ? "#E2E8F0" : "#0F172A"}
              />
              <Text className="ml-2 text-lg font-bold text-slate-900 dark:text-white">
                Sort & Filter
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800"
            >
              <X size={18} color={isDarkMode ? "#E2E8F0" : "#0F172A"} />
            </Pressable>
          </View>

          <View className="pt-4">
            <Text className="ml-5 text-xs font-semibold uppercase tracking-[1.1px] text-slate-500 dark:text-slate-400">
              Sort By
            </Text>
            <FlatList
              horizontal
              data={sortOptions}
              keyExtractor={(item) => item.label}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingTop: 10,
                paddingLeft: 15,
                paddingBottom: 6,
              }}
              ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
              renderItem={({ item }) => {
                const active =
                  item.sort_by === draftSort.sort_by &&
                  item.sort_order === draftSort.sort_order;

                return (
                  <Pressable
                    onPress={() => setDraftSort(item)}
                    className={`rounded-full px-4 py-2.5 ${
                      active
                        ? "bg-primary dark:bg-primary"
                        : "border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        active
                          ? "text-white"
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

          <View className="mt-1 px-5">
            <Text className="text-xs font-semibold uppercase tracking-[1.1px] text-slate-500 dark:text-slate-400">
              Filter By
            </Text>
            <View className="mt-2 flex-row rounded-full border border-slate-200 bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800">
              {tabConfig.map((tab) => {
                const active = tab.key === activeTab;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    className={`flex-1 rounded-full px-4 py-4 ${
                      active ? "bg-white" : ""
                    }`}
                  >
                    <Text
                      className={`text-center text-sm font-semibold ${
                        active
                          ? "text-black"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="mt-3 flex-row items-center rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-1 dark:border-zinc-700 dark:bg-zinc-800">
              <Search size={16} color={isDarkMode ? "#94A3B8" : "#64748B"} />
              <TextInput
                value={search[activeTab]}
                onChangeText={(text) =>
                  setSearch((prev) => ({ ...prev, [activeTab]: text }))
                }
                placeholder={
                  tabConfig.find((tab) => tab.key === activeTab)?.searchLabel
                }
                placeholderTextColor={isDarkMode ? "#94A3B8" : "#94A3B8"}
                className="ml-2.5 h-11 flex-1 text-base text-slate-900 dark:text-white"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <FlatList
            className="mt-3 flex-1"
            data={activeState.data}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 14 }}
            onEndReachedThreshold={0.3}
            onEndReached={() => {
              if (!activeState.loading && activeState.hasMore) {
                activeState.onLoadMore();
              }
            }}
            renderItem={({ item }) => {
              const active = item.id === activeState.selectedId;
              return (
                <Pressable
                  onPress={() =>
                    activeState.onSelect((current) =>
                      current === item.id ? undefined : item.id,
                    )
                  }
                  className={`mb-2.5 flex-row items-center justify-between rounded-2xl border px-4 py-3.5 ${
                    active
                      ? "border-slate-900 bg-slate-900 dark:border-white dark:bg-white"
                      : "border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                  }`}
                >
                  <Text
                    className={`text-base font-semibold ${
                      active
                        ? "text-white dark:text-zinc-900"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {item.label}
                  </Text>
                  {active ? (
                    <Check
                      size={18}
                      color={isDarkMode ? "#09090B" : "#FFFFFF"}
                    />
                  ) : null}
                </Pressable>
              );
            }}
            ListFooterComponent={
              activeState.loading ? (
                <View className="py-4">
                  <ActivityIndicator
                    color={isDarkMode ? "#FFFFFF" : "#334155"}
                  />
                </View>
              ) : null
            }
            ListEmptyComponent={
              activeState.loading ? null : (
                <View className="items-center py-8">
                  <Text className="text-sm text-slate-500 dark:text-slate-400">
                    No {activeTab} found
                  </Text>
                </View>
              )
            }
          />

          <View
            className="flex-row items-center justify-between border-t border-slate-200 px-5 pt-4 dark:border-zinc-700"
            style={{ paddingBottom: insets.bottom + 10 }}
          >
            <Pressable
              onPress={handleClearAll}
              className="rounded-full border border-slate-300 px-5 py-3 dark:border-zinc-600"
            >
              <Text className="font-semibold text-slate-700 dark:text-slate-200">
                Clear
              </Text>
            </Pressable>
            <Pressable
              onPress={handleApply}
              className="rounded-full bg-primary px-6 py-3 dark:bg-primary"
            >
              <Text className="font-semibold text-white">Apply</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
