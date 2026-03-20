import type { CommunityGroup } from "@/lib/services/community-service";
import { Lock, MessageSquareText, Plus, Users } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface CommunityGroupCardProps {
  group: CommunityGroup;
  variant?: "owned" | "discover";
  onPress?: (group: CommunityGroup) => void;
  onJoin?: (group: CommunityGroup) => void;
  joining?: boolean;
}

export default function CommunityGroupCard({
  group,
  variant = "discover",
  onPress,
  onJoin,
  joining = false,
}: CommunityGroupCardProps) {
  const accentColor = variant === "owned" ? "#7A25FF" : "#0F766E";
  const accentBackground = variant === "owned" ? "#F3E8FF" : "#CCFBF1";
  const showJoinAction = variant === "discover" && !!onJoin;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onPress?.(group)}
      className="mb-4 rounded-[28px] border border-slate-200 bg-white/70 p-4 dark:border-secondary-700 dark:bg-secondary-800"
    >
      <View className="flex-row items-center">
        <View
          className="h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: accentBackground }}
        >
          <Users size={24} color={accentColor} />
        </View>

        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              numberOfLines={1}
              className="flex-1 text-base font-semibold text-slate-900 dark:text-white"
            >
              {group.name}
            </Text>

            <View className="ml-2 flex-row items-center">
              {group.is_private ? (
                <View className="mr-2 rounded-full bg-slate-100 px-2 py-1 dark:bg-secondary-700">
                  <Lock size={12} color="#64748B" />
                </View>
              ) : null}

              {showJoinAction ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  disabled={joining}
                  onPress={(event) => {
                    event.stopPropagation();
                    onJoin?.(group);
                  }}
                  className={`flex-row items-center self-center rounded-full px-4 py-3 ${
                    joining
                      ? "bg-slate-200 dark:bg-secondary-700"
                      : "bg-cyan-500"
                  }`}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text className="ml-1.5 text-sm font-semibold text-white">
                    {joining ? "Joining..." : "Join"}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap items-center">
        <View className="mr-2 mb-2 flex-row items-center rounded-full bg-slate-100 px-3 py-2 dark:bg-secondary-700">
          <Users size={13} color="#64748B" />
          <Text className="ml-2 text-xs font-medium text-slate-700 dark:text-slate-200">
            {group.members_count ?? 0} members
          </Text>
        </View>

        <View className="mr-2 mb-2 flex-row items-center rounded-full bg-slate-100 px-3 py-2 dark:bg-secondary-700">
          <MessageSquareText size={13} color="#64748B" />
          <Text className="ml-2 text-xs font-medium text-slate-700 dark:text-slate-200">
            Chat ready
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
