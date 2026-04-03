import { BackButton } from "@/components/ui/back-button";
import QuizService, {
  type Quiz,
  type QuizOption,
  type QuizQuestion,
  type StartQuizResponse,
  type SubmitQuizResponse,
} from "@/lib/services/quiz-service";
import { useAlert } from "@/providers/alert-provider";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Flame,
  Play,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type LocalAnswer = {
  optionId?: number;
  timeTaken: number;
};

const sortQuestions = (questions?: QuizQuestion[]) =>
  [...(questions ?? [])].sort(
    (a, b) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) -
      (b.order ?? Number.MAX_SAFE_INTEGER),
  );

const sortOptions = (options?: QuizOption[]) =>
  [...(options ?? [])].sort(
    (a, b) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) -
      (b.order ?? Number.MAX_SAFE_INTEGER),
  );

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function QuizPlayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const alert = useAlert();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<StartQuizResponse | null>(null);
  const [answers, setAnswers] = useState<Record<number, LocalAnswer>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [result, setResult] = useState<SubmitQuizResponse | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const questionEntryTimeRef = useRef<number>(Date.now());
  const autoSubmitTriggeredRef = useRef(false);

  const questions = useMemo(() => sortQuestions(quiz?.questions), [quiz?.questions]);
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const currentOptions = useMemo(
    () => sortOptions(currentQuestion?.options),
    [currentQuestion?.options],
  );
  const answeredCount = useMemo(
    () =>
      Object.values(answers).filter((item) => typeof item.optionId === "number")
        .length,
    [answers],
  );

  const fetchQuiz = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError("Missing quiz id.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await QuizService.getById(id);
      setQuiz(response);
    } catch (err: any) {
      setError(
        err?.data?.error ||
          err?.data?.message ||
          err?.message ||
          "Failed to load quiz.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const handleExitQuiz = useCallback(() => {
    if (attempt && !result) {
      alert.showWarning(
        "Leave quiz?",
        "Your current answers are only saved when you submit the quiz.",
        [
          { text: "Stay", style: "cancel", onPress: () => null },
          { text: "Leave", style: "destructive", onPress: () => router.back() },
        ],
      );
      return;
    }

    router.back();
  }, [alert, attempt, result, router]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleExitQuiz();
        return true;
      },
    );

    return () => backHandler.remove();
  }, [handleExitQuiz]);

  const captureCurrentQuestionTime = useCallback(() => {
    const question = questions[currentQuestionIndex];

    if (!question) {
      return;
    }

    const elapsedSeconds = Math.max(
      1,
      Math.round((Date.now() - questionEntryTimeRef.current) / 1000),
    );

    setAnswers((prev) => ({
      ...prev,
      [question.id]: {
        optionId: prev[question.id]?.optionId,
        timeTaken: (prev[question.id]?.timeTaken ?? 0) + elapsedSeconds,
      },
    }));
  }, [currentQuestionIndex, questions]);

  const buildAnswerSnapshot = useCallback(() => {
    const question = questions[currentQuestionIndex];

    if (!question) {
      return answers;
    }

    const elapsedSeconds = Math.max(
      1,
      Math.round((Date.now() - questionEntryTimeRef.current) / 1000),
    );

    const nextAnswers = {
      ...answers,
      [question.id]: {
        optionId: answers[question.id]?.optionId,
        timeTaken: (answers[question.id]?.timeTaken ?? 0) + elapsedSeconds,
      },
    };

    setAnswers(nextAnswers);
    return nextAnswers;
  }, [answers, currentQuestionIndex, questions]);

  const jumpToQuestion = (nextIndex: number) => {
    captureCurrentQuestionTime();
    questionEntryTimeRef.current = Date.now();
    setCurrentQuestionIndex(nextIndex);
  };

  const handleStartQuiz = async () => {
    if (!id) {
      return;
    }

    try {
      setStarting(true);
      const response = await QuizService.startQuiz(id);
      setAttempt(response);
      setCurrentQuestionIndex(0);
      setResult(null);
      setAnswers({});
      questionEntryTimeRef.current = Date.now();
      autoSubmitTriggeredRef.current = false;
    } catch (err: any) {
      alert.showError(
        "Unable to start quiz",
        err?.data?.error ||
          err?.data?.message ||
          err?.message ||
          "Failed to start quiz.",
      );
    } finally {
      setStarting(false);
    }
  };

  const handleSelectOption = (optionId: number) => {
    if (!currentQuestion) {
      return;
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        optionId,
        timeTaken: prev[currentQuestion.id]?.timeTaken ?? 0,
      },
    }));
  };

  const submitQuiz = useCallback(
    async (autoSubmitted = false) => {
      if (!id || !attempt) {
        return;
      }

      const answerSnapshot = buildAnswerSnapshot();

      const payloadAnswers = Object.entries(answerSnapshot).reduce<
        Record<string, { option_id: number; time_taken?: number }>
      >((acc, [questionId, answer]) => {
        if (typeof answer.optionId === "number") {
          acc[questionId] = {
            option_id: answer.optionId,
            time_taken: Math.max(1, answer.timeTaken || 1),
          };
        }

        return acc;
      }, {});

      const totalTimeTaken = attempt.started_at
        ? Math.max(
            1,
            Math.round((Date.now() - new Date(attempt.started_at).getTime()) / 1000),
          )
        : undefined;

      try {
        setSubmitting(true);
        const response = await QuizService.submitQuiz(id, attempt.attempt_id, {
          answers: payloadAnswers,
          total_time_taken: totalTimeTaken,
        });
        setResult(response);
        setAttempt(null);
        setRemainingSeconds(null);
      } catch (err: any) {
        const message =
          err?.data?.error ||
          err?.data?.message ||
          err?.message ||
          "Failed to submit quiz.";

        if (autoSubmitted) {
          alert.showError("Time is up", message);
        } else {
          alert.showError("Submit failed", message);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [alert, attempt, buildAnswerSnapshot, id],
  );

  useEffect(() => {
    if (!attempt?.started_at || !quiz?.duration || result) {
      setRemainingSeconds(null);
      return;
    }

    const updateTimer = () => {
      const endTime =
        new Date(attempt.started_at).getTime() + quiz.duration * 60 * 1000;
      const nextRemaining = Math.max(
        0,
        Math.round((endTime - Date.now()) / 1000),
      );

      setRemainingSeconds(nextRemaining);

      if (nextRemaining === 0 && !autoSubmitTriggeredRef.current) {
        autoSubmitTriggeredRef.current = true;
        void submitQuiz(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [attempt?.started_at, quiz?.duration, result, submitQuiz]);

  if (loading) {
    return (
      <LinearGradient
        colors={isDarkMode ? ["#09090B", "#171717"] : ["#F8FAFC", "#E2E8F0"]}
        locations={[0, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={isDarkMode ? "#FFFFFF" : "#7A25FF"} />
          <Text className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Loading quiz...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (error || !quiz) {
    return (
      <LinearGradient
        colors={isDarkMode ? ["#09090B", "#171717"] : ["#F8FAFC", "#E2E8F0"]}
        locations={[0, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center px-6">
          <View className="absolute left-4 z-10" style={{ top: insets.top + 8 }}>
            <BackButton />
          </View>
          <View className="rounded-[28px] border border-red-200 bg-white/95 px-5 py-6 dark:border-red-900/60 dark:bg-secondary-900/95">
            <Text className="text-lg font-semibold text-slate-900 dark:text-white">
              Unable to load quiz
            </Text>
            <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {error || "Quiz not found."}
            </Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (result) {
    return (
      <LinearGradient
        colors={isDarkMode ? ["#09090B", "#171717"] : ["#F8FAFC", "#E2E8F0"]}
        locations={[0, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ flex: 1 }}
      >
        <View className="absolute left-4 z-10" style={{ top: insets.top + 8 }}>
          <BackButton />
        </View>
        <View className="flex-1 justify-center px-5">
          <View className="rounded-[32px] border border-slate-200 bg-white p-6 dark:border-secondary-700 dark:bg-secondary-900">
            <View className="items-center">
              <View
                className={`h-16 w-16 items-center justify-center rounded-full ${
                  result.passed ? "bg-emerald-100" : "bg-amber-100"
                }`}
              >
                <CheckCircle2
                  size={28}
                  color={result.passed ? "#059669" : "#D97706"}
                />
              </View>
              <Text className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                {result.passed ? "Quiz completed" : "Submission sent"}
              </Text>
              <Text className="mt-2 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
                {quiz.title}
              </Text>
            </View>

            <View className="mt-6 rounded-[28px] bg-slate-50 p-4 dark:bg-secondary-800">
              <Text className="text-center text-4xl font-bold text-slate-900 dark:text-white">
                {result.percentage}%
              </Text>
              <Text className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                {result.score} / {result.total_questions} correct
              </Text>
            </View>

            <View className="mt-5 flex-row flex-wrap justify-between">
              <View className="mb-3 w-[48%] rounded-2xl bg-slate-50 p-4 dark:bg-secondary-800">
                <Text className="text-xs uppercase tracking-[1px] text-slate-400 dark:text-slate-500">
                  Points
                </Text>
                <Text className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {result.points_earned}
                </Text>
              </View>
              <View className="mb-3 w-[48%] rounded-2xl bg-slate-50 p-4 dark:bg-secondary-800">
                <Text className="text-xs uppercase tracking-[1px] text-slate-400 dark:text-slate-500">
                  Rating
                </Text>
                <Text className="mt-1 text-lg font-semibold capitalize text-slate-900 dark:text-white">
                  {result.performance_rating}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className="mt-4 rounded-full bg-primary px-6 py-4"
              onPress={() => router.replace("/quiz")}
            >
              <Text className="text-center text-base font-semibold text-white">
                Back To Quizzes
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  const isPlaying = !!attempt;

  return (
    <LinearGradient
      colors={isDarkMode ? ["#09090B", "#171717"] : ["#F8FAFC", "#E2E8F0"]}
      locations={[0, 1]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}
    >
      <View
        className="flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <BackButton onPress={handleExitQuiz} />
        <Text className="text-xl font-bold text-slate-900 dark:text-white">
          Quiz
        </Text>
        <View className="h-12 w-12" />
      </View>

      {!isPlaying ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: Math.max(insets.bottom + 24, 32),
          }}
        >
          <View className="rounded-[32px] border border-slate-200 bg-white p-5 dark:border-secondary-700 dark:bg-secondary-900">
            <Text className="text-3xl font-bold text-slate-900 dark:text-white">
              {quiz.title}
            </Text>
            {!!quiz.description && (
              <Text className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {quiz.description}
              </Text>
            )}

            <View className="mt-5 flex-row flex-wrap">
              <View className="mb-3 mr-3 rounded-full bg-primary/10 px-3 py-2">
                <Text className="text-xs font-semibold uppercase tracking-[1px] text-primary dark:text-primary-200">
                  {quiz.hardness}
                </Text>
              </View>
              {quiz.course?.title ? (
                <View className="mb-3 rounded-full bg-slate-100 px-3 py-2 dark:bg-secondary-800">
                  <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {quiz.course.title}
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="mt-2 flex-row flex-wrap justify-between">
              <View className="mb-3 w-[48%] rounded-2xl bg-slate-50 p-4 dark:bg-secondary-800">
                <CircleHelp size={18} color={isDarkMode ? "#CBD5E1" : "#475569"} />
                <Text className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {totalQuestions || quiz.questions_count || 0}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  Questions
                </Text>
              </View>
              <View className="mb-3 w-[48%] rounded-2xl bg-slate-50 p-4 dark:bg-secondary-800">
                <Clock3 size={18} color={isDarkMode ? "#CBD5E1" : "#475569"} />
                <Text className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {quiz.duration ? `${quiz.duration} min` : "Open"}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  Duration
                </Text>
              </View>
              <View className="mb-3 w-[48%] rounded-2xl bg-slate-50 p-4 dark:bg-secondary-800">
                <Flame size={18} color={isDarkMode ? "#CBD5E1" : "#475569"} />
                <Text className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {quiz.passing_score ?? "Any"}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  Passing Score
                </Text>
              </View>
              <View className="mb-3 w-[48%] rounded-2xl bg-slate-50 p-4 dark:bg-secondary-800">
                <Play size={18} color={isDarkMode ? "#CBD5E1" : "#475569"} />
                <Text className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {quiz.max_attempts && quiz.max_attempts > 0
                    ? quiz.max_attempts
                    : "Unlimited"}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  Max Attempts
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className={`mt-4 flex-row items-center justify-center rounded-full px-6 py-4 ${
                totalQuestions > 0 ? "bg-primary" : "bg-slate-300 dark:bg-secondary-700"
              }`}
              onPress={handleStartQuiz}
              disabled={starting || totalQuestions === 0}
            >
              {starting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Play size={18} color="#FFFFFF" />
                  <Text className="ml-2 text-base font-semibold text-white">
                    {totalQuestions > 0 ? "Start Quiz" : "No Questions Yet"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1 px-5">
          <View className="rounded-[28px] border border-slate-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </Text>
              {remainingSeconds !== null ? (
                <View className="rounded-full bg-amber-50 px-3 py-1.5 dark:bg-amber-500/10">
                  <Text className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    {formatDuration(remainingSeconds)}
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-secondary-800">
              <View
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${((currentQuestionIndex + 1) / Math.max(totalQuestions, 1)) * 100}%`,
                }}
              />
            </View>

            <Text className="mt-5 text-xl font-bold leading-8 text-slate-900 dark:text-white">
              {currentQuestion?.question_text}
            </Text>

            <View className="mt-5">
              {currentOptions.map((option, index) => {
                const isSelected = answers[currentQuestion?.id ?? 0]?.optionId === option.id;

                return (
                  <Pressable
                    key={option.id}
                    className={`mb-3 rounded-[24px] border px-4 py-4 ${
                      isSelected
                        ? "border-primary bg-primary/10 dark:bg-primary/15"
                        : "border-slate-200 bg-slate-50 dark:border-secondary-700 dark:bg-secondary-800"
                    }`}
                    onPress={() => handleSelectOption(option.id)}
                  >
                    <View className="flex-row items-center">
                      <View
                        className={`mr-3 h-9 w-9 items-center justify-center rounded-full ${
                          isSelected ? "bg-primary" : "bg-slate-200 dark:bg-secondary-700"
                        }`}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            isSelected
                              ? "text-white"
                              : "text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </Text>
                      </View>
                      <Text
                        className={`flex-1 text-sm leading-6 ${
                          isSelected
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {option.option_text}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mt-4 flex-row items-center justify-between rounded-[28px] border border-slate-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900">
            <View>
              <Text className="text-xs uppercase tracking-[1px] text-slate-400 dark:text-slate-500">
                Progress
              </Text>
              <Text className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {answeredCount} answered
              </Text>
            </View>

            <View className="flex-row items-center">
              <TouchableOpacity
                className="mr-2 h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-secondary-800"
                onPress={() => jumpToQuestion(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft
                  size={18}
                  color={
                    currentQuestionIndex === 0
                      ? isDarkMode
                        ? "#475569"
                        : "#CBD5E1"
                      : isDarkMode
                        ? "#E2E8F0"
                        : "#0F172A"
                  }
                />
              </TouchableOpacity>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <TouchableOpacity
                  className="flex-row items-center rounded-full bg-primary px-5 py-3"
                  onPress={() => jumpToQuestion(currentQuestionIndex + 1)}
                >
                  <Text className="text-sm font-semibold text-white">Next</Text>
                  <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="rounded-full bg-primary px-5 py-3"
                  onPress={() => {
                    alert.showWarning(
                      "Submit quiz?",
                      "You can submit now even if some questions are unanswered.",
                      [
                        { text: "Keep going", style: "cancel", onPress: () => null },
                        {
                          text: submitting ? "Submitting..." : "Submit",
                          onPress: () => {
                            void submitQuiz();
                          },
                        },
                      ],
                    );
                  }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-sm font-semibold text-white">
                      Submit Quiz
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}
