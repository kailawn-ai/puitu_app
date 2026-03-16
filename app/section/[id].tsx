import MediaListUI from "@/components/section/media-list-ui";
import SectionTabs, {
  type SectionMediaTabKey,
} from "@/components/section/tab-ui";
import { BackButton } from "@/components/ui/back-button";
import SectionService, { type Section } from "@/lib/services/section-service";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useState } from "react";
import { BackHandler, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LOADER_ANIMATION = require("../../assets/icons/loader.json");

const SectionScreen = () => {
  const { id, courseId } = useLocalSearchParams<{
    id: string;
    courseId?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [tab, setTab] = useState<SectionMediaTabKey>("videos");

  useEffect(() => {
    let mounted = true;

    const loadSection = async () => {
      if (!id) {
        setError("Missing section id");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Preferred path when caller provides courseId.
        if (courseId) {
          const res = await SectionService.getById(courseId, id);
          if (!mounted) return;
          setSection(res.data);
          return;
        }

        // Fallback path when only section id is passed.
        const all = await SectionService.getAll({ per_page: 100 });
        const basic = all.data.find((item) => String(item.id) === String(id));

        if (!basic) {
          throw new Error("Section not found. Pass courseId with section id.");
        }

        const res = await SectionService.getById(basic.course_id, id);
        if (!mounted) return;
        setSection(res.data);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message ?? "Failed to load section");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSection();
    return () => {
      mounted = false;
    };
  }, [id, courseId]);

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

  const mediaData = useMemo(() => {
    if (!section) return [];
    if (tab === "videos") return section.videos ?? [];
    if (tab === "documents") return section.documents ?? [];
    if (tab === "audios") return section.audios ?? [];
    return section.images ?? [];
  }, [section, tab]);

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
            style={{ width: 50, height: 50 }}
          />
          <Text className="mt-2 text-zinc-500 dark:text-zinc-400">
            Loading section...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (error || !section) {
    return (
      <View className="flex-1 bg-zinc-50 dark:bg-zinc-950 items-center justify-center px-6">
        <BackButton
          onPress={() => router.back()}
          className="absolute top-12 left-4 z-10"
        />
        <Text className="text-red-600 font-semibold">Error</Text>
        <Text className="text-zinc-600 dark:text-zinc-300 text-center mt-2">
          {error ?? "Section not found"}
        </Text>
      </View>
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
        <View className="pt-2 pb-3" style={{ paddingTop: insets.top + 4 }}>
          <View className="pl-3 flex-row items-center">
            <BackButton onPress={() => router.back()} />
          </View>

          <View className="mt-3 px-4">
            <Text
              className="text-zinc-900 dark:text-zinc-100 text-lg font-semibold"
              numberOfLines={1}
            >
              {section.title}
            </Text>
          </View>

          <View className="mt-4">
            <SectionTabs value={tab} onChange={setTab} />
          </View>
        </View>

        <View className="flex-1">
          <MediaListUI
            tab={tab}
            items={mediaData}
            onPressItem={(item) => {
              if (tab === "videos") {
                router.push({
                  pathname: "/video/[id]",
                  params: {
                    id: String(item.id),
                    courseId: String(section.course_id),
                    modelType: "course",
                    modelId: String(section.course_id),
                  },
                });
                return;
              }

              if (tab === "documents") {
                router.push({
                  pathname: "/document/[id]",
                  params: {
                    id: String(item.id),
                    courseId: String(section.course_id),
                    modelType: "course",
                    modelId: String(section.course_id),
                  },
                });
                return;
              }

              if (tab === "audios") {
                router.push({
                  pathname: "/audio/[id]",
                  params: {
                    id: String(item.id),
                    courseId: String(section.course_id),
                    modelType: "course",
                    modelId: String(section.course_id),
                  },
                });
                return;
              }

              if (tab === "images") {
                router.push({
                  pathname: "/image/[id]",
                  params: {
                    id: String(item.id),
                    courseId: String(section.course_id),
                    modelType: "course",
                    modelId: String(section.course_id),
                  },
                });
              }
            }}
          />
        </View>
      </View>
    </LinearGradient>
  );
};

export default SectionScreen;
