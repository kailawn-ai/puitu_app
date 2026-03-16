import QuizService, { Quiz } from "@/lib/services/quiz-service";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import QuizCard from "./quiz-card-ui";

interface Props {
  onPress?: (quiz: Quiz) => void;
  limit?: number;
}

export default function QuizSection({ onPress, limit = 8 }: Props) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await QuizService.getPublishedQuizzes({
        per_page: limit,
        sort_by: "created_at",
        sort_dir: "desc",
      });
      setQuizzes(data.data ?? []);
    } catch (error) {
      console.log("Quiz section load error:", error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  if (!loading && !quizzes.length) return null;

  return (
    <View className="mb-9">
      <Text className="font-semibold text-lg text-gray-900 dark:text-white mb-3 px-6">
        Quizzes
      </Text>

      {loading ? (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(item) => `quiz-skeleton-${item}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={() => (
            <View
              style={{ width: 240, height: 214 }}
              className="rounded-2xl bg-slate-200 dark:bg-secondary-700"
            />
          )}
        />
      ) : (
        <FlatList
          data={quizzes}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          decelerationRate="fast"
          snapToAlignment="start"
          renderItem={({ item }) => <QuizCard quiz={item} onPress={onPress} />}
        />
      )}
    </View>
  );
}
