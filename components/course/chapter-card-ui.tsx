import { type Course, type Section } from "@/lib/services/course-service";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  CheckCircle,
  ChevronRight,
  Circle,
  Clock3,
  FileText,
  Lock,
  Play,
} from "lucide-react-native";
import { Dimensions, Pressable, Text, View } from "react-native";
import Animated, {
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

export interface ChapterCardUIProps {
  section: Section;
  course?: Course;
  onPress?: (section: Section) => void;
  onPressMenu?: (section: Section) => void;
  showMenu?: boolean;
  isCompleted?: boolean;
  isLocked?: boolean;
  progress?: number;
  index?: number;
}

function formatSectionMeta(createdAt?: string): string {
  if (!createdAt) {
    return "Today";
  }

  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Today";
  }

  const now = new Date();
  const isToday = parsedDate.toDateString() === now.toDateString();
  const dateText = isToday
    ? "Today"
    : parsedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

  const timeText = parsedDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${dateText}  ${timeText}`;
}

export default function ChapterCardUI({
  section,
  course,
  onPress,
  onPressMenu,
  showMenu = true,
  isCompleted = false,
  isLocked = false,
  progress = 0,
  index = 0,
}: ChapterCardUIProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  const videoCount = section.videos_count ?? course?.videos_count ?? 0;
  const documentCount = section.documents_count ?? course?.documents_count ?? 0;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  // Determine gradient colors based on completion/lock status
  const getGradientColors = () => {
    if (isLocked) {
      return ["#6B7280", "#4B5563"] as const;
    }
    if (isCompleted) {
      return ["#10B981", "#059669"] as const;
    }
    return ["#3B82F6", "#8B5CF6"] as const;
  };

  const [startColor, endColor] = getGradientColors();

  const getStatusIcon = () => {
    if (isLocked) {
      return <Lock size={20} color="#FFFFFF" />;
    }
    if (isCompleted) {
      return <CheckCircle size={20} color="#FFFFFF" />;
    }
    return <Circle size={20} color="#FFFFFF" />;
  };

  const content = (
    <Animated.View
      entering={FadeInRight.delay(index * 100).springify()}
      style={animatedStyle}
      className="w-full mb-1"
    >
      <LinearGradient
        colors={[startColor, endColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-full overflow-hidden"
      >
        <BlurView
          intensity={20}
          tint="dark"
          className="rounded-2xl overflow-hidden"
        >
          <View className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl px-4 py-4 flex-row items-center">
            {/* Status Indicator */}
            <View className="relative">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  isLocked
                    ? "bg-gray-500/20"
                    : isCompleted
                      ? "bg-green-500/20"
                      : "bg-blue-500/20"
                }`}
              >
                {getStatusIcon()}
              </View>

              {/* Progress Ring (if in progress) */}
              {!isCompleted && !isLocked && progress > 0 && (
                <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900 items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {Math.round(progress)}%
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-1 ml-4">
              {/* Meta Information */}
              <View className="flex-row items-center flex-wrap">
                <View className="flex-row items-center bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
                  <Clock3 size={12} color={isLocked ? "#9CA3AF" : "#3B82F6"} />
                  <Text className="text-zinc-600 dark:text-zinc-300 text-xs ml-1">
                    {formatSectionMeta(section.created_at)}
                  </Text>
                </View>

                <View className="flex-row items-center ml-2 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
                  <Play size={12} color={isLocked ? "#9CA3AF" : "#3B82F6"} />
                  <Text className="text-zinc-600 dark:text-zinc-300 text-xs ml-1">
                    {videoCount === 1 ? "1 video" : `${videoCount} videos`}
                  </Text>
                </View>

                <View className="flex-row items-center ml-2 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
                  <FileText
                    size={12}
                    color={isLocked ? "#9CA3AF" : "#3B82F6"}
                  />
                  <Text className="text-zinc-600 dark:text-zinc-300 text-xs ml-1">
                    {documentCount === 1 ? "1 doc" : `${documentCount} docs`}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text
                className={`text-base font-semibold mt-2 ${
                  isLocked
                    ? "text-zinc-500 dark:text-zinc-400"
                    : "text-zinc-900 dark:text-zinc-100"
                }`}
                numberOfLines={2}
              >
                {section.title}
              </Text>
            </View>

            {/* Action Button */}
            {showMenu && (
              <Pressable
                onPress={() => onPressMenu?.(section)}
                hitSlop={10}
                className={`ml-2 p-2 rounded-xl ${
                  isLocked ? "bg-zinc-200 dark:bg-zinc-700" : "bg-primary"
                }`}
              >
                {isLocked ? (
                  <Lock size={18} color="#9CA3AF" />
                ) : (
                  <ChevronRight size={18} color="#FFFFFF" />
                )}
              </Pressable>
            )}
          </View>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );

  if (onPress && !isLocked) {
    return (
      <Pressable
        onPress={() => onPress(section)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="w-full"
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
