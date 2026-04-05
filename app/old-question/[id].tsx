import { BackButton } from "@/components/ui/back-button";
import MediaErrorUI from "@/components/ui/media-error-ui";
import { extractDeniedProductId } from "@/lib/utils/product-access";
import { OldService, type OldQuestion } from "@/lib/services/old-service";
import { LinearGradient } from "expo-linear-gradient";
import * as ScreenCapture from "expo-screen-capture";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import Pdf from "react-native-pdf";
import { ActivityIndicator, BackHandler, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LOADER_ANIMATION = require("../../assets/icons/loader.json");

const OldQuestionDetailScreen = () => {
  const { id, courseId, modelType, modelId } = useLocalSearchParams<{
    id: string;
    courseId?: string;
    modelType?: string;
    modelId?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState("Old Question Error");
  const [errorSheetVisible, setErrorSheetVisible] = useState(false);
  const [showBuyAction, setShowBuyAction] = useState(false);
  const [lockedProductId, setLockedProductId] = useState<string | undefined>();
  const [question, setQuestion] = useState<OldQuestion | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);

  const fetchQuestion = useCallback(async () => {
    if (!id) {
      setError("Missing old question id");
      setShowBuyAction(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setErrorTitle("Old Question Error");
      setErrorSheetVisible(false);
      setShowBuyAction(false);
      setLockedProductId(undefined);
      setQuestion(null);
      setPdfLoadError(null);

      const data = await OldService.getOldQuestionById(
        id,
        modelType ?? "old-question",
        modelId ?? id,
      );
      setQuestion(data);
    } catch (err: any) {
      const title = err?.data?.head || "Old Question Error";
      const message =
        err?.data?.message ?? err?.message ?? "Failed to load old question";
      const errorCode = String(err?.data?.code ?? "");
      const deniedProductId = extractDeniedProductId(err?.data);
      const requiresPurchase = errorCode === "666" || errorCode === "667";

      setErrorTitle(title);
      setError(message);
      setErrorSheetVisible(true);
      setShowBuyAction(requiresPurchase);
      setLockedProductId(deniedProductId);
    } finally {
      setLoading(false);
    }
  }, [id, modelType, modelId]);

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

  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync().catch(() => {});

    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);

  const handleBuy = () => {
    router.push({
      pathname: "/payment",
      params: {
        modelType: "old-question",
        modelId: String(id),
        productId: lockedProductId,
        title: "Old Question Access",
        returnTo: `/old-question/${id}?courseId=${courseId ?? ""}&modelType=${modelType ?? "old-question"}&modelId=${modelId ?? id}`,
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

  const pdfSource = question?.detail?.file
    ? {
        uri: question.detail.file,
        cache: true,
      }
    : null;

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
      <View className="flex-1">
        <View
          className="px-3 mb-2 absolute left-0 right-0 z-10"
          style={{ paddingTop: insets.top + 1 }}
        >
          <BackButton onPress={() => router.back()} />
        </View>

        {pdfSource && !pdfLoadError ? (
          <Pdf
            source={pdfSource}
            trustAllCerts={false}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1, width: "100%", height: "100%" }}
            renderActivityIndicator={() => (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Loading PDF...
                </Text>
              </View>
            )}
            onError={(pdfError) => {
              setPdfLoadError(
                pdfError?.message ?? "Unable to render this PDF.",
              );
            }}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <View className="rounded-3xl border border-zinc-200 bg-white/90 px-6 py-5 dark:border-zinc-800 dark:bg-zinc-900/90">
              <Text className="text-center text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Unable to load PDF
              </Text>
              <Text className="mt-2 text-center text-zinc-600 dark:text-zinc-300">
                {pdfLoadError ?? "No PDF file available for this old question."}
              </Text>
            </View>
          </View>
        )}

        <MediaErrorUI
          visible={errorSheetVisible}
          title={errorTitle}
          message={error}
          onClose={() => setErrorSheetVisible(false)}
          onRetry={fetchQuestion}
          onBuy={showBuyAction ? handleBuy : undefined}
          buyLabel="Buy this old question"
        />
      </View>
    </LinearGradient>
  );
};

export default OldQuestionDetailScreen;
