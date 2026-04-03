import AudioDetailUI from "@/components/audio/audio-detail-ui";
import { BackButton } from "@/components/ui/back-button";
import MediaErrorUI from "@/components/ui/media-error-ui";
import { ResolveProductParams } from "@/lib/services/product-service";
import { useAudioPlayerStore } from "@/store/audio-player-store";
import { extractDeniedProductId } from "@/lib/utils/product-access";
import { AudioService, type CourseAudio } from "@/lib/services/audio-service";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import { BackHandler, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LOADER_ANIMATION = require("../../assets/icons/loader.json");

const AudioDetailScreen = () => {
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
  const [errorTitle, setErrorTitle] = useState("Audio Error");
  const [audio, setAudio] = useState<CourseAudio | null>(null);
  const [errorSheetVisible, setErrorSheetVisible] = useState(false);
  const [showBuyAction, setShowBuyAction] = useState(false);
  const [lockedProductId, setLockedProductId] = useState<string | undefined>();
  const { setCurrentAudio, currentAudio, routeParams, closePlayer } =
    useAudioPlayerStore();

  const isCurrentAudioMatch =
    !!currentAudio &&
    String(currentAudio.id) === String(id) &&
    (routeParams?.courseId ?? undefined) ===
      (courseId ? String(courseId) : undefined) &&
    (routeParams?.modelType ?? undefined) ===
      (modelType ? String(modelType) : undefined) &&
    (routeParams?.modelId ?? undefined) ===
      (modelId ? String(modelId) : undefined);

  const fetchAudio = useCallback(async () => {
    if (!id || !courseId) {
      setError("Missing audio id or course id");
      setShowBuyAction(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setErrorTitle("Audio Error");
      setErrorSheetVisible(false);
      setShowBuyAction(false);
      setLockedProductId(undefined);
      setAudio(null);

      if (!isCurrentAudioMatch) {
        closePlayer();
      }

      const res = await AudioService.getById(
        courseId,
        id,
        modelType ?? "course",
        modelId ?? courseId,
      );
      setAudio(res as unknown as CourseAudio);
      setCurrentAudio(res as unknown as CourseAudio, {
        id: String(id),
        courseId: courseId ? String(courseId) : undefined,
        modelType: modelType ? String(modelType) : undefined,
        modelId: modelId ? String(modelId) : undefined,
      });
    } catch (err: any) {
      const errorCode = String(err?.data?.code ?? "");
      const deniedProductId = extractDeniedProductId(err?.data);
      const canBuy = errorCode === "666" || errorCode === "667";
      closePlayer();
      setAudio(null);

      const title = err?.data?.head;
      const message = err?.data?.message ?? "Failed to load audio";
      setErrorTitle(title);
      setError(message);
      setShowBuyAction(canBuy);
      setLockedProductId(deniedProductId);
      setErrorSheetVisible(true);
    } finally {
      setLoading(false);
    }
  }, [
    id,
    courseId,
    modelType,
    modelId,
    setCurrentAudio,
    closePlayer,
    isCurrentAudioMatch,
  ]);

  useEffect(() => {
    if (isCurrentAudioMatch && currentAudio) {
      setAudio(currentAudio);
      setLoading(false);
      setError(null);
      setErrorSheetVisible(false);
      return;
    }

    fetchAudio();
  }, [currentAudio, fetchAudio, isCurrentAudioMatch]);

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

  const handleBuy = () => {
    router.push({
      pathname: "/payment",
      params: {
        courseId: courseId ? String(courseId) : undefined,
        modelType: "course-audio" as ResolveProductParams["model_type"],
        modelId: String(id),
        productId: lockedProductId,
        title: "Audio Access",
        returnTo: `/audio/${id}?courseId=${courseId ?? ""}&modelType=${modelType ?? "course"}&modelId=${modelId ?? courseId ?? ""}`,
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
            Loading audio...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={
        colorScheme === "dark"
          ? ["#09090b", "#171717"] // Using your secondary-900 and secondary-800
          : ["#F8FAFC", "#E2E8F0"]
      } // Light mode gradient
      locations={[0, 1]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1">
        <View className="px-3 mb-2 absolute z-10 top-12">
          <BackButton onPress={() => router.back()} />
        </View>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {audio || currentAudio ? (
            <AudioDetailUI audio={audio ?? currentAudio!} />
          ) : (
            <View className="flex-1 items-center justify-center">
              <View className="rounded-2xl p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <Text className="text-zinc-900 dark:text-zinc-100 text-lg font-semibold text-center">
                  Unable to load audio
                </Text>
                <Text className="mt-2 text-zinc-600 dark:text-zinc-300 text-center">
                  Please retry or go back.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <MediaErrorUI
          visible={errorSheetVisible}
          title={errorTitle}
          message={error}
          onClose={() => setErrorSheetVisible(false)}
          onRetry={fetchAudio}
          onBuy={showBuyAction ? handleBuy : undefined}
          buyLabel="Buy this audio"
        />
      </View>
    </LinearGradient>
  );
};

export default AudioDetailScreen;
