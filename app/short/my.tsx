import { BackButton } from "@/components/ui/back-button";
import { LottieLoader } from "@/components/ui/lottie-loader";
import {
  ShortService,
  type ManagementShortVideo,
} from "@/lib/services/short-service";
import { useRouter } from "expo-router";
import {
  RefreshCw,
  Video,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  FlatList,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

type StatusFilter = "all" | "draft" | "published" | "archived";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "Archived", value: "archived" },
];

const formatDate = (value?: string | null) => {
  if (!value) return "No publish date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No publish date";
  return date.toLocaleDateString();
};

function StatusBadge({ status }: { status: ManagementShortVideo["status"] }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const styleByStatus = {
    published: isDark
      ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
      : "bg-emerald-100 text-emerald-700 border-emerald-200",
    draft: isDark
      ? "bg-amber-500/20 text-amber-200 border-amber-300/30"
      : "bg-amber-100 text-amber-700 border-amber-200",
    archived: isDark
      ? "bg-slate-500/20 text-slate-200 border-slate-300/30"
      : "bg-slate-100 text-slate-600 border-slate-200",
  } as const;

  const labelMap = {
    published: "Published",
    draft: "Draft",
    archived: "Archived",
  };

  return (
    <View className={`rounded-full border px-3 py-1 ${styleByStatus[status]}`}>
      <Text className="text-[11px] font-semibold uppercase tracking-[1px]">
        {labelMap[status]}
      </Text>
    </View>
  );
}

