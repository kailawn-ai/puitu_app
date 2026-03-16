import { type CourseImage } from "@/lib/services/image-service";
import { Image as ImageIcon, Maximize, ShieldCheck } from "lucide-react-native";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

interface ImageDetailUIProps {
  image: CourseImage;
  onOpenImage?: (url: string) => void;
}

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

export default function ImageDetailUI({ image, onOpenImage }: ImageDetailUIProps) {
  const hasImage = !!image.image_url;

  return (
    <View className="mx-4 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <View className="h-60 bg-zinc-100 dark:bg-zinc-800 items-center justify-center">
        {hasImage ? (
          <Image
            source={{ uri: image.image_url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <ImageIcon size={42} color="#9CA3AF" />
        )}
      </View>

      <View className="p-4">
        <Text className="text-zinc-900 dark:text-zinc-100 text-lg font-semibold">
          {image.title}
        </Text>

        <View className="mt-3 flex-row flex-wrap">
          {!!image.width && !!image.height && (
            <View className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 mr-2 mb-2 flex-row items-center">
              <Maximize size={12} color="#9CA3AF" />
              <Text className="ml-1 text-xs text-zinc-700 dark:text-zinc-300">
                {image.width}x{image.height}
              </Text>
            </View>
          )}

          <View className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 mr-2 mb-2">
            <Text className="text-xs text-zinc-700 dark:text-zinc-300">
              {formatBytes(image.size_bytes)}
            </Text>
          </View>

          {image.is_free_preview && (
            <View className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mr-2 mb-2 flex-row items-center">
              <ShieldCheck size={12} color="#059669" />
              <Text className="ml-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Free Preview
              </Text>
            </View>
          )}
        </View>

        {!!image.mime_type && (
          <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {image.mime_type}
          </Text>
        )}

        {!!image.description && (
          <Text className="mt-3 text-zinc-600 dark:text-zinc-300 leading-5">
            {image.description}
          </Text>
        )}

        <Pressable
          disabled={!image.image_url}
          onPress={() => image.image_url && onOpenImage?.(image.image_url)}
          className={`mt-4 rounded-xl px-4 py-3 items-center ${
            image.image_url ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-700"
          }`}
        >
          <Text className="text-white font-semibold">
            {image.image_url ? "View Full Image" : "Image Not Available"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
