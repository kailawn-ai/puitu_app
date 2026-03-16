import { OldQuestion } from "@/lib/services/home-service";
import { FlatList, Text, View } from "react-native";
import OldQuestionCard from "./old-card-ui";

interface Props {
  questions: OldQuestion[];
  onPressItem?: (question: OldQuestion) => void;
}

export default function OldQuestionsSection({ questions, onPressItem }: Props) {
  if (!questions?.length) return null;

  return (
    <View className="mb-6">
      <Text className="font-semibold text-lg text-gray-900 dark:text-white mb-3 px-6">
        Old Questions
      </Text>

      <FlatList
        data={questions}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        decelerationRate="fast"
        snapToAlignment="start"
        renderItem={({ item }) => (
          <OldQuestionCard question={item} onPress={onPressItem} />
        )}
      />
    </View>
  );
}
