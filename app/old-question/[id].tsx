import OldCardUI from "@/components/old-question/old-card-ui";
import { BackButton } from "@/components/ui/back-button";
import MediaErrorUI from "@/components/ui/media-error-ui";
import OldService, { type OldQuestion } from "@/lib/services/old-service";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import {
  BackHandler,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LOADER_ANIMATION = require("../../assets/icons/loader.json");

const OldQuestionDetailScreen = () => {
  const { id, courseId } = useLocalSearchParams<{
    id: string;
    courseId?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState("Old Question Error");
  const [errorSheetVisible, setErrorSheetVisible] = useState(false);
  const [showBuyAction, setShowBuyAction] = useState(false);
  const [question, setQuestion] = useState<OldQuestion | null>(null);

  const fetchQuestion = useCallback(async () => {
    if (!id) {
      setError("Missing old question id");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setErrorTitle("Old Question Error");
      setErrorSheetVisible(false);
      setShowBuyAction(false);
      const data = await OldService.getOldQuestionById(id, "old-question", id);
      setQuestion(data);
    } catch (err: any) {
      const title = err?.data?.head || "Old Question Error";
      const message =
        err?.data?.message ?? err?.message ?? "Failed to load old question";
      const errorCode = String(err?.data?.code ?? "");
      const requiresPurchase =
        err?.data?.requiresPurchase === true ||
        errorCode === "666" ||
        /purchase/i.test(message);

      setErrorTitle(title);
      setError(message);
      setErrorSheetVisible(true);
      setShowBuyAction(requiresPurchase);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.back();
        return true;
      },
    );

    return () => backHandler.remove();
  }, [router]);

  const handleOpenFile = async () => {
    const url = question?.detail?.file;
    if (!url) return;

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const handleRetry = () => {
    fetchQuestion();
  };

  const handleBuy = () => {
    router.push({
      pathname: "/payment",
      params: {
        modelType: "old-question",
        modelId: String(id),
        title: "Old Question Access",
        returnTo: `/old-question/${id}${courseId ? `?courseId=${courseId}` : ""}`,
      },
    });
  };

  if (loading) {
    return (
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#101014", "#171717"]
            : ["#F8FAFC", "#E2E8F0"]
        }
        locations={[0, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center">
          <LottieView
            source={LOADER_ANIMATION}
            autoPlay
            loop
            style={{ width: 80, height: 80 }}
          />
          <Text className="mt-2 text-zinc-500 dark:text-zinc-400">
            Loading old question...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={
        colorScheme === "dark" ? ["#101014", "#171717"] : ["#F8FAFC", "#E2E8F0"]
      }
      locations={[0, 1]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}
    >
      <BackButton
        onPress={() => router.back()}
        className="absolute top-12 left-4 z-10"
      />
      <View className="flex-1">
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 1,
            paddingBottom: 20,
          }}
        >
          {question ? (
            <OldCardUI question={question} onPressDownload={handleOpenFile} />
          ) : (
            <View className="mx-4 mt-12 rounded-2xl p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <Text className="text-zinc-900 dark:text-zinc-100 text-lg font-semibold text-center">
                Unable to load old question
              </Text>
              <Text className="mt-2 text-zinc-600 dark:text-zinc-300 text-center">
                {error ?? "Please retry or go back."}
              </Text>
              <Pressable
                onPress={handleRetry}
                className="mt-4 rounded-lg bg-zinc-200 dark:bg-zinc-800 px-4 py-2"
              >
                <Text className="text-zinc-900 dark:text-zinc-100 text-center font-medium">
                  Retry
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>

      <MediaErrorUI
        visible={errorSheetVisible}
        title={errorTitle}
        message={error}
        onClose={() => setErrorSheetVisible(false)}
        onRetry={handleRetry}
        onBuy={showBuyAction ? handleBuy : undefined}
        buyLabel="Buy this old question"
      />
    </LinearGradient>
  );
};

export default OldQuestionDetailScreen;
