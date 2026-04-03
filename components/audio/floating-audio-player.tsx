import { useAudioPlayerStore } from "@/store/audio-player-store";
import { useAudioPlayerStatus } from "expo-audio";
import { usePathname, useRouter } from "expo-router";
import { Pause, Play, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function FloatingAudioPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const { player, currentAudio, routeParams, isActive, closePlayer } =
    useAudioPlayerStore();
  const status = useAudioPlayerStatus(player);

  const isOnAudioScreen = pathname.startsWith("/audio/");

  if (!isActive || !currentAudio || !routeParams || isOnAudioScreen) {
    return null;
  }

  const handleExpand = () => {
    router.push({
      pathname: "/audio/[id]",
      params: {
        id: routeParams.id,
        courseId: routeParams.courseId,
        modelType: routeParams.modelType,
        modelId: routeParams.modelId,
      },
    });
  };

  const togglePlayback = () => {
    if (status.playing) {
      player.pause();
      return;
    }

    player.play();
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: insets.bottom + 52,
      }}
    >
      <View
        className={`overflow-hidden rounded-2xl border ${
          isDark
            ? "border-zinc-800 bg-zinc-950/45"
            : "border-zinc-200 bg-white/45"
        }`}
        style={{
          shadowColor: "#000000",
          shadowOpacity: isDark ? 0.3 : 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        <Pressable
          onPress={handleExpand}
          className="flex-row items-center px-1 py-1"
        >
          <View
            className="mr-3 overflow-hidden rounded-xl bg-zinc-900"
            style={{ width: 66, height: 66 }}
          >
            {currentAudio.thumbnail_url ? (
              <Image
                source={{ uri: currentAudio.thumbnail_url }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : null}
          </View>

          <View className="flex-1">
            <Text
              className={`text-sm font-semibold ${
                isDark ? "text-zinc-50" : "text-zinc-900"
              }`}
              numberOfLines={1}
            >
              {currentAudio.title}
            </Text>
            <Text
              className={`mt-1 text-xs ${
                isDark ? "text-zinc-400" : "text-zinc-500"
              }`}
              numberOfLines={1}
            >
              {currentAudio.language || "Course Audio"}
            </Text>
          </View>

          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              togglePlayback();
            }}
            hitSlop={8}
            className="px-3 py-3"
          >
            {status.playing ? (
              <Pause size={20} color={isDark ? "#FAFAFA" : "#18181B"} />
            ) : (
              <Play size={20} color={isDark ? "#FAFAFA" : "#18181B"} />
            )}
          </Pressable>

          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              closePlayer();
            }}
            hitSlop={8}
            className="pl-1 pr-2 py-3"
          >
            <X size={20} color={isDark ? "#A1A1AA" : "#71717A"} />
          </Pressable>
        </Pressable>
      </View>
    </View>
  );
}
