import { useVideoPlayerStore } from "@/store/video-player-store";
import { VideoView } from "expo-video";
import { usePathname, useRouter } from "expo-router";
import { Pause, Play, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function FloatingVideoPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const { player, currentVideo, routeParams, isActive, closePlayer } =
    useVideoPlayerStore();
  const [isPlaying, setIsPlaying] = useState(player.playing);
  const shouldResumeAfterShortRef = useRef(false);
  const CARD_WIDTH = 260;
  const CARD_HEIGHT = 82;
  const EDGE_GAP = 12;
  const BASE_LEFT = Math.max(EDGE_GAP, width - CARD_WIDTH - EDGE_GAP);
  const BASE_TOP = Math.max(
    EDGE_GAP + insets.top,
    height - CARD_HEIGHT - insets.bottom - 64,
  );
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panOffset = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });

  const isOnVideoScreen = pathname.startsWith("/video/");
  const isOnShortScreen = pathname === "/short";

  const bounds = useMemo(
    () => ({
      minOffsetX: -BASE_LEFT + EDGE_GAP,
      maxOffsetX: width - CARD_WIDTH - BASE_LEFT - EDGE_GAP,
      minOffsetY: -(BASE_TOP - EDGE_GAP - insets.top),
      maxOffsetY: height - CARD_HEIGHT - BASE_TOP - insets.bottom - EDGE_GAP,
    }),
    [
      BASE_LEFT,
      BASE_TOP,
      CARD_HEIGHT,
      CARD_WIDTH,
      EDGE_GAP,
      height,
      insets.bottom,
      insets.top,
      width,
    ],
  );

  useEffect(() => {
    setIsPlaying(player.playing);

    const playingSubscription = player.addListener("playingChange", (event) => {
      setIsPlaying(event.isPlaying);
    });

    return () => {
      playingSubscription.remove();
    };
  }, [player]);

  useEffect(() => {
    if (!isActive) {
      shouldResumeAfterShortRef.current = false;
      return;
    }

    if (isOnShortScreen) {
      shouldResumeAfterShortRef.current = player.playing;
      if (player.playing) {
        player.pause();
      }
      return;
    }

    if (shouldResumeAfterShortRef.current) {
      player.play();
      shouldResumeAfterShortRef.current = false;
    }
  }, [isActive, isOnShortScreen, player]);

  useEffect(() => {
    const clamped = {
      x: Math.min(
        Math.max(panOffset.current.x, bounds.minOffsetX),
        bounds.maxOffsetX,
      ),
      y: Math.min(
        Math.max(panOffset.current.y, bounds.minOffsetY),
        bounds.maxOffsetY,
      ),
    };

    panOffset.current = clamped;
    pan.setValue(clamped);
  }, [bounds, pan]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          dragStart.current = { ...panOffset.current };
        },
        onPanResponderMove: (_, gestureState) => {
          const nextX = Math.min(
            Math.max(dragStart.current.x + gestureState.dx, bounds.minOffsetX),
            bounds.maxOffsetX,
          );
          const nextY = Math.min(
            Math.max(dragStart.current.y + gestureState.dy, bounds.minOffsetY),
            bounds.maxOffsetY,
          );

          pan.setValue({ x: nextX, y: nextY });
        },
        onPanResponderRelease: (_, gestureState) => {
          const nextX = Math.min(
            Math.max(dragStart.current.x + gestureState.dx, bounds.minOffsetX),
            bounds.maxOffsetX,
          );
          const nextY = Math.min(
            Math.max(dragStart.current.y + gestureState.dy, bounds.minOffsetY),
            bounds.maxOffsetY,
          );

          panOffset.current = { x: nextX, y: nextY };

          Animated.spring(pan, {
            toValue: panOffset.current,
            useNativeDriver: true,
            tension: 180,
            friction: 22,
          }).start();
        },
      }),
    [bounds, pan],
  );

  if (
    !isActive ||
    !currentVideo ||
    !routeParams ||
    isOnVideoScreen ||
    isOnShortScreen
  ) {
    return null;
  }

  const handleExpand = () => {
    router.push({
      pathname: "/video/[id]",
      params: {
        id: routeParams.id,
        courseId: routeParams.courseId,
        modelType: routeParams.modelType,
        modelId: routeParams.modelId,
      },
    });
  };

  const togglePlayback = () => {
    if (isPlaying) {
      player.pause();
      return;
    }

    player.play();
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      {...panResponder.panHandlers}
      style={{
        position: "absolute",
        left: BASE_LEFT,
        top: BASE_TOP,
        width: CARD_WIDTH,
        transform: [{ translateX: pan.x }, { translateY: pan.y }],
      }}
    >
      <View
        className={`overflow-hidden rounded-md border ${
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
        <Pressable onPress={handleExpand} className="flex-row items-center">
          <View
            className="overflow-hidden"
            style={{ width: 142, height: CARD_HEIGHT }}
          >
            <VideoView
              player={player}
              nativeControls={false}
              contentFit="cover"
              style={{ width: "100%", height: "100%" }}
            />
          </View>

          <View className="flex-1 px-3 py-2"></View>

          <Pressable onPress={togglePlayback} hitSlop={8} className="px-3 py-3">
            {isPlaying ? (
              <Pause size={20} color={isDark ? "#FAFAFA" : "#18181B"} />
            ) : (
              <Play size={20} color={isDark ? "#FAFAFA" : "#18181B"} />
            )}
          </Pressable>

          <Pressable onPress={closePlayer} hitSlop={8} className="pr-4 py-3">
            <X size={20} color={isDark ? "#A1A1AA" : "#71717A"} />
          </Pressable>
        </Pressable>
      </View>
    </Animated.View>
  );
}
