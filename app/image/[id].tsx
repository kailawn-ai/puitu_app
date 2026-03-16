import ImageDetailUI from "@/components/image/image-detail-ui";
import { BackButton } from "@/components/ui/back-button";
import MediaErrorUI from "@/components/ui/media-error-ui";
import { ResolveProductParams } from "@/lib/services/product-service";
import ImageService, { type CourseImage } from "@/lib/services/image-service";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import { BackHandler, Linking, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LOADER_ANIMATION = require("../../assets/icons/loader.json");

const ImageDetailScreen = () => {
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
  const [errorTitle, setErrorTitle] = useState("Image Error");
  const [image, setImage] = useState<CourseImage | null>(null);
  const [errorSheetVisible, setErrorSheetVisible] = useState(false);
  const [showBuyAction, setShowBuyAction] = useState(false);

  const fetchImage = useCallback(async () => {
    if (!id || !courseId) {
      setError("Missing image id or course id");
      setShowBuyAction(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setErrorTitle("Image Error");
      setErrorSheetVisible(false);
      setShowBuyAction(false);

      const res = await ImageService.getById(
        courseId,
        id,
        modelType ?? "course",
        modelId ?? courseId,
      );
      setImage(res as unknown as CourseImage);
    } catch (err: any) {
      const requiresPurchase = err?.data?.code === "666";
      const title = err?.data?.head;
      const message = err?.data?.message ?? "Failed to load image";
      setErrorTitle(title);
      setError(message);
      setShowBuyAction(requiresPurchase);
      setErrorSheetVisible(true);
    } finally {
      setLoading(false);
    }
  }, [id, courseId, modelType, modelId]);

  useEffect(() => {
    fetchImage();
  }, [fetchImage]);

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

  const handleOpenImage = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const handleBuy = () => {
    router.push({
      pathname: "/payment",
      params: {
        modelType: (modelType as ResolveProductParams["model_type"]) ?? "course-image",
        modelId: String(modelId ?? id),
        title: "Image Access",
        returnTo: `/image/${id}?courseId=${courseId ?? ""}&modelType=${modelType ?? "course"}&modelId=${modelId ?? courseId ?? ""}`,
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
            Loading image...
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
      <View className="flex-1">
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 4,
            paddingBottom: 20,
          }}
        >
          <View className="px-3 mb-2">
            <BackButton onPress={() => router.back()} />
          </View>

          {image ? (
            <ImageDetailUI image={image} onOpenImage={handleOpenImage} />
          ) : (
            <View className="mx-4 rounded-2xl p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <Text className="text-zinc-900 dark:text-zinc-100 text-lg font-semibold text-center">
                Unable to load image
              </Text>
              <Text className="mt-2 text-zinc-600 dark:text-zinc-300 text-center">
                Please retry or go back.
              </Text>
            </View>
          )}
        </ScrollView>

        <MediaErrorUI
          visible={errorSheetVisible}
          title={errorTitle}
          message={error}
          onClose={() => setErrorSheetVisible(false)}
          onRetry={fetchImage}
          onBuy={showBuyAction ? handleBuy : undefined}
          buyLabel="Buy this image"
        />
      </View>
    </LinearGradient>
  );
};

export default ImageDetailScreen;
