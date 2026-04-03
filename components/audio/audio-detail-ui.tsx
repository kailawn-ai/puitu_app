import { type CourseAudio } from "@/lib/services/audio-service";
import { useAudioPlayerStore } from "@/store/audio-player-store";
import {
  setAudioModeAsync,
  useAudioPlayerStatus,
} from "expo-audio";
import {
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  ShieldCheck,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface AudioDetailUIProps {
  audio: CourseAudio;
}

const formatClock = (seconds?: number | null) => {
  const safeSeconds = Math.max(0, Math.floor(seconds ?? 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function AudioDetailUI({ audio }: AudioDetailUIProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { player, lastLoadedUrl, setLastLoadedUrl } = useAudioPlayerStore();
  const status = useAudioPlayerStatus(player);
  const [trackWidth, setTrackWidth] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    });
  }, []);

  useEffect(() => {
    player.loop = false;
    player.volume = 1;
    player.setPlaybackRate(1);
    setPlaybackRate(1);
    setIsMuted(false);
    setHasAutoPlayed(lastLoadedUrl === audio.playback_url);
  }, [audio.id, audio.playback_url, lastLoadedUrl, player]);

  const duration = status.duration || audio.duration_seconds || 0;
  const currentTime = Math.min(
    status.currentTime || 0,
    duration || Number.MAX_SAFE_INTEGER,
  );
  const progress = duration > 0 ? clamp(currentTime / duration, 0, 1) : 0;
  const canPlay = !!audio.playback_url;
  const isLoaded = status.isLoaded;
  const isPlaying = status.playing;
  const isBuffering = status.isBuffering;
  const nowPlayingMetadata = useMemo(
    () => ({
      title: audio.title,
      artist: audio.language || "Course Audio",
      albumTitle: audio.description || "Puitu Audio",
      artworkUrl: audio.thumbnail_url || undefined,
    }),
    [audio.description, audio.language, audio.thumbnail_url, audio.title],
  );

  useEffect(() => {
    if (!audio.playback_url) return;
    if (lastLoadedUrl === audio.playback_url) return;

    player.replace({ uri: audio.playback_url });
    setLastLoadedUrl(audio.playback_url);
  }, [audio.playback_url, lastLoadedUrl, player, setLastLoadedUrl]);

  useEffect(() => {
    if (!isLoaded) return;

    player.updateLockScreenMetadata(nowPlayingMetadata);
  }, [isLoaded, nowPlayingMetadata, player]);

  useEffect(() => {
    if (!canPlay || !isLoaded || isPlaying || hasAutoPlayed) return;
    if (lastLoadedUrl === audio.playback_url && status.currentTime > 0) {
      setHasAutoPlayed(true);
      return;
    }

    player.setActiveForLockScreen(true, nowPlayingMetadata);
    player.play();
    setHasAutoPlayed(true);
  }, [
    audio.playback_url,
    canPlay,
    hasAutoPlayed,
    isLoaded,
    isPlaying,
    lastLoadedUrl,
    nowPlayingMetadata,
    player,
    status.currentTime,
  ]);

  const handleTogglePlayback = () => {
    if (!canPlay) return;

    if (isPlaying) {
      player.pause();
      player.setActiveForLockScreen(false);
      return;
    }

    if (status.didJustFinish && duration > 0) {
      void player.seekTo(0);
    }

    player.setActiveForLockScreen(true, nowPlayingMetadata);
    player.play();
  };

  const handleSeek = async (nextTime: number) => {
    if (!isLoaded || duration <= 0) return;
    await player.seekTo(clamp(nextTime, 0, duration));
  };

  const handleSeekBy = (delta: number) => {
    void handleSeek(currentTime + delta);
  };

  const handleProgressLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const handleProgressPress = (locationX: number) => {
    if (!trackWidth || duration <= 0) return;
    const nextProgress = clamp(locationX / trackWidth, 0, 1);
    void handleSeek(nextProgress * duration);
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const currentIndex = rates.findIndex((rate) => rate === playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    player.setPlaybackRate(nextRate);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    player.volume = nextMuted ? 0 : 1;
  };

  return (
    <View className="pb-5 pt-11 px-2">
      <View
        className={`overflow-hidden rounded-[32px] border pb-6  ${
          isDark
            ? "border-zinc-800 bg-zinc-950/50"
            : "border-zinc-200 bg-white/10"
        }`}
      >
        <View
          className={`rounded-[30px] ${isDark ? "bg-zinc-900" : "bg-zinc-100"}`}
          style={styles.coverArt}
        >
          {audio.thumbnail_url ? (
            <Image
              source={{ uri: audio.thumbnail_url }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          ) : null}
        </View>

        <View className="px-6">
          <View className="mt-5 items-center">
            {!!audio.is_free_preview && (
              <View
                className={`mb-4 flex-row items-center rounded-full px-3 py-1.5 ${
                  isDark ? "bg-zinc-800" : "bg-zinc-100"
                }`}
              >
                <ShieldCheck size={12} color="#F97316" />
                <Text
                  className={`ml-1.5 text-[11px] font-medium uppercase tracking-[0.8px] ${
                    isDark ? "text-zinc-300" : "text-zinc-500"
                  }`}
                >
                  Free Preview
                </Text>
              </View>
            )}

            <Text
              className={`text-2xl font-semibold ${
                isDark ? "text-zinc-50" : "text-zinc-900"
              }`}
            >
              {audio.title}
            </Text>
            <Text
              className={`mt-2 text-xs font-medium uppercase tracking-[1.4px] ${
                isDark ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              {audio.language || "Course Audio"}
            </Text>
          </View>

          <View className="mt-8">
            <View
              onLayout={handleProgressLayout}
              onStartShouldSetResponder={() => canPlay && duration > 0}
              onResponderRelease={(event) =>
                handleProgressPress(event.nativeEvent.locationX)
              }
              className="py-4"
            >
              <View
                className={`h-1.5 overflow-hidden rounded-full ${
                  isDark ? "bg-zinc-800" : "bg-zinc-200"
                }`}
              >
                <View
                  className={
                    isDark
                      ? "h-full rounded-full bg-white"
                      : "h-full rounded-full bg-zinc-900"
                  }
                  style={{ width: `${progress * 100}%` }}
                />
              </View>
              <View
                style={[
                  styles.thumb,
                  {
                    left: `${progress * 100}%`,
                    marginLeft: -9,
                    backgroundColor: isDark ? "#FFFFFF" : "#18181B",
                  },
                ]}
              />
            </View>

            <View className="mt-1 flex-row items-center justify-between">
              <Text
                className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
              >
                {formatClock(currentTime)}
              </Text>
              <Text
                className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
              >
                {formatClock(duration)}
              </Text>
            </View>
          </View>

          <View className="mt-14 flex-row items-center justify-between px-2">
            <Pressable onPress={toggleMute} style={styles.iconButton}>
              {isMuted ? (
                <VolumeX size={18} color={isDark ? "#A1A1AA" : "#71717A"} />
              ) : (
                <Volume2 size={18} color={isDark ? "#A1A1AA" : "#71717A"} />
              )}
            </Pressable>

            <Pressable
              onPress={() => handleSeekBy(-5)}
              style={styles.iconButton}
            >
              <RotateCcw size={20} color={isDark ? "#A1A1AA" : "#71717A"} />
            </Pressable>

            <Pressable
              disabled={!canPlay}
              onPress={handleTogglePlayback}
              style={[
                styles.playButton,
                {
                  backgroundColor: isDark ? "#3F3F46" : "#3F3F46",
                  opacity: canPlay ? 1 : 0.5,
                },
              ]}
            >
              {isPlaying ? (
                <Pause size={28} color="#FFFFFF" />
              ) : (
                <Play size={28} color="#FFFFFF" />
              )}
            </Pressable>

            <Pressable
              onPress={() => handleSeekBy(5)}
              style={styles.iconButton}
            >
              <RotateCw size={20} color={isDark ? "#A1A1AA" : "#71717A"} />
            </Pressable>

            <Pressable onPress={cyclePlaybackRate} style={styles.iconButton}>
              <Text
                className={`text-xs font-semibold ${
                  isDark ? "text-zinc-300" : "text-zinc-600"
                }`}
              >
                {playbackRate}x
              </Text>
            </Pressable>
          </View>

          <View className="mt-7 rounded-2xl px-4 py-2">
            <View className="flex-row flex-wrap justify-center items-center">
              <View
                className={`mr-2 mb-2 rounded-full px-3 py-2 elevation-sm ${
                  isDark ? "bg-zinc-800" : "bg-white"
                }`}
              >
                <Text
                  className={`text-xs ${
                    isDark ? "text-zinc-300" : "text-zinc-600"
                  }`}
                >
                  {status.didJustFinish
                    ? "Finished"
                    : isBuffering
                      ? "Buffering"
                      : isLoaded
                        ? "Ready"
                        : "Loading"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  coverArt: {
    height: 390,
    position: "relative",
  },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  thumb: {
    position: "absolute",
    top: 8,
    width: 18,
    height: 18,
    borderRadius: 999,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
