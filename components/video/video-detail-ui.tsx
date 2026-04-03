import { type CourseVideo } from "@/lib/services/video-service";
import { VideoView } from "expo-video";
import { Clock3, Film, Maximize, ShieldCheck } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";

interface VideoDetailUIProps {
  video: CourseVideo;
  player?: any;
  isVideoLoading?: boolean;
  playbackError?: string | null;
  onRetryPlayback?: () => void;
}

const formatDuration = (seconds?: number | null) => {
  if (!seconds || seconds <= 0) return "Unknown";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const formatBytes = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return "Unknown";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let idx = 0;
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024;
    idx += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[idx]}`;
};

export default function VideoDetailUI({
  video,
  player,
  isVideoLoading = false,
  playbackError,
  onRetryPlayback,
}: VideoDetailUIProps) {
  const hasThumb = !!video.thumbnail_url;
  const canPlay = !!video.playback_url;

  return (
    <View className="overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <View
        className="bg-zinc-100 dark:bg-zinc-800 relative"
        style={{ aspectRatio: 16 / 9 }}
      >
        {canPlay && player ? (
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
            }}
          />
        ) : hasThumb ? (
          <Image
            source={{ uri: video.thumbnail_url! }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Film size={42} color="#9CA3AF" />
          </View>
        )}

        {isVideoLoading && (
          <View className="absolute inset-0 items-center justify-center bg-black/40">
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}

        {playbackError && (
          <View className="absolute inset-0 items-center justify-center bg-black/80 px-4">
            <Text className="text-white text-center mb-4">{playbackError}</Text>
            <Pressable
              onPress={onRetryPlayback}
              className="rounded-lg bg-white px-5 py-3"
            >
              <Text className="text-black font-semibold">Retry</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View className="p-4">
        <Text className="text-zinc-900 dark:text-zinc-100 text-lg font-semibold">
          {video.title}
        </Text>

        <View className="mt-3 flex-row flex-wrap">
          <View className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 mr-2 mb-2 flex-row items-center">
            <Clock3 size={12} color="#9CA3AF" />
            <Text className="ml-1 text-xs text-zinc-700 dark:text-zinc-300">
              {formatDuration(video.duration_seconds)}
            </Text>
          </View>
          <View className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 mr-2 mb-2">
            <Text className="text-xs text-zinc-700 dark:text-zinc-300">
              {formatBytes(video.size_bytes)}
            </Text>
          </View>
          {!!video.width && !!video.height && (
            <View className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 mr-2 mb-2 flex-row items-center">
              <Maximize size={12} color="#9CA3AF" />
              <Text className="ml-1 text-xs text-zinc-700 dark:text-zinc-300">
                {video.width}x{video.height}
              </Text>
            </View>
          )}
          {video.is_free_preview && (
            <View className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mr-2 mb-2 flex-row items-center">
              <ShieldCheck size={12} color="#059669" />
              <Text className="ml-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Free Preview
              </Text>
            </View>
          )}
        </View>

        {!!video.description && (
          <Text className="mt-2 text-zinc-600 dark:text-zinc-300 leading-5">
            {video.description}
          </Text>
        )}
        {!canPlay && (
          <View className="mt-4 rounded-xl px-4 py-3 items-center bg-zinc-300 dark:bg-zinc-700">
            <Text className="text-white font-semibold">
              Playback Not Available
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
