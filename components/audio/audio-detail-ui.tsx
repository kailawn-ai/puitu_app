import { type CourseAudio } from "@/lib/services/audio-service";
import { Clock3, Headphones, ShieldCheck, Volume2 } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface AudioDetailUIProps {
  audio: CourseAudio;
  onOpenPlayback?: (url: string) => void;
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

export default function AudioDetailUI({ audio, onOpenPlayback }: AudioDetailUIProps) {
  return (
    <View className="mx-4 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <View className="h-48 bg-zinc-100 dark:bg-zinc-800 items-center justify-center">
        <View className="w-20 h-20 rounded-full items-center justify-center bg-zinc-200 dark:bg-zinc-700">
          <Headphones size={36} color="#6B7280" />
        </View>
      </View>

      <View className="p-4">
        <Text className="text-zinc-900 dark:text-zinc-100 text-lg font-semibold">
          {audio.title}
        </Text>

        <View className="mt-3 flex-row flex-wrap">
          <View className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 mr-2 mb-2 flex-row items-center">
            <Clock3 size={12} color="#9CA3AF" />
            <Text className="ml-1 text-xs text-zinc-700 dark:text-zinc-300">
              {formatDuration(audio.duration_seconds)}
            </Text>
          </View>

          <View className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 mr-2 mb-2">
            <Text className="text-xs text-zinc-700 dark:text-zinc-300">
              {formatBytes(audio.size_bytes)}
            </Text>
          </View>

          {!!audio.language && (
            <View className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 mr-2 mb-2">
              <Text className="text-xs text-zinc-700 dark:text-zinc-300">
                {audio.language}
              </Text>
            </View>
          )}

          {audio.is_free_preview && (
            <View className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mr-2 mb-2 flex-row items-center">
              <ShieldCheck size={12} color="#059669" />
              <Text className="ml-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Free Preview
              </Text>
            </View>
          )}
        </View>

        {!!audio.mime_type && (
          <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {audio.mime_type}
          </Text>
        )}

        {!!audio.description && (
          <Text className="mt-3 text-zinc-600 dark:text-zinc-300 leading-5">
            {audio.description}
          </Text>
        )}

        <Pressable
          disabled={!audio.playback_url}
          onPress={() => audio.playback_url && onOpenPlayback?.(audio.playback_url)}
          className={`mt-4 rounded-xl px-4 py-3 items-center flex-row justify-center ${
            audio.playback_url ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-700"
          }`}
        >
          <Volume2 size={16} color="#fff" />
          <Text className="text-white font-semibold ml-2">
            {audio.playback_url ? "Play Audio" : "Playback Not Available"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
