import { type Qualification } from "@/lib/services/qualification-service";
import {
  ChevronRight,
  FileBadge2,
  Layers3,
  Sparkles,
} from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface QualificationBrowseCardProps {
  qualification: Qualification;
  onPress?: (qualification: Qualification) => void;
  compact?: boolean;
}

export default function QualificationBrowseCard({
  qualification,
  onPress,
  compact = false,
}: QualificationBrowseCardProps) {
  if (compact) {
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onPress?.(qualification)}
        className="mb-3 flex-1 rounded-3xl border border-slate-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <Text
          numberOfLines={2}
          className="mt-3 text-sm font-semibold leading-5 text-slate-900 dark:text-white"
        >
          {qualification.name}
        </Text>

        <View className="mt-3 flex-row flex-wrap items-center">
          <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {qualification.courses_count ?? 0} courses
          </Text>
          <Text className="mx-1.5 text-[11px] text-slate-300 dark:text-slate-600">
            •
          </Text>
          <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {qualification.users_count ?? 0} learners
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onPress?.(qualification)}
      className="mb-3 rounded-[28px] border border-slate-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center">
            <View className="rounded-2xl bg-amber-50 p-3">
              <FileBadge2 size={20} color="#B45309" />
            </View>
            {qualification.courses_count ? (
              <View className="ml-3 rounded-full bg-primary/10 px-3 py-1.5">
                <Text className="text-xs font-semibold text-primary dark:text-primary-300">
                  {qualification.courses_count} courses
                </Text>
              </View>
            ) : null}
          </View>

          <Text className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
            {qualification.name}
          </Text>

          {!!qualification.description && (
            <Text
              numberOfLines={2}
              className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400"
            >
              {qualification.description}
            </Text>
          )}

          <View className="mt-4 flex-row flex-wrap items-center">
            <View className="mr-4 flex-row items-center">
              <Layers3 size={14} color="#64748B" />
              <Text className="ml-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {qualification.users_count ?? 0} learners
              </Text>
            </View>

            <View className="flex-row items-center">
              <Sparkles size={14} color="#64748B" />
              <Text className="ml-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {qualification.is_custom ? "Custom" : "Public"}
              </Text>
            </View>
          </View>
        </View>

        <View className="rounded-full bg-primary p-2.5">
          <ChevronRight size={16} color="#FFFFFF" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
