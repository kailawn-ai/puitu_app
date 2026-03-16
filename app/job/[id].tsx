import JobDetailHeroUI from "@/components/job/job-detail-hero-ui";
import JobDetailUI from "@/components/job/job-detail-ui";
import { BackButton } from "@/components/ui/back-button";
import MediaErrorUI from "@/components/ui/media-error-ui";
import JobService, { type Job } from "@/lib/services/job-service";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import { BackHandler, Linking, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LOADER_ANIMATION = require("../../assets/icons/loader.json");

const JobDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState("Job Error");
  const [job, setJob] = useState<Job | null>(null);
  const [errorSheetVisible, setErrorSheetVisible] = useState(false);

  const fetchJob = useCallback(async () => {
    if (!id) {
      setError("Missing job id");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setErrorTitle("Job Error");
      setErrorSheetVisible(false);

      const res = await JobService.getById(id);
      setJob(res);
    } catch (err: any) {
      const title = err?.data?.head || "Job Error";
      const message = err?.data?.message ?? "Failed to load job";
      setErrorTitle(title);
      setError(message);
      setErrorSheetVisible(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

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

  const openExternal = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const handleApply = async (url: string) => {
    await openExternal(url);
  };

  const handleEmail = async (email: string) => {
    await openExternal(`mailto:${email}`);
  };

  const handlePhone = async (phone: string) => {
    await openExternal(`tel:${phone}`);
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
            Loading job...
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
          {job ? (
            <>
              <JobDetailHeroUI
                job={job}
                onPressApply={handleApply}
                onPressEmail={handleEmail}
                onPressPhone={handlePhone}
              />
              <JobDetailUI job={job} />
            </>
          ) : (
            <View className="mx-4 rounded-2xl p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <Text className="text-zinc-900 dark:text-zinc-100 text-lg font-semibold text-center">
                Unable to load job
              </Text>
              <Text className="mt-2 text-zinc-600 dark:text-zinc-300 text-center">
                {error ?? "Please retry or go back."}
              </Text>
            </View>
          )}
        </ScrollView>

        <MediaErrorUI
          visible={errorSheetVisible}
          title={errorTitle}
          message={error}
          onClose={() => setErrorSheetVisible(false)}
          onRetry={fetchJob}
        />
      </View>
    </LinearGradient>
  );
};

export default JobDetailScreen;
