import { useR2Upload } from "@/hook/use-r2-upload";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import type { DocumentPickerResult } from "expo-document-picker";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  ExternalLink,
  FileText,
  Link2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

type R2FileUploaderFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
  folder?: string;
  placeholder?: string;
  helperText?: string;
  forceMultipart?: boolean;
  allowManualEdit?: boolean;
  buttonLabel?: string;
  onUploadStateChange?: (uploading: boolean) => void;
  onUploadError?: (message: string) => void;
  onUploadSuccess?: (url: string) => void;
};

type PreviewKind = "image" | "video" | "web";

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "avif",
  "heic",
  "heif",
]);

const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "m4v", "webm", "mkv", "avi"]);

const DOCUMENT_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "txt",
  "rtf",
]);

const getObjectErrorMessage = (error: unknown) => {
  if (!error || typeof error !== "object") return null;

  const errorWithMessage = error as {
    message?: unknown;
    data?: { message?: unknown };
  };

  if (
    typeof errorWithMessage.message === "string" &&
    errorWithMessage.message.trim()
  ) {
    return errorWithMessage.message;
  }

  if (
    typeof errorWithMessage.data?.message === "string" &&
    errorWithMessage.data.message.trim()
  ) {
    return errorWithMessage.data.message;
  }

  return null;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    if (
      error.message.includes("Cannot find module") &&
      error.message.includes("expo-document-picker")
    ) {
      return "Document picker is not installed yet. Add expo-document-picker to use file selection.";
    }

    return error.message;
  }

  const objectMessage = getObjectErrorMessage(error);
  if (objectMessage) {
    return objectMessage;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "We could not upload the selected file.";
};

const getFileNameFromUrl = (url: string) => {
  if (!url.trim()) return "";

  try {
    const pathname = new URL(url).pathname;
    const fileName = pathname.split("/").filter(Boolean).pop();
    return fileName ? decodeURIComponent(fileName) : url;
  } catch {
    return url.split("/").filter(Boolean).pop() || url;
  }
};

const getUrlExtension = (url: string) => {
  if (!url.trim()) return "";

  try {
    const pathname = new URL(url).pathname;
    const fileName = pathname.split("/").filter(Boolean).pop() || "";
    const extension = fileName.split(".").pop();
    return extension ? extension.toLowerCase() : "";
  } catch {
    const cleanUrl = url.split("?")[0];
    const extension = cleanUrl.split(".").pop();
    return extension ? extension.toLowerCase() : "";
  }
};

const getPreviewKind = (url: string): PreviewKind => {
  const extension = getUrlExtension(url);

  if (IMAGE_EXTENSIONS.has(extension)) {
    return "image";
  }

  if (VIDEO_EXTENSIONS.has(extension)) {
    return "video";
  }

  return "web";
};

const getPreviewUrl = (url: string) => {
  const extension = getUrlExtension(url);

  if (DOCUMENT_EXTENSIONS.has(extension)) {
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
  }

  return url;
};

const pickDocument = async (): Promise<DocumentPickerResult> => {
  return DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: "*/*",
  });
};

