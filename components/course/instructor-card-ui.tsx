import { type User } from "@/lib/services/course-service";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface InstructorCardUIProps {
  instructor?: User | null;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
}

export default function InstructorCardUI({
  instructor,
  title = "Instructor",
  subtitle,
  onPress,
}: InstructorCardUIProps) {
  const instructorName = instructor?.name?.trim() || "Unknown";
  const initials = instructorName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const content = (
    <>
      <View className="w-10 h-10 rounded-full bg-amber-100 dark:bg-[#301815] items-center justify-center overflow-hidden">
        {instructor?.profile_image ? (
          <Image
            source={{ uri: instructor.profile_image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-zinc-900 dark:text-white text-xs font-extrabold">
            {initials || "IN"}
          </Text>
        )}
      </View>

      <View className="flex-1 ml-2">
        <Text className="text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
          {title}
        </Text>

        <Text
          numberOfLines={1}
          className="text-zinc-900 dark:text-white text-sm font-medium mt-0.5"
        >
          {instructorName}
        </Text>

        {!!subtitle && (
          <Text className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
    </>
  );

  const cardClassName =
    "min-w-[190px] shrink-0 flex-row items-center rounded-2xl bg-zinc-50 dark:bg-zinc-800 px-1 py-1 elevation-sm";

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        className={cardClassName}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View className={cardClassName}>{content}</View>;
}
