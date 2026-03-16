import { Quiz } from "@/lib/services/home-service";
import React, { useMemo } from "react";
import { FlatList, View } from "react-native";
import QuizQandaUI from "./quiz-qanda-ui";

interface Props {
  quizzes: Quiz[];
}

export default function QuizQandaSection({ quizzes }: Props) {
  const qandaItems = useMemo(() => {
    return quizzes.flatMap((quiz) =>
      (quiz.questions ?? []).map((question) => ({
        key: `${quiz.id}-${question.id}`,
        quiz,
        question,
      })),
    );
  }, [quizzes]);

  if (!qandaItems.length) {
    return null;
  }

  return (
    <View className="mb-20 pb-5">
      <FlatList
        data={qandaItems}
        keyExtractor={(item) => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 2 }}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        renderItem={({ item }) => (
          <QuizQandaUI quiz={item.quiz} question={item.question} />
        )}
      />
    </View>
  );
}