export function R2FileUploaderField({
  label,
  value,
  onChange,
  isDark,
  folder = "uploads",
  placeholder = "https://example.com/file",
  helperText,
  forceMultipart = false,
  allowManualEdit = true,
  buttonLabel = "Choose file",
  onUploadStateChange,
  onUploadError,
  onUploadSuccess,
}: R2FileUploaderFieldProps) {
  const { upload, isUploading, progress, error } = useR2Upload();
  const [selectedFileName, setSelectedFileName] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [isPreviewMounted, setIsPreviewMounted] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const sheetTranslateY = useRef(new Animated.Value(520)).current;

  const previewKind = useMemo(() => getPreviewKind(value), [value]);
  const previewUrl = useMemo(() => getPreviewUrl(value), [value]);

  const displayFileName = useMemo(() => {
    return selectedFileName || getFileNameFromUrl(value);
  }, [selectedFileName, value]);

  const player = useVideoPlayer(
    previewKind === "video" && value ? { uri: value } : null,
    (instance) => {
      instance.loop = false;
    },
  );

  useEffect(() => {
    if (previewVisible) {
      setIsPreviewMounted(true);
      setPreviewError(null);

      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      if (previewKind === "video" && value) {
        player.replace({ uri: value }).catch((videoError) => {
          console.error("Preview video setup failed:", videoError);
          setPreviewError("We couldn't load this video preview.");
        });
      }

      return;
    }

    if (!isPreviewMounted) {
      return;
    }

    Animated.timing(sheetTranslateY, {
      toValue: 520,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsPreviewMounted(false);
    });
  }, [
    isPreviewMounted,
    player,
    previewKind,
    previewVisible,
    sheetTranslateY,
    value,
  ]);

  useEffect(() => {
    return () => {
      player.release();
    };
  }, [player]);

  const closePreview = () => {
    player.pause();

    Animated.timing(sheetTranslateY, {
      toValue: 520,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsPreviewMounted(false);
      setPreviewVisible(false);
      setPreviewError(null);
    });
  };

  const openPreview = () => {
    if (!value.trim()) {
      return;
    }

    setPreviewVisible(true);
  };

  const handleOpenExternal = async () => {
    try {
      await Linking.openURL(value);
    } catch (linkError) {
      console.error("Preview external open failed:", linkError);
      setPreviewError("We couldn't open this file externally.");
    }
  };

  const renderPreviewContent = () => {
    if (!value.trim()) {
      return null;
    }

    if (previewKind === "image") {
      return (
        <Image
          source={{ uri: value }}
          contentFit="contain"
          style={{ width: "100%", height: "100%" }}
        />
      );
    }

    if (previewKind === "video") {
      return (
        <VideoView
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          contentFit="contain"
          nativeControls
          style={{ width: "100%", height: "100%" }}
        />
      );
    }

    return (
      <WebView
        source={{ uri: previewUrl }}
        style={{ flex: 1, backgroundColor: isDark ? "#111113" : "#FFFFFF" }}
        startInLoadingState
        onError={(event) => {
          console.error("Preview webview failed:", event.nativeEvent);
          setPreviewError("This file could not be previewed inside the app.");
        }}
      />
    );
  };

  const handlePickAndUpload = async () => {
    onUploadStateChange?.(true);

    try {
      const result = await pickDocument();

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const fallbackName =
        asset.name || asset.uri.split("/").pop() || `upload-${Date.now()}`;

      setSelectedFileName(fallbackName);

      const uploaded = await upload(
        {
          uri: asset.uri,
          name: fallbackName,
          type: asset.mimeType || undefined,
        },
        {
          folder,
          forceMultipart,
        },
      );

      onChange(uploaded.publicUrl);
      setSelectedFileName(uploaded.filename);
      onUploadSuccess?.(uploaded.publicUrl);
    } catch (uploadError: unknown) {
      const message = getErrorMessage(uploadError);
      onUploadError?.(message);
      console.error("Error Upload:", uploadError);
      console.log("Error Upload Message:", message);
    } finally {
      onUploadStateChange?.(false);
    }
  };

  return (
    <View className="mb-5">
      <Text
        className="mb-3 text-sm font-semibold"
        style={{ color: isDark ? "#F4F4F5" : "#18181B" }}
      >
        {label}
      </Text>

      <View
        className="rounded-2xl border p-4"
        style={{
          backgroundColor: isDark ? "#18181B" : "#FAF8F5",
          borderColor: isDark ? "#2A2A2E" : "#E7E0D5",
        }}
      >
        <View className="flex-row items-start justify-between">
          <View className="mr-3 flex-1">
            <View className="flex-row items-center">
              <FileText size={16} color={isDark ? "#A1A1AA" : "#71717A"} />
              <Text
                className="ml-2 text-sm font-medium"
                style={{ color: isDark ? "#E4E4E7" : "#3F3F46" }}
              >
                {displayFileName || "No file selected"}
              </Text>
            </View>

            <Text
              className="mt-2 text-xs"
              style={{ color: isDark ? "#71717A" : "#78716C" }}
            >
              {isUploading
                ? `Uploading to Cloudflare R2... ${progress}%`
                : helperText ||
                  "Pick any file and we will store the public URL."}
            </Text>
          </View>
        </View>

        {progress > 0 && isUploading ? (
          <View
            className="mt-4 h-2 overflow-hidden rounded-full"
            style={{ backgroundColor: isDark ? "#27272A" : "#E7E5E4" }}
          >
            <View
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: isDark ? "#F4F4F5" : "#111111",
              }}
            />
          </View>
        ) : null}

        {allowManualEdit ? (
          <View
            className="mt-4 rounded-2xl border px-4 py-1"
            style={{
              backgroundColor: isDark ? "#111113" : "#FFFFFF",
              borderColor: isDark ? "#2A2A2E" : "#E7E0D5",
            }}
          >
            <View className="flex-row items-center">
              <Link2 size={16} color={isDark ? "#A1A1AA" : "#71717A"} />
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor={isDark ? "#71717A" : "#A1A1AA"}
                autoCapitalize="none"
                keyboardType="url"
                className="ml-2 h-11 flex-1 text-[15px]"
                style={{ color: isDark ? "#FFFFFF" : "#111827" }}
              />
            </View>
          </View>
        ) : null}

        {value ? (
          <View className="mt-3 flex-row flex-wrap items-center">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openPreview}
              className="mr-2 flex-row items-center self-start rounded-xl px-3 py-2"
              style={{ backgroundColor: isDark ? "#111113" : "#FFFFFF" }}
            >
              <FileText size={14} color={isDark ? "#E4E4E7" : "#18181B"} />
              <Text
                className="ml-2 text-xs font-semibold"
                style={{ color: isDark ? "#E4E4E7" : "#18181B" }}
              >
                Preview file
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setSelectedFileName("");
                onChange("");
              }}
              className="flex-row items-center self-start rounded-xl px-3 py-2"
              style={{ backgroundColor: isDark ? "#111113" : "#FFFFFF" }}
            >
              <Trash2 size={14} color={isDark ? "#FCA5A5" : "#B91C1C"} />
              <Text
                className="ml-2 text-xs font-semibold"
                style={{ color: isDark ? "#FCA5A5" : "#B91C1C" }}
              >
                Remove file URL
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {error ? (
          <Text
            className="mt-3 text-xs"
            style={{ color: isDark ? "#FCA5A5" : "#B91C1C" }}
          >
            {error}
          </Text>
        ) : null}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePickAndUpload}
          disabled={isUploading}
          className="rounded-2xl py-3 items-center mt-3"
          style={{
            backgroundColor: isUploading
              ? isDark
                ? "#27272A"
                : "#E7E5E4"
              : isDark
                ? "#F4F4F5"
                : "#111111",
          }}
        >
          <View className="flex-row items-center">
            {isUploading ? (
              <ActivityIndicator
                size="small"
                color={isDark ? "#111111" : "#FFFFFF"}
              />
            ) : (
              <UploadCloud size={16} color={isDark ? "#111111" : "#FFFFFF"} />
            )}
            <Text
              className="ml-2 text-sm font-semibold"
              style={{ color: isDark ? "#111111" : "#FFFFFF" }}
            >
              {isUploading ? "Uploading" : buttonLabel}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {isPreviewMounted ? (
        <Modal
          transparent
          visible={isPreviewMounted}
          animationType="none"
          onRequestClose={closePreview}
        >
          <View className="flex-1 justify-end">
            <Pressable
              className="absolute inset-0 bg-black/45"
              onPress={closePreview}
            />

            <Animated.View
              style={{ transform: [{ translateY: sheetTranslateY }] }}
              className="rounded-t-[28px]"
              accessibilityViewIsModal
            >
              <View
                style={{
                  backgroundColor: isDark ? "#111113" : "#FFFFFF",
                  borderColor: isDark ? "#2A2A2E" : "#E7E0D5",
                  minHeight: 420,
                  maxHeight: 640,
                  paddingBottom: 15,
                }}
                className="rounded-t-[28px]"
              >
                <View className="items-center py-2">
                  <View
                    className="h-1.5 w-12 rounded-full"
                    style={{ backgroundColor: isDark ? "#3F3F46" : "#D6D3D1" }}
                  />
                </View>

                <View className="flex-row items-center justify-between px-4 pb-3 pt-1">
                  <View className="flex-1 pr-3">
                    <Text
                      className="text-lg font-bold"
                      style={{ color: isDark ? "#FFFFFF" : "#111111" }}
                    >
                      File preview
                    </Text>
                    <Text
                      className="mt-1 text-xs"
                      numberOfLines={1}
                      style={{ color: isDark ? "#A1A1AA" : "#71717A" }}
                    >
                      {displayFileName || value}
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={closePreview}
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: isDark ? "#18181B" : "#F5F5F4" }}
                  >
                    <X size={18} color={isDark ? "#F4F4F5" : "#18181B"} />
                  </TouchableOpacity>
                </View>

                <View
                  className="mx-4 overflow-hidden rounded-2xl border"
                  style={{
                    height: 380,
                    backgroundColor: isDark ? "#09090B" : "#F8F5F0",
                    borderColor: isDark ? "#232326" : "#ECE7DF",
                  }}
                >
                  {renderPreviewContent()}
                </View>

                {previewError ? (
                  <Text
                    className="px-4 pt-3 text-xs"
                    style={{ color: isDark ? "#FCA5A5" : "#B91C1C" }}
                  >
                    {previewError}
                  </Text>
                ) : null}

                <View className="flex-row px-4 pt-4">
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleOpenExternal}
                    className="mr-2 flex-1 flex-row items-center justify-center rounded-2xl px-4 py-3"
                    style={{
                      backgroundColor: isDark ? "#18181B" : "#F5F5F4",
                    }}
                  >
                    <ExternalLink
                      size={15}
                      color={isDark ? "#F4F4F5" : "#18181B"}
                    />
                    <Text
                      className="ml-2 text-sm font-semibold"
                      style={{ color: isDark ? "#F4F4F5" : "#18181B" }}
                    >
                      Open externally
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={closePreview}
                    className="flex-1 rounded-2xl px-4 py-3"
                    style={{
                      backgroundColor: isDark ? "#F4F4F5" : "#111111",
                    }}
                  >
                    <Text
                      className="text-center text-sm font-semibold"
                      style={{ color: isDark ? "#111111" : "#FFFFFF" }}
                    >
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

export default R2FileUploaderField;
