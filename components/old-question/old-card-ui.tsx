import { type OldQuestion } from "@/lib/services/old-service";
import { LinearGradient } from "expo-linear-gradient";
import {
  BookOpen,
  Calendar,
  Download,
  Eye,
  FileText,
  GraduationCap,
  ShieldCheck,
} from "lucide-react-native";
import React from "react";
import { Animated, Image, Platform, Pressable, Text, View } from "react-native";

interface OldCardUIProps {
  question: OldQuestion;
  onPressDownload?: () => void;
  onPressPreview?: () => void;
  variant?: "default" | "compact" | "featured";
}

export default function OldCardUI({
  question,
  onPressDownload,
  onPressPreview,
  variant = "default",
}: OldCardUIProps) {
  const detail = question.detail;
  const yearText =
    question.year?.year?.toString() ?? question.year?.name ?? "Unknown year";
  const courseText =
    question.course?.title ?? question.course?.name ?? "Unknown course";
  const sectionText =
    question.section?.title ?? question.section?.name ?? "Unknown subject";
  const fileUrl = detail?.file;
  const imageUrl = detail?.image || question.thumbnail_url || undefined;

  const [imageFailed, setImageFailed] = React.useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = React.useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 150,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 3,
    }).start();
  };

  const hasValidImage =
    imageUrl && !imageFailed && /^https?:\/\//i.test(imageUrl);

  if (variant === "compact") {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPressPreview}
          className="active:opacity-90"
        >
          <View className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <View className="flex-row">
              <View className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800">
                {hasValidImage ? (
                  <Image
                    source={{ uri: imageUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <FileText size={24} color="#9CA3AF" />
                  </View>
                )}
              </View>

              <View className="flex-1 p-3 justify-between">
                <View>
                  <Text
                    className="text-zinc-900 dark:text-zinc-100 font-semibold"
                    numberOfLines={2}
                  >
                    {question.title}
                  </Text>

                  <View className="flex-row items-center mt-1">
                    <Calendar size={12} color="#9CA3AF" />
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">
                      {yearText}
                    </Text>
                    <View className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-2" />
                    <BookOpen size={12} color="#9CA3AF" />
                    <Text
                      className="text-xs text-zinc-500 dark:text-zinc-400 ml-1"
                      numberOfLines={1}
                    >
                      {courseText}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mt-2">
                  {detail?.is_premium && (
                    <View className="flex-row items-center bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                      <ShieldCheck size={10} color="#B45309" />
                      <Text className="ml-1 text-amber-700 dark:text-amber-300 text-xs font-medium">
                        Premium
                      </Text>
                    </View>
                  )}

                  <Pressable
                    onPress={onPressDownload}
                    disabled={!fileUrl}
                    className={`ml-auto rounded-full p-2 ${
                      fileUrl ? "bg-primary/10" : "bg-zinc-100 dark:bg-zinc-800"
                    }`}
                  >
                    <Download
                      size={16}
                      color={fileUrl ? "#3B82F6" : "#9CA3AF"}
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === "featured") {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPressPreview}
        >
          <View className="relative h-64 rounded-2xl overflow-hidden">
            {hasValidImage ? (
              <>
                <Image
                  source={{ uri: imageUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                  onError={() => setImageFailed(true)}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.8)"]}
                  className="absolute inset-0"
                />
              </>
            ) : (
              <LinearGradient
                colors={["#3B82F6", "#8B5CF6"]}
                className="w-full h-full items-center justify-center"
              >
                <FileText size={48} color="white" />
              </LinearGradient>
            )}

            <View className="absolute top-4 left-4 right-4 flex-row justify-between">
              <View className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg px-3 py-1.5 rounded-full">
                <Text className="font-semibold text-zinc-900 dark:text-white">
                  {yearText}
                </Text>
              </View>

              {detail?.is_premium && (
                <View className="bg-amber-500/90 backdrop-blur-lg px-3 py-1.5 rounded-full flex-row items-center">
                  <ShieldCheck size={14} color="white" />
                  <Text className="ml-1 text-white font-semibold text-sm">
                    Premium
                  </Text>
                </View>
              )}
            </View>

            <View className="absolute bottom-4 left-4 right-4">
              <Text
                className="text-white text-xl font-bold mb-2"
                numberOfLines={2}
              >
                {question.title}
              </Text>

              <View className="flex-row items-center mb-3">
                <View className="flex-row items-center mr-3">
                  <BookOpen size={14} color="rgba(255,255,255,0.8)" />
                  <Text className="text-white/80 text-sm ml-1">
                    {courseText}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <GraduationCap size={14} color="rgba(255,255,255,0.8)" />
                  <Text className="text-white/80 text-sm ml-1">
                    {sectionText}
                  </Text>
                </View>
              </View>

              <View className="flex-row space-x-2">
                <Pressable
                  onPress={onPressPreview}
                  className="flex-1 bg-white/20 backdrop-blur-lg rounded-xl py-3 flex-row items-center justify-center"
                >
                  <Eye size={18} color="white" />
                  <Text className="ml-2 text-white font-semibold">Preview</Text>
                </Pressable>

                <Pressable
                  onPress={onPressDownload}
                  disabled={!fileUrl}
                  className={`flex-1 rounded-xl py-3 flex-row items-center justify-center ${
                    fileUrl ? "bg-primary" : "bg-white/10"
                  }`}
                >
                  <Download size={18} color="white" />
                  <Text className="ml-2 text-white font-semibold">
                    {fileUrl ? "Download" : "Unavailable"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // Default variant
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPressPreview}
        className="active:opacity-95"
      >
        <View className="mx-3 rounded-xl overflow-hidden bg-white dark:bg-zinc-800 shadow-lg shadow-zinc-200/50 dark:shadow-zinc-900/50">
          <View className="relative h-52 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
            {hasValidImage ? (
              <>
                <Image
                  source={{ uri: imageUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                  onError={() => setImageFailed(true)}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.3)"]}
                  className="absolute inset-0"
                />
              </>
            ) : (
              <View className="flex-1 items-center justify-center">
                <FileText size={48} color="#9CA3AF" />
              </View>
            )}

            <View className="absolute top-3 right-3">
              {detail?.is_premium ? (
                <View className="bg-amber-500 px-3 py-1.5 rounded-full flex-row items-center shadow-lg">
                  <ShieldCheck size={14} color="white" />
                  <Text className="ml-1 text-white text-xs font-bold">
                    Premium
                  </Text>
                </View>
              ) : (
                <View className="bg-emerald-500 px-3 py-1.5 rounded-full shadow-lg">
                  <Text className="text-white text-xs font-bold">Free</Text>
                </View>
              )}
            </View>

            <View className="absolute bottom-3 left-3 flex-row">
              <View className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg px-3 py-1 rounded-full mr-2">
                <Text className="text-xs font-medium text-zinc-900 dark:text-white">
                  {yearText}
                </Text>
              </View>
              <View className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg px-3 py-1 rounded-full">
                <Text
                  className="text-xs font-medium text-zinc-900 dark:text-white"
                  numberOfLines={1}
                >
                  {courseText}
                </Text>
              </View>
            </View>
          </View>

          <View className="p-5">
            <Text
              className="text-zinc-900 dark:text-white text-xl font-bold mb-2"
              numberOfLines={2}
            >
              {question.title}
            </Text>

            <View className="flex-row items-center mb-3">
              <View className="flex-row items-center mr-4">
                <GraduationCap size={14} color="#9CA3AF" />
                <Text className="text-zinc-500 dark:text-zinc-400 text-sm ml-1.5">
                  {sectionText}
                </Text>
              </View>
            </View>

            {!!detail?.description && (
              <View className="mb-4 p-3 bg-neutral-100 dark:bg-zinc-900 rounded-xl">
                <Text className="text-zinc-600 dark:text-zinc-300 text-sm leading-5">
                  {detail.description}
                </Text>
              </View>
            )}

            <View className="flex-row">
              <Pressable
                onPress={onPressPreview}
                className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3.5 flex-row items-center justify-center"
              >
                <Eye
                  size={18}
                  color={Platform.OS === "ios" ? "#3B82F6" : "#9CA3AF"}
                />
                <Text className="ml-2 text-zinc-700 dark:text-zinc-300 font-semibold">
                  Preview
                </Text>
              </Pressable>

              <Pressable
                onPress={onPressDownload}
                disabled={!fileUrl}
                className={`flex-1 rounded-xl py-3.5 flex-row items-center justify-center ${
                  fileUrl
                    ? "bg-primary shadow-lg shadow-primary/30"
                    : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              >
                <Download size={18} color={fileUrl ? "#FFFFFF" : "#9CA3AF"} />
                <Text
                  className={`ml-2 font-semibold ${
                    fileUrl ? "text-white" : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {fileUrl ? "Download" : "Unavailable"}
                </Text>
              </Pressable>
            </View>

            {!fileUrl && (
              <Text className="text-xs text-red-500 dark:text-red-400 mt-3 text-center">
                File temporarily unavailable
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
