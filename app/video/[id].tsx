import { useVideoPlayerStore } from "@/store/video-player-store";
import MediaErrorUI from "@/components/ui/media-error-ui";
import { ResolveProductParams } from "@/lib/services/product-service";
import { extractDeniedProductId } from "@/lib/utils/product-access";
import VideoDetailUI from "@/components/video/video-detail-ui";
import { VideoService, type CourseVideo } from "@/lib/services/video-service";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui/back-button";

const LOADER_ANIMATION = require("../../assets/icons/loader.json");

const VideoDetailScreen = () => {
  const { id, courseId, modelType, modelId } = useLocalSearchParams<{
    id: string;
    courseId?: string;
    modelType?: string;
    modelId?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState("Video Error");
  const [video, setVideo] = useState<CourseVideo | null>(null);
  const [errorSheetVisible, setErrorSheetVisible] = useState(false);
  const [showBuyAction, setShowBuyAction] = useState(false);
  const [lockedProductId, setLockedProductId] = useState<string | undefined>();
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const {
    player,
    setCurrentVideo,
    currentVideo,
    routeParams,
    lastLoadedUrl,
    setLastLoadedUrl,
    closePlayer,
  } = useVideoPlayerStore();

  const isCurrentVideoMatch =
    !!currentVideo &&
    String(currentVideo.id) === String(id) &&
    (routeParams?.courseId ?? undefined) ===
      (courseId ? String(courseId) : undefined) &&
    (routeParams?.modelType ?? undefined) ===
      (modelType ? String(modelType) : undefined) &&
    (routeParams?.modelId ?? undefined) ===
      (modelId ? String(modelId) : undefined);

  // Track if component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle video playback errors and status changes
  useEffect(() => {
    const statusSubscription = player.addListener("statusChange", (status) => {
      if (!isMounted.current) return;

      console.log("Player status:", status);
    });

    const playingSubscription = player.addListener("playingChange", (event) => {
      if (!isMounted.current) return;
      console.log("Playing state:", event.isPlaying);
    });

    const volumeSubscription = player.addListener("volumeChange", (event) => {
      console.log("Volume changed:", event.volume);
    });

    return () => {
      statusSubscription.remove();
      playingSubscription.remove();
      volumeSubscription.remove();
    };
  }, [player]);

  // Handle hardware back button
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

  const fetchVideo = useCallback(async () => {
    let res: any;
    if (!id || !courseId) {
      setError("Missing video id or course id");
      setShowBuyAction(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setErrorTitle("Video Error");
      setErrorSheetVisible(false);
      setShowBuyAction(false);
      setLockedProductId(undefined);
      setPlaybackError(null);
      setVideo(null);

      if (!isCurrentVideoMatch) {
        closePlayer();
      }

      res = await VideoService.getById(
        courseId,
        id,
        modelType ?? "course",
        modelId ?? courseId,
      );

      if (isMounted.current) {
        setVideo(res);
        setCurrentVideo(res, {
          id: String(id),
          courseId: courseId ? String(courseId) : undefined,
          modelType: modelType ? String(modelType) : undefined,
          modelId: modelId ? String(modelId) : undefined,
        });
      }
    } catch (err: any) {
      if (!isMounted.current) return;

      const title = err?.data?.head || "Video Error";
      const message = err?.data?.message ?? "Failed to load video";
      const errorCode = String(err?.data?.code ?? "");
      const deniedProductId = extractDeniedProductId(err?.data);
      const canBuy = errorCode === "666" || errorCode === "667";

      closePlayer();
      setVideo(null);

      setErrorTitle(title);
      setError(message);
      setErrorSheetVisible(true);
      setShowBuyAction(canBuy);
      setLockedProductId(deniedProductId);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [
    id,
    courseId,
    modelType,
    modelId,
    setCurrentVideo,
    closePlayer,
    isCurrentVideoMatch,
  ]);

  useEffect(() => {
    if (isCurrentVideoMatch && currentVideo) {
      setVideo(currentVideo);
      setLoading(false);
      setError(null);
      setErrorSheetVisible(false);
      return;
    }

    fetchVideo();
  }, [currentVideo, fetchVideo, isCurrentVideoMatch]);

  const handlePlayback = useCallback(async () => {
    if (!video?.playback_url) {
      setPlaybackError("No video URL available");
      return;
    }

    try {
      setIsVideoLoading(true);
      setPlaybackError(null);

      if (lastLoadedUrl !== video.playback_url) {
        await player.replaceAsync({ uri: video.playback_url });
        setLastLoadedUrl(video.playback_url);
      }

      if (isMounted.current) {
        player.play();
        setIsVideoLoading(false);
      }
    } catch (err) {
      console.error("Error setting up video:", err);
      if (isMounted.current) {
        setPlaybackError("Failed to load video");
        setIsVideoLoading(false);
      }
    }
  }, [lastLoadedUrl, player, setLastLoadedUrl, video?.playback_url]);

  const handleBuy = useCallback(() => {
    router.push({
      pathname: "/payment",
      params: {
        courseId: courseId ? String(courseId) : undefined,
        modelType: "course-video" as ResolveProductParams["model_type"],
        modelId: String(id),
        productId: lockedProductId,
        title: "Video Access",
        returnTo: `/video/${id}?courseId=${courseId ?? ""}&modelType=${modelType ?? "course"}&modelId=${modelId ?? courseId ?? ""}`,
      },
    });
  }, [courseId, id, lockedProductId, modelId, modelType, router]);

  const handleRetry = useCallback(() => {
    setPlaybackError(null);
    fetchVideo();
  }, [fetchVideo]);

  useEffect(() => {
    if (!video?.playback_url) return;
    if (lastLoadedUrl === video.playback_url && player.playing) return;
    void handlePlayback();
  }, [handlePlayback, lastLoadedUrl, player.playing, video?.playback_url]);

  // Loading state
  if (loading) {
    return (
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#101014", "#171717"]
            : ["#F8FAFC", "#E2E8F0"]
        }
        locations={[0, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center">
          <LottieView
            source={LOADER_ANIMATION}
            autoPlay
            loop
            style={{ width: 80, height: 80 }}
          />
          <Text className="mt-2 text-zinc-500 dark:text-zinc-400">
            Loading video...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={
        colorScheme === "dark" ? ["#101014", "#171717"] : ["#F8FAFC", "#E2E8F0"]
      }
      locations={[0, 1]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1">
        <View
          className="px-3 mb-2 absolute left-0 right-0 z-10"
          style={{ paddingTop: insets.top + 1 }}
        >
          <BackButton onPress={() => router.back()} />
        </View>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 4,
            paddingBottom: 20,
          }}
        >
          {video || currentVideo ? (
            <VideoDetailUI
              video={video ?? currentVideo!}
              player={player}
              isVideoLoading={isVideoLoading}
              playbackError={playbackError}
              onRetryPlayback={handlePlayback}
            />
          ) : (
            <View className="mx-4 rounded-3xl p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              {/* Icon */}
              <View className="items-center mb-4">
                <View className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 items-center justify-center">
                  <Text className="text-3xl">🎬</Text>
                </View>
              </View>

              {/* Title */}
              <Text className="text-zinc-900 dark:text-zinc-100 text-xl font-semibold text-center">
                Unable to load video
              </Text>

              {/* Description */}
              <Text className="mt-2 text-zinc-500 dark:text-zinc-400 text-center leading-5">
                We're having trouble loading this video. This might be due to
                connection issues.
              </Text>

              {/* Buttons */}
              <View className="mt-6 flex-row gap-3">
                <Pressable
                  onPress={() => router.back()}
                  className="flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3 active:opacity-70"
                >
                  <Text className="text-zinc-700 dark:text-zinc-300 text-center font-medium">
                    Go Back
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleRetry}
                  className="flex-1 rounded-xl bg-indigo-500 px-4 py-3 active:opacity-70 shadow-sm"
                >
                  <Text className="text-white text-center font-semibold">
                    Try Again
                  </Text>
                </Pressable>
              </View>

              {/* Optional: Error details (can be toggled) */}
              <Text className="mt-4 text-xs text-zinc-400 dark:text-zinc-600 text-center">
                Error code: VIDEO_LOAD_FAILED
              </Text>
            </View>
          )}
        </ScrollView>

        <MediaErrorUI
          visible={errorSheetVisible}
          title={errorTitle}
          message={error}
          onClose={() => setErrorSheetVisible(false)}
          onRetry={handleRetry}
          onBuy={showBuyAction ? handleBuy : undefined}
          buyLabel="Buy this video"
        />
      </View>
    </LinearGradient>
  );
};

export default VideoDetailScreen;
