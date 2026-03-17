import { LucideIcon } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface CommunityQuickActionCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  backgroundColor: string;
  onPress?: () => void;
}

export default function CommunityQuickActionCard({
  title,
  subtitle,
  icon: Icon,
  color,
  backgroundColor,
  onPress,
}: CommunityQuickActionCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="flex-1 rounded-3xl border border-slate-200 bg-white px-4 py-4 dark:border-secondary-700 dark:bg-secondary-800"
    >
      <View
        className="mb-4 h-12 w-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor }}
      >
        <Icon size={22} color={color} />
      </View>

      <Text className="text-base font-semibold text-slate-900 dark:text-white">
        {title}
      </Text>
      <Text className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}
