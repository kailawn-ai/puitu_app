import { BackButton } from "@/components/ui/back-button";
import { R2FileUploaderField } from "@/components/ui/r2-file-uploader-field";
import { useR2Upload } from "@/hook/use-r2-upload";
import { useEvent } from "expo";
import {
  ShortService,
  type CreateShortPayload,
} from "@/lib/services/short-service";
import { useAlert } from "@/providers/alert-provider";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  EyeOff,
  Globe2,
  Lock,
  MessageSquare,
  Pause,
  Play,
  Save,
  Sparkles,
  UploadCloud,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useColorScheme } from "nativewind";
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SelectedVideo = {
  uri: string;
  fileName: string;
  mimeType: string;
  durationSeconds: number;
  fileSize?: number;
  width?: number;
  height?: number;
};

type VisibilityOption = "public" | "private" | "unlisted";
type PublishMode = "draft";

const VISIBILITY_OPTIONS: {
  value: VisibilityOption;
  label: string;
  description: string;
  icon: typeof Globe2;
}[] = [
  {
    value: "public",
    label: "Public",
    description: "Everyone can discover and watch it.",
    icon: Globe2,
  },
  {
    value: "unlisted",
    label: "Unlisted",
    description: "Only people with the link can view it.",
    icon: EyeOff,
  },
  {
    value: "private",
    label: "Private",
    description: "Only you can access it right now.",
    icon: Lock,
  },
];

