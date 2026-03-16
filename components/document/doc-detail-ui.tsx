import { type CourseDocument } from "@/lib/services/document-service";
import { Clock3, FileText, Globe, ShieldCheck } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface DocDetailUIProps {
  document: CourseDocument;
  onOpenDocument?: (url: string) => void;
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

export default function DocDetailUI({ document, onOpenDocument }: DocDetailUIProps) {
  return (
    <View className="mx-4 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <View className="h-48 bg-zinc-100 dark:bg-zinc-800 items-center justify-center">
        <FileText size={46} color="#9CA3AF" />
      </View>

      <View className="p-4">
        <Text className="text-zinc-900 dark:text-zinc-100 text-lg font-semibold">
          {document.title}
        </Text>

        <View className="mt-3 flex-row flex-wrap">
          {typeof document.pages === "number" && document.pages >= 0 && (
            <View className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 mr-2 mb-2 flex-row items-center">
              <FileText size={12} color="#9CA3AF" />
              <Text className="ml-1 text-xs text-zinc-700 dark:text-zinc-300">
                {document.pages} pages
              </Text>
            </View>
          )}

          <View className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 mr-2 mb-2 flex-row items-center">
            <Clock3 size={12} color="#9CA3AF" />
            <Text className="ml-1 text-xs text-zinc-700 dark:text-zinc-300">
              {formatBytes(document.size_bytes)}
            </Text>
          </View>

          {!!document.language && (
            <View className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 mr-2 mb-2 flex-row items-center">
              <Globe size={12} color="#9CA3AF" />
              <Text className="ml-1 text-xs text-zinc-700 dark:text-zinc-300">
                {document.language}
              </Text>
            </View>
          )}

          {document.is_free_preview && (
            <View className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mr-2 mb-2 flex-row items-center">
              <ShieldCheck size={12} color="#059669" />
              <Text className="ml-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Free Preview
              </Text>
            </View>
          )}
        </View>

        {!!document.mime_type && (
          <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {document.mime_type}
          </Text>
        )}

        {!!document.description && (
          <Text className="mt-3 text-zinc-600 dark:text-zinc-300 leading-5">
            {document.description}
          </Text>
        )}

        <Pressable
          disabled={!document.file_url}
          onPress={() => document.file_url && onOpenDocument?.(document.file_url)}
          className={`mt-4 rounded-xl px-4 py-3 items-center ${
            document.file_url ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-700"
          }`}
        >
          <Text className="text-white font-semibold">
            {document.file_url ? "Open Document" : "File Not Available"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
