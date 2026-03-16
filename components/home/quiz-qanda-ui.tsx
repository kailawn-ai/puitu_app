import { Quiz, QuizOption, QuizQuestion } from "@/lib/services/home-service";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

interface Props {
  quiz: Quiz;
  question: QuizQuestion;
}

const optionLabel = (index: number) => String.fromCharCode(65 + index);

const sortOptions = (options?: QuizOption[]) => {
  return [...(options ?? [])].sort(
    (a, b) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) -
      (b.order ?? Number.MAX_SAFE_INTEGER),
  );
};

export default function QuizQandaUI({ quiz, question }: Props) {
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const options = useMemo(
    () => sortOptions(question.options),
    [question.options],
  );

  return (
    <View
      style={{ width: 360 }}
      className="rounded-2xl overflow-hidden elevation-sm"
    >
      <LinearGradient
        colors={
          isDark
            ? ["#1E293B", "#0F172A", "#111827"]
            : ["#F8FBFF", "#EEF4FF", "#EAF1FF"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-4"
      >
        <Text className="text-xs font-semibold text-primary-600 dark:text-primary-300 mb-1">
          {quiz.title}
        </Text>

        <Text
          className="text-sm font-semibold text-gray-900 dark:text-white mb-3"
          numberOfLines={3}
        >
          {question.question_text}
        </Text>

        <View>
          {options.map((option, index) => {
            const isSelected = selectedOptionId === option.id;

            return (
              <Pressable
                key={option.id}
                className={`flex-row items-center px-3 py-2 rounded-xl mb-2 border ${
                  isSelected
                    ? "bg-primary-50 border-primary-400 dark:bg-blue-800/30 dark:border-primary-300"
                    : "bg-gray-50 border-gray-200 dark:bg-secondary-800 dark:border-secondary-600"
                }`}
                onPress={() => setSelectedOptionId(option.id)}
              >
                <View
                  className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${
                    isSelected
                      ? "bg-primary"
                      : "bg-gray-300 dark:bg-secondary-600"
                  }`}
                >
                  <Text className="text-white text-xs font-bold">
                    {optionLabel(index)}
                  </Text>
                </View>
                <Text
                  className={`text-xs flex-1 ${
                    isSelected
                      ? "text-blue-700 dark:text-blue-200"
                      : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {option.option_text}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}
