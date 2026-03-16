import { OldQuestion } from "@/lib/services/home-service";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface Props {
  question: OldQuestion;
  onPress?: (question: OldQuestion) => void;
}

export default function OldQuestionCard({ question, onPress }: Props) {
  return (
    <TouchableOpacity
      style={{ width: 140 }}
      className="mb-1"
      activeOpacity={0.9}
      onPress={() => onPress?.(question)}
    >
      <View className="bg-white dark:bg-secondary-600 rounded-lg overflow-hidden shadow-sm">
        {/* Image */}
        <View className="relative">
          <Image
            source={{ uri: question.thumbnail_url }}
            className="w-full h-64"
            resizeMode="cover"
          />

          {/* Free / Paid Badge */}
          <View className="absolute top-2 right-2 bg-primary px-2 py-1 rounded-full">
            <Text className="text-white text-xs font-medium">
              {question.year?.year}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="p-2 absolute bottom-0 bg-black/70 w-full">
          <Text numberOfLines={2} className="text-xs font-semibold text-white">
            {question.title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
