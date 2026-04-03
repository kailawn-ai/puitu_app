import { useIsFocused } from "@react-navigation/native";
import { useEvent } from "expo";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import ShortActionRail from "@/components/short/short-action-rail";
import ShortCommentSheet from "@/components/short/short-comment-sheet";
import ShortQuickMenu from "@/components/short/short-quick-menu";
import { ShortService, type ShortVideo } from "@/lib/services/short-service";
import { useAlert } from "@/providers/alert-provider";
import { useVideoPlayer, VideoView } from "expo-video";
import { Play } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const getCreatorLabel = (item: ShortVideo) => {
  const rawName = item.user?.name?.trim();
  if (!rawName) {
    return "@puitu.creator";
  }

  return `@${rawName.toLowerCase().replace(/\s+/g, ".")}`;
};

const getCreatorInitials = (item: ShortVideo) => {
  const rawName = item.user?.name?.trim();
  if (!rawName) return "PU";

  const parts = rawName.split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
};

function ShortCard({
  item,
  isActive,
  isScreenFocused,
  topInset,
  tabBarHeight,
  liked,
  bookmarked,
  onToggleLike,
  onToggleSave,
  onOpenComments,
  onShareShort,
  onCreateShort,
  onMyShorts,
  likeLoading,
  shareLoading,
  saveLoading,
}: {
  item: ShortVideo;
  isActive: boolean;
  isScreenFocused: boolean;
  topInset: number;
  tabBarHeight: number;
  liked: boolean;
  bookmarked: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onOpenComments: () => void;
  onShareShort: () => void;
  onCreateShort: () => void;
  onMyShorts: () => void;
  likeLoading?: boolean;
  shareLoading?: boolean;
  saveLoading?: boolean;
}) {
  const player = useVideoPlayer(item.video_url, (instance) => {
    instance.loop = true;
  });

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  React.useEffect(() => {
    if (isActive && isScreenFocused) {
      player.play();
      return;
    }

    player.pause();
    player.currentTime = 0;
  }, [isActive, isScreenFocused, player]);
  const topContentInset = topInset + 5;
  const bottomContentInset = tabBarHeight;

  return (
    <View
      style={[
        styles.page,
        {
          paddingTop: topContentInset,
          paddingBottom: bottomContentInset,
        },
      ]}
    >
      <Pressable
        style={[
          styles.videoLayer,
          {
            top: topContentInset,
            bottom: bottomContentInset,
          },
        ]}
        onPress={() => {
          if (isPlaying) {
            player.pause();
          } else {
            player.play();
          }
        }}
      >
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          nativeControls={false}
          contentFit="cover"
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      </Pressable>

      {/* Enhanced gradient overlays for better button visibility */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.4)"]}
        locations={[0.6, 1]}
        style={[
          styles.bottomGradient,
          {
            bottom: bottomContentInset,
            height: SCREEN_HEIGHT * 0.1,
          },
        ]}
        pointerEvents="none"
      />

      {!isPlaying && (
        <View
          pointerEvents="none"
          style={[
            styles.centerOverlay,
            {
              top: topContentInset,
              bottom: bottomContentInset,
            },
          ]}
        >
          <View className="h-20 w-20 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/30">
            <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </View>
      )}

      <View className="flex-1 justify-between px-2">
        <View className="flex-row items-start justify-between pt-3">
          <View className="flex-1" />

          <ShortQuickMenu
            title={item.title}
            caption={item.description ?? ""}
            creatorLabel={getCreatorLabel(item)}
            likesCount={item.likes_count ?? 0}
            commentsCount={item.comments_count ?? 0}
            sharesCount={item.shares_count ?? 0}
            onCreateShort={onCreateShort}
            onMyShorts={onMyShorts}
          />
        </View>

        <View className="flex-row items-end">
          <View className="mr-4 flex-1 p-1">
            <View className="flex-row items-center">
              <LinearGradient
                colors={["#FF6B6B", "#FF8E53"]}
                style={styles.avatarGradient}
              >
                <Text className="text-sm text-white">
                  {getCreatorInitials(item)}
                </Text>
              </LinearGradient>

              <View className="ml-2 flex-row items-center">
                <Text className="text-xs text-white">
                  {getCreatorLabel(item)}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.9}
                  className="ml-3 rounded-full border border-white/40 bg-white/20 px-4 py-2.5"
                  onPress={() =>
                    Alert.alert(
                      "Follow creator",
                      "We can wire creator follow later when backend is ready.",
                    )
                  }
                >
                  <Text className="text-sm font-bold text-white">Follow</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text className="mt-2 text-sm font-bold leading-7 text-white">
              {item.title}
            </Text>
          </View>

          <ShortActionRail
            liked={liked}
            bookmarked={bookmarked}
            likesCount={item.likes_count ?? 0}
            commentsCount={item.comments_count ?? 0}
            sharesCount={item.shares_count ?? 0}
            onLike={onToggleLike}
            onComments={onOpenComments}
            onShare={onShareShort}
            onSave={onToggleSave}
            likeLoading={likeLoading}
            shareLoading={shareLoading}
            saveLoading={saveLoading}
          />
        </View>
      </View>
    </View>
  );
}

