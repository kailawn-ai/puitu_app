import type { CommunityGroup } from "@/lib/services/community-service";
import { ChevronRight, Lock, Users } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface CommunityChatRowProps {
  group: CommunityGroup;
  onPress?: (group: CommunityGroup) => void;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function CommunityChatRow({
  group,
  onPress,
}: CommunityChatRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(group)}
      className="mb-3 flex-row items-center rounded-[28px] border border-slate-200 bg-white px-4 py-4 dark:border-secondary-700 dark:bg-secondary-800"
    >
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500">
        <Text className="text-base font-semibold text-white">
          {getInitials(group.name)}
        </Text>
      </View>

      <View className="ml-3 flex-1">
        <View className="flex-row items-center">
          <Text
            numberOfLines={1}
            className="flex-1 text-base font-semibold text-slate-900 dark:text-white"
          >
            {group.name}
          </Text>

          {group.is_private ? (
            <View className="ml-2 rounded-full bg-slate-100 p-1.5 dark:bg-secondary-700">
              <Lock size={12} color="#64748B" />
            </View>
          ) : null}
        </View>

        <Text
          numberOfLines={2}
          className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300"
        >
          {group.description?.trim() ||
            "Open the group chat to see live messages and continue the conversation."}
        </Text>

        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Users size={14} color="#64748B" />
            <Text className="ml-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {group.members_count ?? 0} members
            </Text>
          </View>

          <View className="rounded-full bg-emerald-50 px-3 py-1.5 dark:bg-emerald-500/15">
            <Text className="text-xs font-semibold text-emerald-700 dark:text-emerald-200">
              Live chat
            </Text>
          </View>
        </View>
      </View>

      <ChevronRight size={18} color="#94A3B8" />
    </TouchableOpacity>
  );
}
