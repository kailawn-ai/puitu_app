import { BackButton } from "@/components/ui/back-button";
import { LottieLoader } from "@/components/ui/lottie-loader";
import {
  ShortService,
  type ManagementShortLike,
  type ShortComment,
  type ShortVideo,
  type ShortWithManagementPayload,
} from "@/lib/services/short-service";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Calendar,
  Heart,
  MessageCircle,
  RefreshCw,
  User,
  Video,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAlert } from "@/providers/alert-provider";

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
};

const VISIBILITY_OPTIONS: Array<"public" | "private" | "unlisted"> = [
  "public",
  "private",
  "unlisted",
];

function Pager({
  currentPage,
  hasMore,
  onPrev,
  onNext,
  isDark,
}: {
  currentPage: number;
  hasMore: boolean;
  onPrev: () => void;
  onNext: () => void;
  isDark: boolean;
}) {
  return (
    <View className="mt-3 flex-row items-center justify-end">
      <TouchableOpacity
        disabled={currentPage <= 1}
        onPress={onPrev}
        className={`rounded-full border px-3 py-1.5 ${
          currentPage <= 1
            ? isDark
              ? "border-white/10 bg-white/5"
              : "border-slate-200 bg-slate-100"
            : isDark
              ? "border-white/25 bg-white/10"
              : "border-slate-300 bg-white"
        }`}
      >
        <Text
          className={`${isDark ? "text-white" : "text-slate-900"} text-xs font-semibold`}
        >
          Prev
        </Text>
      </TouchableOpacity>

      <Text
        className={`mx-3 text-xs ${isDark ? "text-white/70" : "text-slate-600"}`}
      >
        Page {currentPage}
      </Text>

      <TouchableOpacity
        disabled={!hasMore}
        onPress={onNext}
        className={`rounded-full border px-3 py-1.5 ${
          !hasMore
            ? isDark
              ? "border-white/10 bg-white/5"
              : "border-slate-200 bg-slate-100"
            : isDark
              ? "border-white/25 bg-white/10"
              : "border-slate-300 bg-white"
        }`}
      >
        <Text
          className={`${isDark ? "text-white" : "text-slate-900"} text-xs font-semibold`}
        >
          Next
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ManageShortScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { id } = useLocalSearchParams<{ id: string }>();
  const alert = useAlert();

  const [shortData, setShortData] = useState<ShortVideo | null>(null);
  const [likes, setLikes] = useState<ManagementShortLike[]>([]);
  const [comments, setComments] = useState<ShortComment[]>([]);
  const [likesPage, setLikesPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);
  const [likesHasMore, setLikesHasMore] = useState(false);
  const [commentsHasMore, setCommentsHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editVisibility, setEditVisibility] = useState<
    "public" | "private" | "unlisted"
  >("public");
  const [editThumbnail, setEditThumbnail] = useState("");

  const fetchShort = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (!id) return;
      const refresh = opts?.refresh ?? false;
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await ShortService.getByIdWithManagement(id, {
          likes_page: likesPage,
          likes_per_page: 20,
          comments_page: commentsPage,
          comments_per_page: 20,
        });
        const payload: ShortWithManagementPayload = response.data;
        setShortData(payload.data);
        setLikes(payload.management.likes.items ?? []);
        setComments(payload.management.comments.items ?? []);
        setLikesHasMore(payload.management.likes.meta?.has_more ?? false);
        setCommentsHasMore(payload.management.comments.meta?.has_more ?? false);
        setEditTitle(payload.data.title ?? "");
        setEditVisibility(payload.data.visibility);
        setEditThumbnail(payload.data.thumbnail_url ?? "");
        setError(null);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load short details.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [commentsPage, id, likesPage],
  );

  useEffect(() => {
    fetchShort();
  }, [fetchShort]);

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

  const handleUpdateShort = useCallback(async () => {
    if (!id) return;
    const cleanedTitle = editTitle.trim();

    if (!cleanedTitle) {
      alert.showWarning("Validation", "Title is required.");
      return;
    }

    setSaving(true);
    try {
      await ShortService.update(id, {
        title: cleanedTitle,
        visibility: editVisibility,
        thumbnail_url: editThumbnail.trim() || null,
      });
      await fetchShort({ refresh: true });
      alert.showSuccess("Success", "Short updated successfully.");
    } catch (updateError) {
      alert.showError(
        "Update failed",
        updateError instanceof Error
          ? updateError.message
          : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }, [alert, editThumbnail, editTitle, editVisibility, fetchShort, id]);

  if (loading) {
    return (
      <View
        className={`flex-1 items-center justify-center ${isDark ? "bg-[#0a0f1f]" : "bg-slate-50"}`}
      >
        <LottieLoader size={90} />
        <Text
          className={`mt-3 text-sm ${isDark ? "text-white/75" : "text-slate-600"}`}
        >
          Loading short details...
        </Text>
      </View>
    );
  }

  if (!shortData || error) {
    return (
      <View
        className={`flex-1 items-center justify-center px-6 ${isDark ? "bg-[#0a0f1f]" : "bg-slate-50"}`}
      >
        <Text
          className={`text-center ${isDark ? "text-white" : "text-slate-900"}`}
        >
          {error ?? "Short not found."}
        </Text>
        <TouchableOpacity
          onPress={() => fetchShort({ refresh: true })}
          className={`mt-4 rounded-full border px-5 py-2.5 ${
            isDark ? "border-white/20 bg-white/10" : "border-slate-200 bg-white"
          }`}
        >
          <Text
            className={`${isDark ? "text-white" : "text-slate-900"} text-sm font-semibold`}
          >
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={
        isDark
          ? ["#0A0F1F", "#0F1E35", "#132238"]
          : ["#F0F9FF", "#ECFEFF", "#F8FAFC"]
      }
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        <View className="px-4 pt-2">
          <View className="flex-row items-center justify-between">
            <BackButton />
            <Text
              className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Manage Short
            </Text>
            <TouchableOpacity
              onPress={() => fetchShort({ refresh: true })}
              className={`h-11 w-11 items-center justify-center rounded-full border ${
                isDark
                  ? "border-white/20 bg-white/10"
                  : "border-slate-200 bg-white"
              }`}
            >
              {refreshing ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#FFFFFF" : "#334155"}
                />
              ) : (
                <RefreshCw size={18} color={isDark ? "#FFFFFF" : "#334155"} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 30 }}
        >
          <View
            className={`mt-4 overflow-hidden rounded-2xl border ${
              isDark
                ? "border-white/10 bg-white/5"
                : "border-slate-200 bg-white"
            }`}
          >
            <View className="flex-row">
              <View
                className={`h-32 w-32 ${isDark ? "bg-white/5" : "bg-slate-100"}`}
              >
                {shortData.thumbnail_url ? (
                  <Image
                    source={{ uri: shortData.thumbnail_url }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <Video size={24} color={isDark ? "#FFFFFF66" : "#94A3B8"} />
                  </View>
                )}
              </View>
              <View className="flex-1 p-3">
                <Text
                  className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {shortData.title}
                </Text>
                <Text
                  className={`mt-1 text-xs ${isDark ? "text-white/65" : "text-slate-500"}`}
                >
                  {shortData.status} • {shortData.visibility} •{" "}
                  {shortData.is_active ? "Active" : "Inactive"}
                </Text>
                <View className="mt-3 flex-row items-center">
                  <Calendar
                    size={12}
                    color={isDark ? "#FFFFFF99" : "#64748B"}
                  />
                  <Text
                    className={`ml-1 text-xs ${isDark ? "text-white/75" : "text-slate-600"}`}
                  >
                    {formatDate(shortData.published_at ?? shortData.created_at)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            className={`mt-4 rounded-2xl border p-3 ${
              isDark
                ? "border-white/10 bg-white/5"
                : "border-slate-200 bg-white"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Edit Short
            </Text>

            <Text
              className={`mt-3 text-xs ${isDark ? "text-white/70" : "text-slate-600"}`}
            >
              Title
            </Text>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Enter title"
              placeholderTextColor={isDark ? "#94A3B8" : "#94A3B8"}
              className="rounded-2xl border border-border bg-white px-4 py-4 text-base text-gray-900 dark:border-gray-700 dark:bg-secondary-900 dark:text-white"
            />

            <Text
              className={`mt-3 text-xs ${isDark ? "text-white/70" : "text-slate-600"}`}
            >
              Thumbnail URL
            </Text>
            <TextInput
              value={editThumbnail}
              onChangeText={setEditThumbnail}
              placeholder="https://..."
              placeholderTextColor={isDark ? "#94A3B8" : "#94A3B8"}
              autoCapitalize="none"
              className="rounded-2xl border border-border bg-white px-4 py-4 text-base text-gray-900 dark:border-gray-700 dark:bg-secondary-900 dark:text-white"
            />

            <Text
              className={`mt-3 text-xs ${isDark ? "text-white/70" : "text-slate-600"}`}
            >
              Visibility
            </Text>
            <View className="mt-2 flex-row flex-wrap">
              {VISIBILITY_OPTIONS.map((option) => {
                const selected = editVisibility === option;
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => setEditVisibility(option)}
                    className={`mr-2 rounded-full border px-3 py-1.5 ${
                      selected
                        ? isDark
                          ? "border-cyan-300/45 bg-cyan-500/20"
                          : "border-cyan-500 bg-cyan-50"
                        : isDark
                          ? "border-white/20 bg-white/10"
                          : "border-slate-300 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        selected
                          ? isDark
                            ? "text-cyan-100"
                            : "text-cyan-700"
                          : isDark
                            ? "text-white"
                            : "text-slate-700"
                      }`}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={handleUpdateShort}
              disabled={saving}
              className={`mt-4 items-center rounded-xl px-4 py-3 ${
                saving
                  ? isDark
                    ? "bg-white/15"
                    : "bg-slate-200"
                  : "bg-cyan-600"
              }`}
            >
              {saving ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#FFFFFF" : "#0f172a"}
                />
              ) : (
                <Text className="text-sm font-semibold text-white">
                  Update Short
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View
            className={`mt-4 rounded-2xl border p-3 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}
          >
            <View className="flex-row items-center">
              <Heart size={15} color={isDark ? "#FFFFFF" : "#0f172a"} />
              <Text
                className={`ml-2 text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Likes ({shortData.likes_count ?? 0})
              </Text>
            </View>

            {likes.length === 0 ? (
              <Text
                className={`mt-2 text-xs ${isDark ? "text-white/65" : "text-slate-500"}`}
              >
                No likes yet.
              </Text>
            ) : (
              likes.map((like) => (
                <View
                  key={like.id}
                  className={`mt-2 flex-row items-center rounded-xl px-2 py-2 ${
                    isDark ? "bg-white/5" : "bg-slate-50"
                  }`}
                >
                  <View
                    className={`h-8 w-8 items-center justify-center rounded-full ${
                      isDark ? "bg-white/10" : "bg-slate-200"
                    }`}
                  >
                    <User size={14} color={isDark ? "#FFFFFF" : "#334155"} />
                  </View>
                  <View className="ml-2 flex-1">
                    <Text
                      className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {like.user?.name || "User"}
                    </Text>
                    <Text
                      className={`text-[11px] ${isDark ? "text-white/55" : "text-slate-500"}`}
                    >
                      {formatDate(like.created_at)}
                    </Text>
                  </View>
                </View>
              ))
            )}

            <Pager
              currentPage={likesPage}
              hasMore={likesHasMore}
              onPrev={() => setLikesPage((p) => Math.max(1, p - 1))}
              onNext={() => setLikesPage((p) => p + 1)}
              isDark={isDark}
            />
          </View>

          <View
            className={`mt-4 rounded-2xl border p-3 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}
          >
            <View className="flex-row items-center">
              <MessageCircle size={15} color={isDark ? "#FFFFFF" : "#0f172a"} />
              <Text
                className={`ml-2 text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Comments ({shortData.comments_count ?? 0})
              </Text>
            </View>

            {comments.length === 0 ? (
              <Text
                className={`mt-2 text-xs ${isDark ? "text-white/65" : "text-slate-500"}`}
              >
                No comments yet.
              </Text>
            ) : (
              comments.map((comment) => (
                <View
                  key={comment.id}
                  className={`mt-2 rounded-xl px-3 py-2 ${
                    isDark ? "bg-white/5" : "bg-slate-50"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {comment.user?.name || "User"}
                    </Text>
                    <Text
                      className={`text-[11px] ${isDark ? "text-white/55" : "text-slate-500"}`}
                    >
                      {formatDate(comment.created_at)}
                    </Text>
                  </View>
                  <Text
                    className={`mt-1 text-xs ${isDark ? "text-white/85" : "text-slate-700"}`}
                  >
                    {comment.body}
                  </Text>
                  <Text
                    className={`mt-1 text-[11px] ${isDark ? "text-white/60" : "text-slate-500"}`}
                  >
                    Likes: {comment.likes_count ?? 0}{" "}
                    {comment.is_pinned ? " • Pinned" : ""}
                  </Text>
                </View>
              ))
            )}

            <Pager
              currentPage={commentsPage}
              hasMore={commentsHasMore}
              onPrev={() => setCommentsPage((p) => Math.max(1, p - 1))}
              onNext={() => setCommentsPage((p) => p + 1)}
              isDark={isDark}
            />
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}