function ShortCard({ item }: { item: ManagementShortVideo }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/short/${item.id}`)}
      className={`mb-3 overflow-hidden rounded-2xl border ${
        isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
      }`}
    >
      <View className="flex-row">
        <View className={`h-28 w-28 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
          {item.thumbnail_url ? (
            <Image
              source={{ uri: item.thumbnail_url }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Video size={24} color={isDark ? "#FFFFFF66" : "#94A3B8"} />
              <Text
                className={`text-[11px] font-semibold mt-1 ${
                  isDark ? "text-white/45" : "text-slate-400"
                }`}
              >
                No Thumbnail
              </Text>
            </View>
          )}
        </View>

        <View className="flex-1 px-3 py-3">
          <View className="flex-row items-start justify-between">
            <Text
              numberOfLines={2}
              className={`mr-2 flex-1 text-sm font-semibold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {item.title || "Untitled Short"}
            </Text>
            <StatusBadge status={item.status} />
          </View>

          <View className="mt-2 flex-row items-center gap-2">
            <View
              className={`rounded-full px-2 py-1 ${
                item.is_active
                  ? isDark
                    ? "bg-emerald-400/20"
                    : "bg-emerald-100"
                  : isDark
                    ? "bg-red-400/20"
                    : "bg-red-100"
              }`}
            >
              <Text
                className={`text-[11px] font-medium ${
                  item.is_active
                    ? isDark
                      ? "text-emerald-200"
                      : "text-emerald-700"
                    : isDark
                      ? "text-red-200"
                      : "text-red-700"
                }`}
              >
                {item.is_active ? "Active" : "Inactive"}
              </Text>
            </View>
            <Text
              className={`text-[11px] ${
                isDark ? "text-white/55" : "text-slate-500"
              }`}
            >
              {item.visibility}
            </Text>
          </View>

          <View className="mt-3 flex-row gap-3">
            <View className="flex-row items-center gap-1">
              <Eye size={12} color={isDark ? "#FFFFFF99" : "#64748B"} />
              <Text
                className={`text-[11px] ${
                  isDark ? "text-white/75" : "text-slate-600"
                }`}
              >
                {item.views_count ?? 0}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Heart size={12} color={isDark ? "#FFFFFF99" : "#64748B"} />
              <Text
                className={`text-[11px] ${
                  isDark ? "text-white/75" : "text-slate-600"
                }`}
              >
                {item.likes_count ?? 0}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <MessageCircle
                size={12}
                color={isDark ? "#FFFFFF99" : "#64748B"}
              />
              <Text
                className={`text-[11px] ${
                  isDark ? "text-white/75" : "text-slate-600"
                }`}
              >
                {item.comments_count ?? 0}
              </Text>
            </View>
          </View>

          <Text
            className={`mt-2 text-[11px] ${
              isDark ? "text-white/50" : "text-slate-400"
            }`}
          >
            {formatDate(item.published_at ?? item.created_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MyShortsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [items, setItems] = useState<ManagementShortVideo[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyShorts = useCallback(
    async (opts?: { refresh?: boolean; status?: StatusFilter }) => {
      const refresh = opts?.refresh ?? false;
      const status = opts?.status ?? statusFilter;

      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await ShortService.getManagementMinimalList({
          limit: 100,
          status: status === "all" ? undefined : status,
        });
        setItems(response.data ?? []);
        setError(null);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load your shorts.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    fetchMyShorts();
  }, [fetchMyShorts]);

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

  const emptyText = useMemo(() => {
    if (statusFilter === "all") return "No shorts yet.";
    return `No ${statusFilter} shorts found.`;
  }, [statusFilter]);

  return (
    <LinearGradient
      colors={
        isDark
          ? ["#0A0F1F", "#0E1A2B", "#132238"]
          : ["#F0F9FF", "#ECFEFF", "#F8FAFC"]
      }
      locations={[0, 0.45, 1]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={{ paddingTop: insets.top }} className="flex-1">
        <View className="px-4 pb-3 pt-2">
          <View className="flex-row items-center justify-between">
            <BackButton />
            <Text
              className={`text-lg font-bold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              My Shorts
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              className={`h-11 w-11 items-center justify-center rounded-full border ${
                isDark
                  ? "border-white/20 bg-white/10"
                  : "border-slate-200 bg-white"
              }`}
              onPress={() => fetchMyShorts({ refresh: true })}
            >
              <RefreshCw size={18} color={isDark ? "#FFFFFF" : "#334155"} />
            </TouchableOpacity>
          </View>

          <View className="mt-4 flex-row flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => {
              const selected = filter.value === statusFilter;
              return (
                <Pressable
                  key={filter.value}
                  className={`rounded-full border px-4 py-2 ${
                    selected
                      ? isDark
                        ? "border-cyan-300/45 bg-cyan-500/20"
                        : "border-cyan-500 bg-cyan-50"
                      : isDark
                        ? "border-white/15 bg-white/5"
                        : "border-slate-200 bg-white"
                  }`}
                  onPress={() => {
                    setStatusFilter(filter.value);
                    fetchMyShorts({ status: filter.value });
                  }}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selected
                        ? isDark
                          ? "text-cyan-100"
                          : "text-cyan-700"
                        : isDark
                          ? "text-white/80"
                          : "text-slate-600"
                    }`}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <LottieLoader size={90} />
            <Text
              className={`mt-3 text-sm ${
                isDark ? "text-white/75" : "text-slate-500"
              }`}
            >
              Loading your shorts...
            </Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text
              className={`text-center ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {error}
            </Text>
            <TouchableOpacity
              className={`mt-4 rounded-full border px-5 py-3 ${
                isDark
                  ? "border-white/25 bg-white/10"
                  : "border-slate-200 bg-white"
              }`}
              onPress={() => fetchMyShorts({ refresh: true })}
            >
              <Text
                className={`text-sm font-semibold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{
              paddingHorizontal: 14,
              paddingBottom: 28,
              flexGrow: 1,
            }}
            refreshing={isRefreshing}
            onRefresh={() => fetchMyShorts({ refresh: true })}
            renderItem={({ item }) => <ShortCard item={item} />}
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <Video size={48} color={isDark ? "#FFFFFF40" : "#94A3B8"} />
                <Text
                  className={`mt-4 text-sm ${
                    isDark ? "text-white/65" : "text-slate-500"
                  }`}
                >
                  {emptyText}
                </Text>
                <TouchableOpacity
                  className={`mt-6 rounded-full border px-5 py-3 ${
                    isDark
                      ? "border-white/25 bg-white/10"
                      : "border-slate-200 bg-white"
                  }`}
                  onPress={() => router.push("/short/create")}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Create a Short
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </LinearGradient>
  );
}
