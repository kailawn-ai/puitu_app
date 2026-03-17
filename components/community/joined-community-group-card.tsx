import type { CommunityGroup } from "@/lib/services/community-service";
import {
  ChevronRight,
  Crown,
  Lock,
  MessageSquareText,
  Users,
} from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface JoinedCommunityGroupCardProps {
  group: CommunityGroup;
  onPress?: (group: CommunityGroup) => void;
}

export default function JoinedCommunityGroupCard({
  group,
  onPress,
}: JoinedCommunityGroupCardProps) {
  const ownerName = group.owner?.name?.trim() || "Community lead";

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onPress?.(group)}
      className="mb-4 overflow-hidden rounded-[30px] border border-violet-200 bg-white dark:border-secondary-700 dark:bg-secondary-800"
    >
      <View className="bg-violet-50 px-5 py-4 dark:bg-violet-500/10">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-lg font-semibold text-slate-900 dark:text-white">
              {group.name}
            </Text>
            {!!group.description && (
              <Text
                numberOfLines={2}
                className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300"
              >
                {group.description}
              </Text>
            )}
          </View>

          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-violet-500">
            <Users size={22} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <View className="px-5 py-4">
        <View className="flex-row flex-wrap items-center">
          <View className="mr-2 mb-2 flex-row items-center rounded-full bg-violet-50 px-3 py-2 dark:bg-secondary-700">
            <Users size={13} color="#7A25FF" />
            <Text className="ml-2 text-xs font-medium text-slate-700 dark:text-slate-200">
              {group.members_count ?? 0} members
            </Text>
          </View>

          <View className="mr-2 mb-2 flex-row items-center rounded-full bg-violet-50 px-3 py-2 dark:bg-secondary-700">
            <MessageSquareText size={13} color="#7A25FF" />
            <Text className="ml-2 text-xs font-medium text-slate-700 dark:text-slate-200">
              Group chat active
            </Text>
          </View>

          {group.is_private ? (
            <View className="mr-2 mb-2 flex-row items-center rounded-full bg-violet-50 px-3 py-2 dark:bg-secondary-700">
              <Lock size={13} color="#7A25FF" />
              <Text className="ml-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                Private
              </Text>
            </View>
          ) : null}
        </View>

        <View className="mt-2 flex-row items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-secondary-900">
          <View className="flex-row items-center">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-amber-100">
              <Crown size={16} color="#B45309" />
            </View>
            <View className="ml-3">
              <Text className="text-xs uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
                Group owner
              </Text>
              <Text className="text-sm font-medium text-slate-900 dark:text-white">
                {ownerName}
              </Text>
            </View>
          </View>

          <ChevronRight size={18} color="#94A3B8" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
