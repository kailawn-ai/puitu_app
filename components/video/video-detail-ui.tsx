import { type CourseVideo } from "@/lib/services/video-service";
import {
  CirclePlay,
  Clock3,
  Film,
  Maximize,
  ShieldCheck,
} from "lucide-react-native";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

interface VideoDetailUIProps {
  video: CourseVideo;
  onOpenPlayback?: () => void;
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
  onOpenPlayback,
}: VideoDetailUIProps) {
  const hasThumb = !!video.thumbnail_url;
  const canPlay = !!video.playback_url;

  return (
    <View className="mx-4 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <View className="h-56 bg-zinc-100 dark:bg-zinc-800 items-center justify-center relative">
        {hasThumb ? (
          <Image
            source={{ uri: video.thumbnail_url! }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Film size={42} color="#9CA3AF" />
        )}

        <Pressable
          disabled={!canPlay}
          onPress={() => canPlay && onOpenPlayback?.()}
          className={`absolute w-16 h-16 rounded-full items-center justify-center ${
            canPlay ? "bg-black/60" : "bg-zinc-500/60"
          }`}
        >
          <CirclePlay size={30} color="#FFFFFF" />
        </Pressable>
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
