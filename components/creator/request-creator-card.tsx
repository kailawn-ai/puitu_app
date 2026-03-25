import { ArrowRight, Bookmark, BriefcaseBusiness } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface RequestCreatorCardProps {
  onPress: () => void;
  isDark?: boolean;
}

export function RequestCreatorCard({
  onPress,
  isDark = false,
}: RequestCreatorCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      className="mx-4 mb-5 overflow-hidden rounded-[28px] border"
      style={{
        backgroundColor: isDark ? "#18181B" : "#FAF8F5",
        borderColor: isDark ? "#27272A" : "#ECE7DF",
      }}
    >
      <View className="p-5">
        <View className="mb-5 flex-row items-start justify-between">
          <View
            className="h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: isDark ? "#27272A" : "#FFFFFF" }}
          >
            <BriefcaseBusiness
              size={24}
              color={isDark ? "#F4F4F5" : "#111827"}
            />
          </View>

          <View
            className="flex-row items-center rounded-xl px-3 py-2"
            style={{ backgroundColor: isDark ? "#27272A" : "#FFFFFF" }}
          >
            <Text
              className="mr-2 text-xs font-semibold"
              style={{ color: isDark ? "#E4E4E7" : "#1F2937" }}
            >
              Request creator
            </Text>
            <Bookmark size={14} color={isDark ? "#E4E4E7" : "#111827"} />
          </View>
        </View>

        <Text
          className="text-base font-semibold"
          style={{ color: isDark ? "#FAFAFA" : "#1F2937" }}
        >
          Creator Program
        </Text>
        <Text
          className="mt-1 text-2xl font-bold"
          style={{ color: isDark ? "#FFFFFF" : "#111111" }}
        >
          Become Puitu Tutor, and monitize your profile
        </Text>

        <View className="mt-4 flex-row flex-wrap">
          {["Profile review", "Flexible approval"].map((label) => (
            <View
              key={label}
              className="mb-2 mr-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: isDark ? "#27272A" : "#F1ECE4" }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: isDark ? "#E4E4E7" : "#3F3F46" }}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        <View
          className="mt-4 flex-row items-center justify-between border-t pt-4"
          style={{ borderColor: isDark ? "#27272A" : "#E7E0D5" }}
        >
          <View>
            <Text
              className="text-sm font-bold"
              style={{ color: isDark ? "#FFFFFF" : "#111111" }}
            >
              Start creator journey
            </Text>
          </View>

          <View
            className="flex-row items-center rounded-2xl px-4 py-3"
            style={{ backgroundColor: isDark ? "#F4F4F5" : "#111111" }}
          >
            <Text
              className="mr-2 text-sm font-semibold"
              style={{ color: isDark ? "#111111" : "#FFFFFF" }}
            >
              Open form
            </Text>
            <ArrowRight size={16} color={isDark ? "#111111" : "#FFFFFF"} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default RequestCreatorCard;
