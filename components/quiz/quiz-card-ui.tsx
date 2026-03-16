import { Quiz } from "@/lib/services/quiz-service";
import { Brain, CircleHelp, Flame } from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface Props {
  quiz: Quiz;
  onPress?: (quiz: Quiz) => void;
}

const hardnessColor = (hardness?: string) => {
  switch (hardness) {
    case "easy":
      return "bg-emerald-500";
    case "hard":
      return "bg-rose-500";
    default:
      return "bg-amber-500";
  }
};

export default function QuizCard({ quiz, onPress }: Props) {
  return (
    <TouchableOpacity
      style={{ width: 240 }}
      activeOpacity={0.9}
      onPress={() => onPress?.(quiz)}
      className="mb-10"
    >
      <View className="rounded-2xl overflow-hidden bg-white dark:bg-secondary-800 shadow-sm">
        <View className="relative h-36 bg-slate-200 dark:bg-secondary-700">
          {quiz.thumbnail_url ? (
            <Image
              source={{ uri: quiz.thumbnail_url }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Brain size={28} color="#64748B" />
            </View>
          )}

          <View
            className={`absolute top-2 right-2 px-2 py-1 rounded-full ${hardnessColor(
              quiz.hardness,
            )}`}
          >
            <Text className="text-white text-xs font-semibold capitalize">
              {quiz.hardness}
            </Text>
          </View>
        </View>

        <View className="p-3">
          <Text
            className="text-gray-900 dark:text-white text-sm font-semibold"
            numberOfLines={2}
          >
            {quiz.title}
          </Text>

          {!!quiz.description && (
            <Text
              className="text-xs text-gray-500 dark:text-gray-300 mt-1"
              numberOfLines={2}
            >
              {quiz.description}
            </Text>
          )}

          <View className="flex-row items-center mt-3">
            <View className="flex-row items-center mr-3">
              <CircleHelp size={13} color="#64748B" />
              <Text className="text-xs text-gray-600 dark:text-gray-300 ml-1">
                {quiz.questions_count ?? 0}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Flame size={13} color="#64748B" />
              <Text className="text-xs text-gray-600 dark:text-gray-300 ml-1">
                {quiz.attempts_count ?? 0}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
