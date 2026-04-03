import {
  type SectionAudio,
  type SectionDocument,
  type SectionImage,
  type SectionVideo,
} from "@/lib/services/section-service";
import { LinearGradient } from "expo-linear-gradient";
import {
  FileText,
  Headphones,
  Image as ImageIcon,
  MoreVertical,
  Play,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Animated, FlatList, Image, Pressable, Text, View } from "react-native";
import { type SectionMediaTabKey } from "./tab-ui";

type MediaItem = SectionVideo | SectionDocument | SectionAudio | SectionImage;

interface MediaListUIProps {
  tab: SectionMediaTabKey;
  items?: MediaItem[] | null;
  onPressItem?: (item: MediaItem) => void;
  onPressMenu?: (item: MediaItem) => void;
  showMenu?: boolean;
  emptyText?: string;
  variant?: "grid" | "list";
}

const formatDuration = (seconds?: number | null) => {
  if (!seconds || seconds <= 0) return "Unknown";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

const getMetaLabel = (tab: SectionMediaTabKey, item: MediaItem): string => {
  if (tab === "videos") {
    const video = item as SectionVideo;
    return formatDuration(video.duration_seconds);
  }

  if (tab === "documents") {
    const doc = item as SectionDocument;
    return (doc.pages ?? 0) > 0
      ? `${doc.pages} page${doc.pages > 1 ? "s" : ""}`
      : "Unknown pages";
  }

  if (tab === "audios") {
    const audio = item as SectionAudio;
    return formatDuration(audio.duration_seconds);
  }

  const image = item as SectionImage;
  return image.width && image.height
    ? `${image.width}×${image.height}`
    : "Unknown resolution";
};

const getTypeIcon = (tab: SectionMediaTabKey, size?: number) => {
  const iconSize = size || 20;

  if (tab === "videos") {
    const PlayIcon = (props: any) => <Play size={iconSize} {...props} />;
    PlayIcon.displayName = "PlayIcon";
    return PlayIcon;
  }
  if (tab === "documents") {
    const FileTextIcon = (props: any) => (
      <FileText size={iconSize} {...props} />
    );
    FileTextIcon.displayName = "FileTextIcon";
    return FileTextIcon;
  }
  if (tab === "audios") {
    const HeadphonesIcon = (props: any) => (
      <Headphones size={iconSize} {...props} />
    );
    HeadphonesIcon.displayName = "HeadphonesIcon";
    return HeadphonesIcon;
  }
  const ImageIconComponent = (props: any) => (
    <ImageIcon size={iconSize} {...props} />
  );
  ImageIconComponent.displayName = "ImageIconComponent";
  return ImageIconComponent;
};

const getTypeColor = (tab: SectionMediaTabKey) => {
  switch (tab) {
    case "videos":
      return { bg: "#3B82F6", light: "#DBEAFE", dark: "#1E3A8A" };
    case "documents":
      return { bg: "#10B981", light: "#D1FAE5", dark: "#065F46" };
    case "audios":
      return { bg: "#F59E0B", light: "#FEF3C7", dark: "#92400E" };
    default:
      return { bg: "#8B5CF6", light: "#EDE9FE", dark: "#5B21B6" };
  }
};

const MediaCard = ({
  tab,
  item,
  isDark,
  onPress,
  onPressMenu,
  showMenu,
  variant = "list",
}: {
  tab: SectionMediaTabKey;
  item: MediaItem;
  isDark: boolean;
  onPress?: (item: MediaItem) => void;
  onPressMenu?: (item: MediaItem) => void;
  showMenu: boolean;
  variant?: "grid" | "list";
}) => {
  const [imageFailed, setImageFailed] = React.useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const TypeIcon = getTypeIcon(tab, variant === "grid" ? 24 : 20);
  const typeColor = getTypeColor(tab);

  const thumbnailUrl =
    (item as { thumbnail_url?: string | null }).thumbnail_url ??
    (item as { image_url?: string | null }).image_url ??
    null;

  const hasThumbnail =
    !!thumbnailUrl &&
    /^https?:\/\//i.test(thumbnailUrl) &&
    imageFailed === false;

  const title = (item as { title?: string }).title ?? "Untitled";
  const description = (item as { description?: string }).description ?? "";
  const meta = getMetaLabel(tab, item);

  const mutedIconColor = isDark ? "#A1A1AA" : "#71717A";
  const bgColor = isDark ? "#18181B" : "#FFFFFF";
  const borderColor = isDark ? "#27272A" : "#F4F4F5";

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 150,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 3,
    }).start();
  };

  if (variant === "list" && tab === "videos") {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={() => onPress?.(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View className="overflow-hidden rounded-[12px]">
            <View
              className="overflow-hidden rounded-[12px]"
              style={{
                backgroundColor: bgColor,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.25 : 0.08,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              <View className="relative h-52 w-full">
                {hasThumbnail ? (
                  <Image
                    source={{ uri: thumbnailUrl }}
                    className="h-full w-full"
                    resizeMode="cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <LinearGradient
                    colors={
                      isDark
                        ? ["#0F172A", "#111827", "#1E293B"]
                        : ["#DBEAFE", "#EFF6FF", "#FFFFFF"]
                    }
                    className="h-full w-full items-center justify-center"
                  >
                    <View className="h-16 w-16 items-center justify-center rounded-full bg-white/90">
                      <TypeIcon color="#EF4444" />
                    </View>
                  </LinearGradient>
                )}

                <View className="absolute bottom-3 right-3 rounded-md bg-black/80 px-2 py-1">
                  <Text className="text-xs font-semibold text-white">
                    {meta}
                  </Text>
                </View>
              </View>

              <View className="flex-row px-3 py-3">
                <View
                  className="mr-3 mt-0.5 h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: isDark ? "#1F2937" : "#E5E7EB" }}
                >
                  <Play size={18} color={isDark ? "#F9FAFB" : "#111827"} />
                </View>

                <View className="flex-1">
                  <View className="flex-row items-start">
                    <Text
                      className="flex-1 pr-2 text-[15px] font-semibold"
                      style={{ color: isDark ? "#FFFFFF" : "#18181B" }}
                      numberOfLines={2}
                    >
                      {title}
                    </Text>

                    {showMenu && (
                      <Pressable
                        onPress={() => onPressMenu?.(item)}
                        hitSlop={8}
                        className="rounded-full p-1.5"
                      >
                        <MoreVertical size={18} color={mutedIconColor} />
                      </Pressable>
                    )}
                  </View>

                  <Text
                    className="mt-1 text-xs"
                    style={{ color: mutedIconColor }}
                    numberOfLines={2}
                  >
                    {description || "Video lesson"}
                  </Text>

                  <View className="mt-2 flex-row items-center">
                    <View
                      className="mr-2 rounded-full px-2.5 py-1"
                      style={{
                        backgroundColor: isDark ? "#27272A" : "#F4F4F5",
                      }}
                    >
                      <Text
                        className="text-[11px] font-semibold"
                        style={{ color: mutedIconColor }}
                      >
                        Video
                      </Text>
                    </View>
                    <Text className="text-xs" style={{ color: mutedIconColor }}>
                      {meta}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === "list" && tab === "audios") {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={() => onPress?.(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View
            className="flex-row items-center rounded-md px-3 py-3"
            style={{
              backgroundColor: isDark ? "#121212" : "#FFFFFF",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.24 : 0.08,
              shadowRadius: 8,
            }}
          >
            <View
              className="mr-3 h-16 w-16 overflow-hidden rounded-xs"
              style={{ backgroundColor: isDark ? "#1F2937" : "#F3F4F6" }}
            >
              {hasThumbnail ? (
                <Image
                  source={{ uri: thumbnailUrl }}
                  className="h-full w-full"
                  resizeMode="cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <LinearGradient
                  colors={
                    isDark ? ["#14532D", "#052E16"] : ["#BBF7D0", "#DCFCE7"]
                  }
                  className="h-full w-full items-center justify-center"
                >
                  <Headphones
                    size={22}
                    color={isDark ? "#86EFAC" : "#166534"}
                  />
                </LinearGradient>
              )}
            </View>

            <View className="flex-1 pr-3">
              <Text
                className="text-[15px] font-semibold"
                style={{ color: isDark ? "#FFFFFF" : "#111827" }}
                numberOfLines={1}
              >
                {title}
              </Text>

              <Text
                className="mt-1 text-xs"
                style={{ color: mutedIconColor }}
                numberOfLines={1}
              >
                {description || "Audio lesson"}
              </Text>

              <View className="mt-2 flex-row items-center">
                <View
                  className="mr-2 rounded-full px-2.5 py-1"
                  style={{
                    backgroundColor: isDark ? "#1DB95422" : "#DCFCE7",
                  }}
                >
                  <Text
                    className="text-[11px] font-semibold"
                    style={{ color: isDark ? "#86EFAC" : "#166534" }}
                  >
                    Audio
                  </Text>
                </View>
                <Text className="text-xs" style={{ color: mutedIconColor }}>
                  {meta}
                </Text>
              </View>
            </View>

            <View className="items-center">
              {showMenu ? (
                <Pressable
                  onPress={() => onPressMenu?.(item)}
                  hitSlop={8}
                  className="mb-2 rounded-full p-1.5"
                >
                  <MoreVertical size={16} color={mutedIconColor} />
                </Pressable>
              ) : null}

              <View className="h-10 w-10 items-center justify-center rounded-full bg-[#1DB954]">
                <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === "grid") {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={() => onPress?.(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className="flex-1"
        >
          <View
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: bgColor,
              borderWidth: 1,
              borderColor: borderColor,
              minHeight: 252,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="relative h-52">
              {hasThumbnail ? (
                <Image
                  source={{ uri: thumbnailUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <LinearGradient
                  colors={
                    isDark
                      ? [typeColor.dark, "#2D2D35"]
                      : [typeColor.light, "#F8F8FA"]
                  }
                  className="w-full h-full items-center justify-center"
                >
                  <TypeIcon color={typeColor.bg} />
                </LinearGradient>
              )}

              {tab === "videos" && (
                <View className="absolute bottom-2 right-2 bg-black/70 rounded-full px-2 py-1">
                  <Text className="text-white text-xs font-medium">{meta}</Text>
                </View>
              )}
            </View>

            <View className="p-3">
              <Text
                className="text-sm font-semibold mb-1"
                style={{ color: isDark ? "#FFFFFF" : "#18181B" }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {title}
              </Text>

              <View className="flex-row items-center justify-end">
                {showMenu && (
                  <Pressable
                    onPress={() => onPressMenu?.(item)}
                    hitSlop={8}
                    className="p-1.5 rounded-full"
                    style={{ backgroundColor: isDark ? "#27272A" : "#F4F4F5" }}
                  >
                    <MoreVertical size={14} color={mutedIconColor} />
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={() => onPress?.(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View
          className="rounded-lg overflow-hidden"
          style={{
            backgroundColor: bgColor,
            minHeight: 76,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 8,
          }}
        >
          <View className="flex-row">
            <View className="relative">
              <View
                className="w-40 h-24 overflow-hidden relative"
                style={{ backgroundColor: isDark ? "#27272A" : "#F4F4F5" }}
              >
                {hasThumbnail ? (
                  <>
                    <Image
                      source={{ uri: thumbnailUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                      onError={() => setImageFailed(true)}
                    />
                  </>
                ) : (
                  <LinearGradient
                    colors={
                      isDark
                        ? [typeColor.dark, "#18181B", "#111827"]
                        : [typeColor.light, "#FFFFFF", "#F8FAFC"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="flex-1 justify-between px-3 py-2"
                  >
                    <View
                      className="h-7 w-7 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(255,255,255,0.92)",
                      }}
                    >
                      <TypeIcon color={typeColor.bg} />
                    </View>

                    <View>
                      <Text
                        className="text-[10px] font-semibold uppercase tracking-[0.8px]"
                        style={{ color: isDark ? "#E4E4E7" : "#3F3F46" }}
                        numberOfLines={1}
                      >
                        {tab === "videos"
                          ? "Video Lesson"
                          : tab === "documents"
                            ? "Study Material"
                            : tab === "audios"
                              ? "Audio Lesson"
                              : "Image Resource"}
                      </Text>
                    </View>
                  </LinearGradient>
                )}
              </View>
            </View>

            <View className="flex-1 ml-3 pr-3 py-1 justify-center">
              <View style={{ minHeight: 28, justifyContent: "center" }}>
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-sm font-semibold flex-1 mr-2"
                    style={{ color: isDark ? "#FFFFFF" : "#18181B" }}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>

                  {showMenu && (
                    <Pressable
                      onPress={() => onPressMenu?.(item)}
                      hitSlop={8}
                      className="p-1.5 rounded-full"
                      style={{
                        backgroundColor: isDark ? "#27272A" : "#F4F4F5",
                      }}
                    >
                      <MoreVertical size={16} color={mutedIconColor} />
                    </Pressable>
                  )}
                </View>

                {description ? (
                  <Text
                    className="text-xs mt-0.5"
                    style={{ color: mutedIconColor }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {description}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default function MediaListUI({
  tab,
  items,
  onPressItem,
  onPressMenu,
  showMenu = false,
  emptyText,
  variant = "list",
}: MediaListUIProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const data = items ?? [];

  if (!data.length) {
    return (
      <View className="items-center justify-center py-16 px-4">
        <View
          className="w-24 h-24 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: isDark ? "#27272A" : "#F4F4F5" }}
        >
          {getTypeIcon(tab, 32)({ color: isDark ? "#71717A" : "#9CA3AF" })}
        </View>
        <Text
          className="text-lg font-semibold text-center mb-2"
          style={{ color: isDark ? "#FFFFFF" : "#18181B" }}
        >
          No {tab} yet
        </Text>
        <Text
          className="text-center px-8"
          style={{ color: isDark ? "#A1A1AA" : "#71717A" }}
        >
          {emptyText ?? `This chapter doesn't have any ${tab} yet.`}
        </Text>
      </View>
    );
  }

  if (variant === "grid") {
    return (
      <FlatList
        data={data}
        keyExtractor={(item) => `${tab}-${item.id}`}
        renderItem={({ item }) => (
          <View className="flex-1 p-2">
            <MediaCard
              tab={tab}
              item={item}
              isDark={isDark}
              onPress={onPressItem}
              onPressMenu={onPressMenu}
              showMenu={showMenu}
              variant="grid"
            />
          </View>
        )}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 8 }}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => `${tab}-${item.id}`}
      renderItem={({ item }) => (
        <View className="px-4 mb-3">
          <MediaCard
            tab={tab}
            item={item}
            isDark={isDark}
            onPress={onPressItem}
            onPressMenu={onPressMenu}
            showMenu={showMenu}
            variant="list"
          />
        </View>
      )}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    />
  );
}
