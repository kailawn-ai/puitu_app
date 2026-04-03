import { OldQuestion } from "@/lib/services/home-service";
import { FlatList, Pressable, Text, View } from "react-native";
import OldQuestionCard from "./old-card-ui";

interface Props {
  questions: OldQuestion[];
  onPressItem?: (question: OldQuestion) => void;
  onPressSeeAll?: () => void;
}

export default function OldQuestionsSection({
  questions,
  onPressItem,
  onPressSeeAll,
}: Props) {
  if (!questions?.length) return null;

  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center justify-between px-6">
        <Text className="font-semibold text-lg text-gray-900 dark:text-white">
          Old Questions
        </Text>

        {onPressSeeAll ? (
          <Pressable onPress={onPressSeeAll}>
            <Text className="text-sm font-semibold text-primary">
              See all
            </Text>
          </Pressable>
        ) : null}
      </View>

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