export default function ShortScreen() {
  const router = useRouter();
  const { showError, showInfo, showSuccess } = useAlert();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const isFocused = useIsFocused();
  const [activeIndex, setActiveIndex] = useState(0);
  const [shorts, setShorts] = useState<ShortVideo[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({});
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<number, boolean>>(
    {},
  );
  const [likeLoadingId, setLikeLoadingId] = useState<number | null>(null);
  const [shareLoadingId, setShareLoadingId] = useState<number | null>(null);
  const [saveLoadingId, setSaveLoadingId] = useState<number | null>(null);
  const [commentSheetShort, setCommentSheetShort] = useState<ShortVideo | null>(
    null,
  );
  const viewedIdsRef = useRef<Set<number>>(new Set());
  const loadedLikeStatusRef = useRef<Set<number>>(new Set());
  const loadedSaveStatusRef = useRef<Set<number>>(new Set());

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  });

  const loadShorts = useCallback(
    async (options?: { refresh?: boolean; cursor?: string | null }) => {
      const refresh = options?.refresh ?? false;
      const cursor = options?.cursor;

      if (refresh) {
        setIsRefreshing(true);
      } else if (cursor) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await ShortService.getShorts({
          per_page: 6,
          cursor: cursor ?? undefined,
        });

        const incoming = response.data ?? [];
        setError(null);
        setNextCursor(response.meta?.next_cursor ?? null);
        setHasMore(response.meta?.has_more ?? false);

        setShorts((current) => {
          if (refresh || !cursor) {
            return incoming;
          }

          const existingIds = new Set(current.map((item) => item.id));
          const appended = incoming.filter((item) => !existingIds.has(item.id));
          return [...current, ...appended];
        });
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load shorts";
        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    loadShorts();
  }, [loadShorts]);

  React.useEffect(() => {
    const activeShort = shorts[activeIndex];
    if (!activeShort) return;

    if (!viewedIdsRef.current.has(activeShort.id)) {
      viewedIdsRef.current.add(activeShort.id);

      ShortService.recordView(activeShort.id)
        .then((response) => {
          setShorts((current) =>
            current.map((item) =>
              item.id === activeShort.id
                ? { ...item, views_count: response.data.views_count }
                : item,
            ),
          );
        })
        .catch(() => {
          viewedIdsRef.current.delete(activeShort.id);
        });
    }

    if (!loadedLikeStatusRef.current.has(activeShort.id)) {
      loadedLikeStatusRef.current.add(activeShort.id);

      ShortService.getLikeStatus(activeShort.id)
        .then((response) => {
          setLikedMap((current) => ({
            ...current,
            [activeShort.id]: response.data.liked,
          }));
          setShorts((current) =>
            current.map((item) =>
              item.id === activeShort.id
                ? { ...item, likes_count: response.data.likes_count }
                : item,
            ),
          );
        })
        .catch(() => {
          loadedLikeStatusRef.current.delete(activeShort.id);
        });
    }

    if (!loadedSaveStatusRef.current.has(activeShort.id)) {
      loadedSaveStatusRef.current.add(activeShort.id);

      ShortService.getSaveStatus(activeShort.id)
        .then((response) => {
          setBookmarkedMap((current) => ({
            ...current,
            [activeShort.id]: response.data.saved,
          }));
        })
        .catch(() => {
          loadedSaveStatusRef.current.delete(activeShort.id);
        });
    }
  }, [activeIndex, shorts]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<ShortVideo>[] }) => {
      if (!viewableItems.length) return;

      const firstVisible = viewableItems[0]?.index ?? 0;
      setActiveIndex(firstVisible);

      if (
        hasMore &&
        !isLoadingMore &&
        firstVisible >= Math.max(shorts.length - 3, 0)
      ) {
        loadShorts({ cursor: nextCursor });
      }
    },
    [hasMore, isLoadingMore, loadShorts, nextCursor, shorts.length],
  );

  const handleToggleLike = useCallback(async (shortId: number) => {
    setLikeLoadingId(shortId);

    try {
      const response = await ShortService.toggleLike(shortId);
      setLikedMap((current) => ({
        ...current,
        [shortId]: response.data.liked,
      }));
      setShorts((current) =>
        current.map((item) =>
          item.id === shortId
            ? { ...item, likes_count: response.data.likes_count }
            : item,
        ),
      );
    } catch (toggleError) {
      Alert.alert(
        "Like failed",
        toggleError instanceof Error
          ? toggleError.message
          : "Please try again.",
      );
    } finally {
      setLikeLoadingId(null);
    }
  }, []);

  const handleOpenComments = useCallback((short: ShortVideo) => {
    setCommentSheetShort(short);
  }, []);

  const handleShareShort = useCallback(async (item: ShortVideo) => {
    setShareLoadingId(item.id);

    try {
      const result = await Share.share({
        message: `${item.title}\n${item.video_url}`,
        url: item.video_url,
        title: item.title,
      });

      if (result.action === Share.sharedAction) {
        const response = await ShortService.recordShare(item.id);
        setShorts((current) =>
          current.map((short) =>
            short.id === item.id
              ? { ...short, shares_count: response.data.shares_count }
              : short,
          ),
        );
      }
    } catch (shareError) {
      Alert.alert(
        "Share failed",
        shareError instanceof Error ? shareError.message : "Please try again.",
      );
    } finally {
      setShareLoadingId(null);
    }
  }, []);

  const handleToggleSave = useCallback(
    async (shortId: number) => {
      setSaveLoadingId(shortId);

      try {
        const response = await ShortService.toggleSave(shortId);
        setBookmarkedMap((current) => ({
          ...current,
          [shortId]: response.data.saved,
        }));

        if (response.data.saved) {
          showSuccess("Saved", "Short added to your saved list.");
        } else {
          showInfo("Removed", "Short removed from your saved list.");
        }
      } catch (toggleError) {
        showError(
          "Save failed",
          toggleError instanceof Error
            ? toggleError.message
            : "Please try again.",
        );
      } finally {
        setSaveLoadingId(null);
      }
    },
    [showError, showInfo, showSuccess],
  );

  const handleCreateShort = useCallback(() => {
    router.push("/short/create");
  }, [router]);

  const handleMyShorts = useCallback(() => {
    router.push("/short/my");
  }, [router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#FFFFFF" size="large" />
        <Text className="mt-4 text-sm font-semibold text-white/80">
          Loading shorts...
        </Text>
      </View>
    );
  }

  if (error && shorts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6">
        <Text className="text-center text-base font-semibold text-white">
          {error}
        </Text>
        <TouchableOpacity
          activeOpacity={0.9}
          className="mt-4 rounded-full border border-white/25 bg-white/10 px-5 py-3"
          onPress={() => loadShorts({ refresh: true })}
        >
          <Text className="text-sm font-semibold text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <FlatList
        data={shorts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <ShortCard
            item={item}
            isActive={index === activeIndex}
            isScreenFocused={isFocused}
            topInset={insets.top}
            tabBarHeight={tabBarHeight}
            liked={likedMap[item.id] ?? false}
            bookmarked={bookmarkedMap[item.id] ?? false}
            onToggleLike={() => handleToggleLike(item.id)}
            onToggleSave={() => handleToggleSave(item.id)}
            onOpenComments={() => handleOpenComments(item)}
            onShareShort={() => handleShareShort(item)}
            onCreateShort={handleCreateShort}
            onMyShorts={handleMyShorts}
            likeLoading={likeLoadingId === item.id}
            shareLoading={shareLoadingId === item.id}
            saveLoading={saveLoadingId === item.id}
          />
        )}
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        showsVerticalScrollIndicator={false}
        bounces={false}
        initialNumToRender={2}
        windowSize={3}
        removeClippedSubviews
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        onRefresh={() => loadShorts({ refresh: true })}
        refreshing={isRefreshing}
        ListFooterComponent={
          isLoadingMore ? (
            <View className="items-center py-4">
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : null
        }
      />

      <ShortCommentSheet
        visible={!!commentSheetShort}
        short={commentSheetShort}
        onClose={() => setCommentSheetShort(null)}
        onCommentAdded={(shortId) => {
          setShorts((current) =>
            current.map((item) =>
              item.id === shortId
                ? { ...item, comments_count: (item.comments_count ?? 0) + 1 }
                : item,
            ),
          );
          setCommentSheetShort((current) =>
            current && current.id === shortId
              ? {
                  ...current,
                  comments_count: (current.comments_count ?? 0) + 1,
                }
              : current,
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#211d1d",
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  videoLayer: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  bottomGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  topGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
  },
  chipGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarGradient: {
    width: 35,
    height: 35,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