const formatDuration = (value: number) => {
  const totalSeconds = Math.max(0, Math.floor(value));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const TRIM_TIMELINE_WIDTH = 320;
const HANDLE_WIDTH = 24;
const PLAYHEAD_WIDTH = 4;
const TRIM_WINDOW_VERTICAL_INSET = 4;
const TRIM_WINDOW_RADIUS = 14;
const TRIM_STEP_SECONDS = 1;
const STEP_ONE_PREVIEW_RATIO = 9 / 13;

export default function CreateShortScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const alert = useAlert();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { upload, isUploading, progress } = useR2Upload();
  const [step, setStep] = useState<1 | 2>(1);
  const [video, setVideo] = useState<SelectedVideo | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [trimBarWidth, setTrimBarWidth] = useState(TRIM_TIMELINE_WIDTH);
  const [playheadTime, setPlayheadTime] = useState(0);
  const [visibility, setVisibility] = useState<VisibilityOption>("public");
  const [allowComments, setAllowComments] = useState(true);
  const [keepActive, setKeepActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<PublishMode>("draft");

  const player = useVideoPlayer(
    video?.uri ? { uri: video.uri } : null,
    (instance) => {
      instance.loop = true;
    },
  );
  const handleStartRef = useRef(trimStart);
  const handleEndRef = useRef(trimEnd);
  const dragStartSnapshotRef = useRef(0);

  const trimDuration = useMemo(
    () => Math.max(0, Math.round(trimEnd - trimStart)),
    [trimEnd, trimStart],
  );

  const isBusy = isSubmitting || isUploading;
  const canProceedToDetails = !!video;
  const isSubmitDisabled =
    isBusy ||
    !video ||
    !title.trim() ||
    trimDuration <= 0 ||
    trimDuration > 180;
  const gradientColors = isDarkMode
    ? ["#050816", "#10172b", "#1f2937"]
    : ["#f8fafc", "#e2e8f0", "#cbd5e1"];
  const screenClassName = isDarkMode ? "bg-black" : "bg-slate-50";
  const primaryTextClassName = isDarkMode ? "text-white" : "text-slate-900";
  const secondaryTextClassName = isDarkMode
    ? "text-white/60"
    : "text-slate-600";
  const cardClassName = isDarkMode ? "" : "bg-white/92";
  const summaryCardClassName = isDarkMode
    ? "border border-white/10 bg-[#09111f]"
    : "border border-slate-200 bg-sky-50";
  const inputClassName = isDarkMode
    ? "border border-white/10 bg-black/25 text-white"
    : "border border-slate-200 bg-white text-slate-900";
  const optionBaseClassName = isDarkMode
    ? "border-white/10 bg-black/20"
    : "border-slate-200 bg-white";
  const optionSelectedClassName = isDarkMode
    ? "border-cyan-300/40 bg-cyan-400/10"
    : "border-cyan-300 bg-cyan-50";
  const subtlePanelClassName = isDarkMode
    ? "border border-white/10 bg-black/20"
    : "border border-slate-200 bg-white";
  const dashBoxClassName = isDarkMode
    ? "border border-dashed border-cyan-300/35 bg-[#07111f]"
    : "border border-dashed border-cyan-400/45 bg-cyan-50";
  const previewWrapClassName = isDarkMode ? "bg-black" : "bg-slate-200";
  const busySurfaceClassName = isDarkMode ? "bg-white/8" : "bg-slate-900/6";
  const barTrackClassName = isDarkMode ? "bg-white/10" : "bg-slate-200";
  const disabledButtonClassName = isDarkMode ? "bg-white/10" : "bg-slate-200";
  const placeholderColor = isDarkMode
    ? "rgba(255,255,255,0.35)"
    : "rgba(15,23,42,0.35)";
  const headerAccentColor = isDarkMode ? "#bae6fd" : "#0f766e";
  const accentColor = "#67E8F9";
  const accentStrongTextColor = isDarkMode ? "#020617" : "#083344";
  const iconDefaultColor = isDarkMode ? "#FFFFFF" : "#0f172a";
  const trimTrackBgClassName = isDarkMode ? "bg-white/8" : "bg-slate-300";
  const timelineTickClassName = isDarkMode ? "bg-white/30" : "bg-slate-500/40";
  const playheadColor = "#FFFFFF";

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  const durationForTimeline = Math.max(video?.durationSeconds ?? 1, 1);
  const pxPerSecond = trimBarWidth / durationForTimeline;
  const trimLeft = trimStart * pxPerSecond;
  const trimRight = trimEnd * pxPerSecond;
  const playheadLeft = clamp(
    playheadTime * pxPerSecond - PLAYHEAD_WIDTH / 2,
    0,
    Math.max(0, trimBarWidth - PLAYHEAD_WIDTH),
  );

  useEffect(() => {
    handleStartRef.current = trimStart;
    handleEndRef.current = trimEnd;
  }, [trimEnd, trimStart]);

  useEffect(() => {
    if (!video) {
      setPlayheadTime(0);
      return;
    }

    setPlayheadTime(trimStart);
    player.currentTime = trimStart;
  }, [player, trimStart, video]);

  useEffect(() => {
    if (!video || !isPlaying) return;

    const interval = setInterval(() => {
      const currentTime = player.currentTime ?? 0;

      if (currentTime >= handleEndRef.current) {
        player.pause();
        player.currentTime = handleStartRef.current;
        setPlayheadTime(handleStartRef.current);
        return;
      }

      setPlayheadTime(currentTime);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, player, video]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (step === 2) {
          setStep(1);
          return true;
        }

        router.back();
        return true;
      },
    );

    return () => backHandler.remove();
  }, [router, step]);

  const syncTrimRange = (startValue: number, endValue: number) => {
    if (!video) return;

    const maxDuration = Math.max(1, Math.floor(video.durationSeconds));
    const nextStart = clamp(Math.floor(startValue), 0, maxDuration - 1);
    const nextEnd = clamp(Math.floor(endValue), nextStart + 1, maxDuration);

    setTrimStart(nextStart);
    setTrimEnd(nextEnd);
    setPlayheadTime((current) => clamp(current, nextStart, nextEnd));

    if (player.currentTime < nextStart || player.currentTime > nextEnd) {
      player.currentTime = nextStart;
    }
  };

  const seekWithinTrim = (nextTime: number) => {
    const boundedTime = clamp(nextTime, trimStart, trimEnd);
    player.currentTime = boundedTime;
    setPlayheadTime(boundedTime);
  };

  const togglePlayback = () => {
    if (!video) return;

    if (isPlaying) {
      player.pause();
      return;
    }

    if (player.currentTime < trimStart || player.currentTime >= trimEnd) {
      player.currentTime = trimStart;
      setPlayheadTime(trimStart);
    }

    player.play();
  };

  const startHandlePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !!video,
        onMoveShouldSetPanResponder: () => !!video,
        onPanResponderGrant: () => {
          dragStartSnapshotRef.current = handleStartRef.current;
          player.pause();
        },
        onPanResponderMove: (_, gestureState) => {
          if (!video) return;
          const deltaSeconds = gestureState.dx / pxPerSecond;
          syncTrimRange(
            dragStartSnapshotRef.current + deltaSeconds,
            handleEndRef.current,
          );
        },
      }),
    [player, pxPerSecond, video],
  );

  const endHandlePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !!video,
        onMoveShouldSetPanResponder: () => !!video,
        onPanResponderGrant: () => {
          dragStartSnapshotRef.current = handleEndRef.current;
          player.pause();
        },
        onPanResponderMove: (_, gestureState) => {
          if (!video) return;
          const deltaSeconds = gestureState.dx / pxPerSecond;
          syncTrimRange(
            handleStartRef.current,
            dragStartSnapshotRef.current + deltaSeconds,
          );
        },
      }),
    [player, pxPerSecond, video],
  );

  const playheadPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !!video,
        onMoveShouldSetPanResponder: () => !!video,
        onPanResponderGrant: () => {
          dragStartSnapshotRef.current = playheadTime;
          player.pause();
        },
        onPanResponderMove: (_, gestureState) => {
          if (!video) return;
          const deltaSeconds = gestureState.dx / pxPerSecond;
          seekWithinTrim(dragStartSnapshotRef.current + deltaSeconds);
        },
      }),
    [playheadTime, player, pxPerSecond, video],
  );

  const handleSelectVideo = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        alert.showWarning(
          "Permission needed",
          "Please allow video library access so you can pick a short to upload.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        quality: 1,
        allowsEditing: false,
        videoMaxDuration: 180,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const durationSeconds = Math.max(
        1,
        Math.round((asset.duration ?? 1000) / 1000),
      );

      const nextVideo = {
        uri: asset.uri,
        fileName: asset.fileName || `short-${Date.now()}.mp4`,
        mimeType: asset.mimeType || "video/mp4",
        durationSeconds,
        fileSize: asset.fileSize,
        width: asset.width,
        height: asset.height,
      };

      setVideo(nextVideo);
      setTrimStart(0);
      setTrimEnd(Math.min(180, durationSeconds));
      setPlayheadTime(0);

      if (!title.trim()) {
        const baseName = nextVideo.fileName.replace(/\.[^.]+$/, "");
        setTitle(baseName.replace(/[-_]+/g, " ").trim());
      }
    } catch (error) {
      alert.showError(
        "Picker error",
        error instanceof Error
          ? error.message
          : "We couldn't open the video picker.",
      );
    }
  };

  const handleSubmit = async (mode: PublishMode) => {
    if (!video) {
      alert.showWarning("Missing video", "Choose a video first.");
      return;
    }

    if (!title.trim()) {
      alert.showWarning("Missing title", "Add a title before uploading.");
      return;
    }

    if (trimDuration <= 0 || trimDuration > 180) {
      alert.showWarning(
        "Trim not ready",
        "Set a trim range between 1 and 180 seconds.",
      );
      return;
    }

    setSubmitMode(mode);
    setIsSubmitting(true);

    try {
      const uploadedVideo = await upload(
        {
          uri: video.uri,
          name: video.fileName,
          type: video.mimeType,
        },
        {
          folder: "shorts/videos",
          forceMultipart: true,
        },
      );

      const payload: CreateShortPayload = {
        title: title.trim(),
        slug: slugify(title) || undefined,
        description: description.trim() || undefined,
        thumbnail_url: thumbnailUrl.trim() || undefined,
        video_url: uploadedVideo.publicUrl,
        duration_seconds: trimDuration,
        size_bytes: video.fileSize,
        width: video.width,
        height: video.height,
        mime_type: video.mimeType,
        visibility,
        allow_comments: allowComments,
        is_active: keepActive,
        status: mode,
      };

      await ShortService.create(payload);

      if (Platform.OS === "android") {
        ToastAndroid.show(
          mode === "draft"
            ? "Short saved to draft"
            : "Short uploaded successfully",
          ToastAndroid.SHORT,
        );
      }

      alert.showSuccess(
        mode === "draft" ? "Draft saved" : "Short uploaded",
        mode === "draft"
          ? "Your short is saved as a draft and ready for final edits."
          : "Your short is live and ready to be watched.",
      );
      router.replace("/short");
    } catch (error) {
      alert.showError(
        mode === "draft" ? "Draft save failed" : "Upload failed",
        error instanceof Error
          ? error.message
          : "We couldn't finish creating your short.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className={`flex-1 ${screenClassName}`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <View
            className="flex-row items-center justify-between px-5"
            style={{ paddingTop: insets.top + 2 }}
          >
            <BackButton
              onPress={() => {
                if (step === 2) {
                  setStep(1);
                  return;
                }

                router.back();
              }}
              color={isDarkMode ? "#FFFFFF" : "#0f172a"}
            />

            <View className="items-center">
              <Text
                className="text-xs font-semibold uppercase tracking-[2px]"
                style={{ color: headerAccentColor }}
              >
                Creator Studio
              </Text>
            </View>

            <View className="w-16 items-end">
              <Text
                className={`rounded-full px-3 py-2 text-xs font-semibold ${
                  isDarkMode
                    ? "bg-white/10 text-white/70"
                    : "bg-slate-900/8 text-slate-700"
                }`}
              >
                {step}/2
              </Text>
            </View>
          </View>

          <View className="px-5 pt-3">
            <View className="flex-row items-center gap-x-3">
              {[1, 2].map((stepValue) => {
                const isActive = stepValue === step;
                const isDone = stepValue < step;

                return (
                  <View key={stepValue} className="flex-1">
                    <View
                      className={`h-2 rounded-full ${
                        isActive || isDone
                          ? "bg-cyan-400"
                          : isDarkMode
                            ? "bg-white/10"
                            : "bg-slate-300"
                      }`}
                    />
                    <Text
                      className={`mt-2 text-xs font-semibold ${
                        isActive || isDone
                          ? isDarkMode
                            ? "text-white"
                            : "text-slate-900"
                          : isDarkMode
                            ? "text-white/45"
                            : "text-slate-500"
                      }`}
                    >
                      {stepValue === 1 ? "Trim & preview" : "Details & upload"}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: insets.bottom + 28,
              flexGrow: step === 1 ? 1 : undefined,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 1 ? (
              <View
                className="flex-1 justify-between"
                style={{ paddingTop: 8 }}
              >
                {!video ? (
                  <Pressable
                    onPress={handleSelectVideo}
                    className="flex-1 items-center justify-center"
                  >
                    <View
                      className={`w-full items-center rounded-[28px] px-5 py-12 ${dashBoxClassName}`}
                    >
                      <View className="h-16 w-16 items-center justify-center rounded-full bg-cyan-400/15">
                        <UploadCloud size={28} color="#67E8F9" />
                      </View>
                      <Text
                        className={`mt-4 text-base font-semibold ${primaryTextClassName}`}
                      >
                        Choose video
                      </Text>
                      <Text
                        className={`mt-2 text-center text-sm leading-6 ${secondaryTextClassName}`}
                      >
                        MP4 or MOV works best. We recommend up to 180 seconds.
                      </Text>
                    </View>
                  </Pressable>
                ) : (
                  <View className="flex-1 justify-between">
                    <View className="items-center">
                      <View
                        className={`w-full overflow-hidden ${previewWrapClassName}`}
                        style={{
                          aspectRatio: STEP_ONE_PREVIEW_RATIO,
                          borderRadius: 6,
                          maxHeight: 510,
                        }}
                      >
                        <VideoView
                          player={player}
                          style={{ width: "100%", height: "100%" }}
                          nativeControls={false}
                          contentFit="contain"
                          allowsFullscreen={false}
                          allowsPictureInPicture={false}
                        />

                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={togglePlayback}
                          className="absolute inset-0 items-center justify-center"
                        >
                          <View className="h-20 w-20 items-center justify-center rounded-full bg-black/35">
                            {isPlaying ? (
                              <Pause size={30} color="#FFFFFF" fill="#FFFFFF" />
                            ) : (
                              <Play size={30} color="#FFFFFF" fill="#FFFFFF" />
                            )}
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View className="mt-3">
                      <View
                        className="mt-4 self-center"
                        onLayout={(event) => {
                          const width = event.nativeEvent.layout.width;
                          if (width > 0) {
                            setTrimBarWidth(width);
                          }
                        }}
                        style={{ width: "100%" }}
                      >
                        <View className="relative h-[58px] justify-end">
                          <View
                            className={`h-[64px] overflow-hidden rounded-[12px] ${trimTrackBgClassName}`}
                          >
                            <View className="absolute inset-0 flex-row items-center px-1.5">
                              {Array.from({ length: 10 }).map((_, index) => (
                                <View
                                  key={index}
                                  className={`mx-[2px] flex-1 rounded-sm ${timelineTickClassName}`}
                                  style={{
                                    height: 56,
                                    opacity: index % 2 === 0 ? 0.9 : 0.6,
                                  }}
                                />
                              ))}
                            </View>

                            <View
                              className="absolute bg-white"
                              style={{
                                top: TRIM_WINDOW_VERTICAL_INSET,
                                bottom: TRIM_WINDOW_VERTICAL_INSET,
                                left: trimLeft,
                                width: Math.max(
                                  trimRight - trimLeft,
                                  HANDLE_WIDTH,
                                ),
                                borderRadius: TRIM_WINDOW_RADIUS,
                              }}
                            >
                              <View className="absolute inset-0 flex-row items-center overflow-hidden rounded-[14px] px-1.5">
                                {Array.from({ length: 10 }).map((_, index) => (
                                  <View
                                    key={`selected-${index}`}
                                    className="mx-[2px] flex-1 rounded-sm bg-black/20"
                                    style={{
                                      height: 72,
                                      opacity: index % 2 === 0 ? 0.38 : 0.2,
                                    }}
                                  />
                                ))}
                              </View>

                              <View
                                className="absolute left-0 top-0 bottom-0 items-center justify-center"
                                style={{ width: HANDLE_WIDTH }}
                                {...startHandlePanResponder.panHandlers}
                              >
                                <View className="h-8 w-[3px] rounded-full bg-neutral-900" />
                              </View>

                              <View
                                className="absolute right-0 top-0 bottom-0 items-center justify-center"
                                style={{ width: HANDLE_WIDTH }}
                                {...endHandlePanResponder.panHandlers}
                              >
                                <View className="h-8 w-[3px] rounded-full bg-neutral-900" />
                              </View>
                            </View>

                            <View
                              className="absolute top-0 bottom-0"
                              style={{
                                left: playheadLeft,
                                width: PLAYHEAD_WIDTH,
                              }}
                              {...playheadPanResponder.panHandlers}
                            >
                              <View
                                style={{
                                  width: PLAYHEAD_WIDTH,
                                  height: "100%",
                                  backgroundColor: playheadColor,
                                  borderRadius: 999,
                                }}
                              />
                            </View>

                            <View
                              className="absolute items-center"
                              style={{
                                left: clamp(
                                  playheadTime * pxPerSecond - 34,
                                  0,
                                  Math.max(0, trimBarWidth - 68),
                                ),
                                top: 28,
                                width: 68,
                              }}
                            >
                              <View className="rounded-2xl bg-white px-3 py-2">
                                <Text className="text-base font-bold text-slate-900">
                                  {formatDuration(trimDuration)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>

                      <View className="mt-5 flex-row items-center justify-between">
                        <Text className={`text-base ${secondaryTextClassName}`}>
                          Drag to adjust video
                        </Text>

                        <TouchableOpacity
                          activeOpacity={0.9}
                          disabled={!canProceedToDetails}
                          onPress={() => setStep(2)}
                          className={`flex-row items-center justify-center rounded-full px-7 py-4 ${
                            canProceedToDetails ? "bg-white" : "bg-white/20"
                          }`}
                        >
                          <Text
                            className={`text-base font-bold ${
                              canProceedToDetails
                                ? "text-slate-950"
                                : "text-white/45"
                            }`}
                          >
                            Next
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View>
                <View className={`p-2 ${cardClassName}`}>
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text
                        className={`text-lg font-bold ${primaryTextClassName}`}
                      >
                        Video details
                      </Text>
                      <Text
                        className={`mt-1 text-sm leading-6 ${secondaryTextClassName}`}
                      >
                        Add video detail before public
                      </Text>
                    </View>

                    <View className="h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15">
                      <Sparkles size={20} color="#6EE7B7" />
                    </View>
                  </View>

                  <View className="mt-5">
                    <Text
                      className={`mb-2 text-sm font-semibold ${primaryTextClassName}`}
                    >
                      Title
                    </Text>
                    <TextInput
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Give your short a strong hook"
                      placeholderTextColor={placeholderColor}
                      className={`rounded-[22px] px-4 py-4 ${inputClassName}`}
                      maxLength={180}
                    />
                  </View>

                  <View className="mt-4">
                    <Text
                      className={`mb-2 text-sm font-semibold ${primaryTextClassName}`}
                    >
                      Description
                    </Text>
                    <TextInput
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Tell people what makes this clip worth watching"
                      placeholderTextColor={placeholderColor}
                      className={`min-h-[120px] rounded-[22px] px-4 py-4 ${inputClassName}`}
                      multiline
                      textAlignVertical="top"
                      maxLength={1000}
                    />
                  </View>

                  <View className="mt-4">
                    <Text
                      className={`text-sm font-semibold ${primaryTextClassName}`}
                    >
                      Thumbnail
                    </Text>
                    <R2FileUploaderField
                      label=""
                      value={thumbnailUrl}
                      onChange={setThumbnailUrl}
                      isDark
                      folder="shorts/thumbnails"
                      buttonLabel="Choose thumbnail"
                      helperText="Optional, but a strong cover makes drafts easier to recognize later."
                    />
                  </View>
                </View>

                <View className={`mt-5 rounded-[28px] p-5 ${cardClassName}`}>
                  <Text className={`text-lg font-bold ${primaryTextClassName}`}>
                    Visibility
                  </Text>
                  <Text
                    className={`mt-1 text-sm leading-6 ${secondaryTextClassName}`}
                  >
                    Pick how this short should be shared once it is saved.
                  </Text>

                  <View className="mt-5 gap-y-3">
                    {VISIBILITY_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const selected = visibility === option.value;

                      return (
                        <TouchableOpacity
                          key={option.value}
                          activeOpacity={0.9}
                          onPress={() => setVisibility(option.value)}
                          className={`rounded-[22px] border px-4 py-4 ${
                            selected
                              ? optionSelectedClassName
                              : optionBaseClassName
                          }`}
                        >
                          <View className="flex-row items-center">
                            <View
                              className={`h-11 w-11 items-center justify-center rounded-2xl ${
                                isDarkMode ? "bg-white/10" : "bg-slate-100"
                              }`}
                            >
                              <Icon
                                size={18}
                                color={
                                  selected ? accentColor : iconDefaultColor
                                }
                              />
                            </View>
                            <View className="ml-3 flex-1">
                              <Text
                                className={`text-base font-semibold ${primaryTextClassName}`}
                              >
                                {option.label}
                              </Text>
                              <Text
                                className={`mt-1 text-sm ${secondaryTextClassName}`}
                              >
                                {option.description}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View className="mt-5 gap-y-3">
                    <View
                      className={`rounded-[22px] px-4 py-4 ${subtlePanelClassName}`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <MessageSquare size={18} color={iconDefaultColor} />
                          <View className="ml-3">
                            <Text
                              className={`text-sm font-semibold ${primaryTextClassName}`}
                            >
                              Allow comments
                            </Text>
                            <Text
                              className={`text-xs ${secondaryTextClassName}`}
                            >
                              Let viewers reply and interact.
                            </Text>
                          </View>
                        </View>
                        <Switch
                          value={allowComments}
                          onValueChange={setAllowComments}
                        />
                      </View>
                    </View>

                    <View
                      className={`rounded-[22px] px-4 py-4 ${subtlePanelClassName}`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Sparkles size={18} color={iconDefaultColor} />
                          <View className="ml-3">
                            <Text
                              className={`text-sm font-semibold ${primaryTextClassName}`}
                            >
                              Keep active
                            </Text>
                            <Text
                              className={`text-xs ${secondaryTextClassName}`}
                            >
                              Show after save.
                            </Text>
                          </View>
                        </View>
                        <Switch
                          value={keepActive}
                          onValueChange={setKeepActive}
                        />
                      </View>
                    </View>
                  </View>
                </View>

                <View
                  className={`mt-5 rounded-[28px] p-5 ${summaryCardClassName}`}
                >
                  <Text
                    className="text-sm font-semibold uppercase tracking-[1.5px]"
                    style={{ color: headerAccentColor }}
                  >
                    Upload summary
                  </Text>
                  <Text
                    className={`mt-3 text-base font-bold ${primaryTextClassName}`}
                  >
                    {title.trim() || "Untitled short"}
                  </Text>
                  <Text className={`mt-1 text-sm ${secondaryTextClassName}`}>
                    {formatDuration(trimDuration)} • {visibility} •{" "}
                    {allowComments ? "comments on" : "comments off"}
                  </Text>

                  {isBusy ? (
                    <View
                      className={`mt-4 rounded-2xl p-4 ${busySurfaceClassName}`}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text
                          className={`text-sm font-semibold ${primaryTextClassName}`}
                        >
                          {submitMode === "draft"
                            ? "Saving draft"
                            : "Uploading short"}
                        </Text>
                        <Text className="text-sm font-bold text-cyan-200">
                          {progress}%
                        </Text>
                      </View>
                      <View
                        className={`mt-3 h-2 rounded-full ${barTrackClassName}`}
                      >
                        <View
                          className="h-2 rounded-full bg-cyan-400"
                          style={{ width: `${progress}%` }}
                        />
                      </View>
                    </View>
                  ) : null}

                  <View className="mt-5 flex-row gap-3">
                    <TouchableOpacity
                      activeOpacity={0.9}
                      disabled={isSubmitDisabled}
                      onPress={() => void handleSubmit("draft")}
                      className={`flex-1 flex-row items-center justify-center rounded-[22px] px-4 py-4 ${
                        isSubmitDisabled
                          ? disabledButtonClassName
                          : isDarkMode
                            ? "bg-white/90"
                            : "bg-slate-900"
                      }`}
                    >
                      {isBusy && submitMode === "draft" ? (
                        <ActivityIndicator
                          color={isDarkMode ? "#020617" : "#ffffff"}
                        />
                      ) : (
                        <Save
                          size={18}
                          color={isDarkMode ? "#020617" : "#ffffff"}
                        />
                      )}
                      <Text
                        className={`ml-2 text-sm font-bold ${
                          isDarkMode ? "text-slate-950" : "text-white"
                        }`}
                      >
                        Save draft
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.9}
                      disabled={isSubmitDisabled}
                      onPress={() => void handleSubmit("draft")}
                      className={`flex-1 flex-row items-center justify-center rounded-[22px] px-4 py-4 ${
                        isSubmitDisabled ? "bg-cyan-400/25" : "bg-cyan-400"
                      }`}
                    >
                      {isBusy && submitMode === "draft" ? (
                        <ActivityIndicator color={accentStrongTextColor} />
                      ) : (
                        <UploadCloud size={18} color={accentStrongTextColor} />
                      )}
                      <Text
                        className="ml-2 text-sm font-bold"
                        style={{ color: accentStrongTextColor }}
                      >
                        Upload now
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </View>
  );
}
