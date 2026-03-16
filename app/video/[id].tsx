import { BackButton } from "@/components/ui/back-button";
import MediaErrorUI from "@/components/ui/media-error-ui";
import { ResolveProductParams } from "@/lib/services/product-service";
import VideoDetailUI from "@/components/video/video-detail-ui";
import VideoService, { type CourseVideo } from "@/lib/services/video-service";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import LottieView from "lottie-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const [playerVisible, setPlayerVisible] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const player = useVideoPlayer(null, (instance) => {
    instance.loop = false;
    instance.volume = 1.0;
  });

  // Track if component is mounted
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      player.release();
    };
  }, [player]);

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
        if (playerVisible) {
          handleClosePlayer();
          return true;
        }
        router.back();
        return true;
      },
    );

    return () => backHandler.remove();
  }, [router, playerVisible]);

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
      setPlaybackError(null);

      res = await VideoService.getById(
        courseId,
        id,
        modelType ?? "course",
        modelId ?? courseId,
      );

      if (isMounted.current) {
        setVideo(res);
      }
    } catch (err: any) {
      if (!isMounted.current) return;

      const title = err?.data?.head || "Video Error";
      const message = err?.data?.message ?? "Failed to load video";
      const requiresPurchase = err?.data?.code === "666";

      setErrorTitle(title);
      setError(message);
      setErrorSheetVisible(true);
      setShowBuyAction(requiresPurchase);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [id, courseId, modelType, modelId]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const handlePlayback = useCallback(async () => {
    if (!video?.playback_url) {
      setPlaybackError("No video URL available");
      return;
    }

    try {
      setIsVideoLoading(true);
      setPlaybackError(null);

      // Only replace if URL changed or player is empty
      const currentSrc = player.src;
      if (!currentSrc || currentSrc.uri !== video.playback_url) {
        await player.replace({ uri: video.playback_url });
      }

      // Small delay to ensure player is ready
      setTimeout(() => {
        if (isMounted.current) {
          player.play();
          setPlayerVisible(true);
          setIsVideoLoading(false);
        }
      }, 100);
    } catch (err) {
      console.error("Error setting up video:", err);
      if (isMounted.current) {
        setPlaybackError("Failed to load video");
        setIsVideoLoading(false);
      }
    }
  }, [video?.playback_url, player]);

  const handleClosePlayer = useCallback(() => {
    player.pause();
    // Optional: Stop and clear source to free memory
    // player.replace({ uri: '' });
    setPlayerVisible(false);
    setIsVideoLoading(false);
    setPlaybackError(null);
  }, [player]);

  const handleBuy = useCallback(() => {
    router.push({
      pathname: "/payment",
      params: {
        modelType: (modelType as ResolveProductParams["model_type"]) ?? "course-video",
        modelId: String(modelId ?? id),
        title: "Video Access",
        returnTo: `/video/${id}?courseId=${courseId ?? ""}&modelType=${modelType ?? "course"}&modelId=${modelId ?? courseId ?? ""}`,
      },
    });
  }, [courseId, id, modelId, modelType, router]);

  const handleRetry = useCallback(() => {
    setPlaybackError(null);
    fetchVideo();
  }, [fetchVideo]);

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
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 4,
            paddingBottom: 20,
          }}
        >
          <View className="px-3 mb-2">
            <BackButton onPress={() => router.back()} />
          </View>

          {video ? (
            <VideoDetailUI video={video} onOpenPlayback={handlePlayback} />
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

        <Modal
          visible={playerVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleClosePlayer}
        >
          <View className="flex-1 bg-black">
            {/* Header */}
            <View
              className="w-full flex-row justify-between items-center"
              style={{ paddingTop: insets.top + 8, paddingHorizontal: 12 }}
            >
              <Pressable
                onPress={handleClosePlayer}
                className="rounded-lg bg-white/20 px-4 py-2"
              >
                <Text className="text-white font-semibold">Close</Text>
              </Pressable>

              {isVideoLoading && (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="text-white ml-2">Loading...</Text>
                </View>
              )}
            </View>

            {/* Video Player */}
            <View className="flex-1 items-center justify-center px-3 pb-6">
              <View className="w-full" style={{ aspectRatio: 16 / 9 }}>
                <VideoView
                  player={player}
                  nativeControls
                  allowsFullscreen
                  allowsPictureInPicture
                  contentFit="contain"
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#000",
                    borderRadius: 8,
                  }}
                />

                {/* Error overlay */}
                {playbackError && (
                  <View className="absolute inset-0 bg-black/80 items-center justify-center">
                    <Text className="text-white text-center mb-4 px-4">
                      {playbackError}
                    </Text>
                    <Pressable
                      onPress={handlePlayback}
                      className="rounded-lg bg-white px-6 py-3"
                    >
                      <Text className="text-black font-semibold">Retry</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Video Info */}
              {video && (
                <View className="mt-4 w-full px-2">
                  <Text className="text-white text-lg font-semibold">
                    {video.title}
                  </Text>
                  {video.description && (
                    <Text className="text-white/70 text-sm mt-1">
                      {video.description}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </LinearGradient>
  );
};

export default VideoDetailScreen;
