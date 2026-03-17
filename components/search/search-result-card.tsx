import type { SearchListItem } from "@/lib/services/search-service";
import {
  BriefcaseBusiness,
  CircleHelp,
  FileQuestion,
  Search,
  Users,
} from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface SearchResultCardProps {
  item: SearchListItem;
  onPress?: (item: SearchListItem) => void;
}

const getAccent = (type: SearchListItem["entityType"]) => {
  switch (type) {
    case "course":
      return {
        icon: Search,
        color: "#7A25FF",
        background: "#F3E8FF",
        label: "Course",
      };
    case "job":
      return {
        icon: BriefcaseBusiness,
        color: "#0F766E",
        background: "#CCFBF1",
        label: "Job",
      };
    case "old_question":
      return {
        icon: FileQuestion,
        color: "#B45309",
        background: "#FEF3C7",
        label: "Old Question",
      };
    case "community_group":
      return {
        icon: Users,
        color: "#1D4ED8",
        background: "#DBEAFE",
        label: "Community",
      };
    case "quiz":
    default:
      return {
        icon: CircleHelp,
        color: "#BE185D",
        background: "#FCE7F3",
        label: "Quiz",
      };
  }
};

export default function SearchResultCard({
  item,
  onPress,
}: SearchResultCardProps) {
  const accent = getAccent(item.entityType);
  const AccentIcon = accent.icon;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onPress?.(item)}
      className="mb-4 rounded-[28px] border border-slate-200 bg-white/95 p-4 dark:border-secondary-700 dark:bg-secondary-900"
    >
      <View className="flex-row items-start">
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            className="h-16 w-16 rounded-2xl"
            resizeMode="cover"
          />
        ) : (
          <View
            className="h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: accent.background }}
          >
            <AccentIcon size={24} color={accent.color} />
          </View>
        )}

        <View className="ml-4 flex-1">
          <View className="flex-row items-center justify-between">
            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: accent.background }}
            >
              <Text
                className="text-[11px] font-semibold"
                style={{ color: accent.color }}
              >
                {item.badge ?? accent.label}
              </Text>
            </View>

            {typeof item.relevanceScore === "number" ? (
              <Text className="ml-3 text-xs text-slate-400 dark:text-slate-500">
                {Math.round(item.relevanceScore)}
              </Text>
            ) : null}
          </View>

          <Text
            numberOfLines={2}
            className="mt-3 text-base font-semibold text-slate-900 dark:text-white"
          >
            {item.title}
          </Text>

          {!!item.subtitle && (
            <Text
              numberOfLines={1}
              className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400"
            >
              {item.subtitle}
            </Text>
          )}

          {!!item.description && (
            <Text
              numberOfLines={2}
              className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300"
            >
              {item.description}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
