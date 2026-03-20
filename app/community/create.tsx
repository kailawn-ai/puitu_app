import { BackButton } from "@/components/ui/back-button";
import {
  CommunityService,
  CreateCommunityGroupPayload,
} from "@/lib/services/community-service";
import { FirebaseUploadService } from "@/lib/services/firebase-upload-service";
import { useAlert } from "@/providers/alert-provider";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Camera, X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CreateGroupForm = {
  avatarUrl: string;
  name: string;
  description: string;
  isPrivate: boolean;
  maxMembers: string;
};

const INITIAL_FORM: CreateGroupForm = {
  avatarUrl: "",
  name: "",
  description: "",
  isPrivate: false,
  maxMembers: "100",
};

export default function CreateCommunityGroupScreen() {
  const alert = useAlert();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [form, setForm] = useState<CreateGroupForm>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreviewUri, setAvatarPreviewUri] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

  const isSaveDisabled = useMemo(() => {
    const parsedMaxMembers = Number(form.maxMembers.trim());

    return (
      isSaving ||
      isUploadingAvatar ||
      !form.name.trim() ||
      !Number.isFinite(parsedMaxMembers) ||
      parsedMaxMembers < 2
    );
  }, [form.maxMembers, form.name, isSaving, isUploadingAvatar]);

  const handleChange = (
    field: keyof CreateGroupForm,
    value: string | boolean,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePickAvatar = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        alert.showWarning(
          "Permission needed",
          "Please allow photo library access to choose a group avatar.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const previousAvatarUrl = form.avatarUrl;
      const previousPreviewUri = avatarPreviewUri;

      setAvatarPreviewUri(asset.uri);
      setIsUploadingAvatar(true);

      try {
        const upload = await FirebaseUploadService.uploadCommunityAvatar({
          uri: asset.uri,
          name: asset.fileName || `community-avatar-${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
        });

        console.log("upload:", upload);

        setForm((prev) => ({ ...prev, avatarUrl: upload.url }));
        setAvatarPreviewUri(upload.url);
      } catch (error: any) {
        console.log("Community avatar upload error:", {
          message: error?.message,
          status: error?.status,
          data: error?.data,
          assetUri: asset.uri,
          assetMimeType: asset.mimeType,
          assetFileName: asset.fileName,
        });
        setForm((prev) => ({ ...prev, avatarUrl: previousAvatarUrl }));
        setAvatarPreviewUri(previousPreviewUri);
        alert.showError(
          "Upload failed",
          error?.message || "We could not upload the avatar image.",
        );
      } finally {
        setIsUploadingAvatar(false);
      }
    } catch (error: any) {
      alert.showError(
        "Picker error",
        error?.message || "We could not open the image picker.",
      );
    }
  };

  const handleRemoveAvatar = () => {
    setForm((prev) => ({ ...prev, avatarUrl: "" }));
    setAvatarPreviewUri("");
  };

  const handleCreateGroup = async () => {
    const parsedMaxMembers = Number(form.maxMembers.trim());

    if (!form.name.trim()) {
      alert.showWarning("Missing name", "Please enter a group name.");
      return;
    }

    if (!Number.isFinite(parsedMaxMembers) || parsedMaxMembers < 2) {
      alert.showWarning(
        "Invalid member limit",
        "Max members must be a number greater than 1.",
      );
      return;
    }

    const payload: CreateCommunityGroupPayload = {
      avatar_url: form.avatarUrl || undefined,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      is_private: form.isPrivate,
      max_members: parsedMaxMembers,
    };

    setIsSaving(true);
    try {
      const group = await CommunityService.createGroup(payload);
      ToastAndroid.show("Group created successfully", ToastAndroid.SHORT);
      router.replace(`/community/${group.id}` as never);
    } catch (err: any) {
      const errorMessage =
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        "Failed to create your group.";
      alert.showError("Error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <LinearGradient
          colors={isDarkMode ? ["#09090b", "#171717"] : ["#F8FAFC", "#E2E8F0"]}
          locations={[0, 1]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={{ flex: 1 }}
        >
          <View
            className="px-5 flex-row items-center justify-between"
            style={{ paddingTop: insets.top + 1 }}
          >
            <BackButton onPress={() => router.back()} />
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Group
            </Text>
            <View className="h-12 w-12" />
          </View>

          <ScrollView
            className="mt-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: Math.max(insets.bottom + 140, 164),
            }}
          >
            <View className="px-5">
              <View className="rounded-3xl bg-secondary-50 p-5 dark:bg-secondary-700">
                <View className="items-center">
                  <View className="relative">
                    <TouchableOpacity
                      onPress={handlePickAvatar}
                      disabled={isUploadingAvatar}
                    >
                      <View className="h-28 w-28 items-center justify-center overflow-hidden rounded-[30px] bg-white dark:bg-secondary-900">
                        {avatarPreviewUri ? (
                          <Image
                            source={{ uri: avatarPreviewUri }}
                            className="h-full w-full"
                          />
                        ) : (
                          <View className="items-center justify-center">
                            <Camera
                              size={28}
                              color={isDarkMode ? "#CBD5E1" : "#64748B"}
                            />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>

                    {avatarPreviewUri ? (
                      <TouchableOpacity
                        onPress={handleRemoveAvatar}
                        className="absolute -right-2 -top-2 rounded-full bg-slate-900 p-2 dark:bg-white"
                        disabled={isUploadingAvatar}
                      >
                        <X
                          size={14}
                          color={isDarkMode ? "#0F172A" : "#FFFFFF"}
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <Text className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                    Group avatar
                  </Text>
                </View>

                <View className="my-5 h-px bg-slate-200 dark:bg-secondary-700" />

                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                  Start a new community
                </Text>
                <Text className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Create a space for discussion, collaboration, and live group
                  chat around a shared topic.
                </Text>

                <View className="mt-5 gap-4">
                  <View>
                    <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      Group name
                    </Text>
                    <TextInput
                      value={form.name}
                      onChangeText={(text) => handleChange("name", text)}
                      placeholder="e.g. Biology Revision Circle"
                      placeholderTextColor="#9CA3AF"
                      className="rounded-2xl border border-border bg-white px-4 py-4 text-base text-gray-900 dark:border-gray-700 dark:bg-secondary-900 dark:text-white"
                    />
                  </View>

                  <View>
                    <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      Description
                    </Text>
                    <TextInput
                      value={form.description}
                      onChangeText={(text) => handleChange("description", text)}
                      placeholder="Tell people what this group is for"
                      placeholderTextColor="#9CA3AF"
                      multiline
                      textAlignVertical="top"
                      className="min-h-[132px] rounded-2xl border border-border bg-white px-4 py-4 text-base text-gray-900 dark:border-gray-700 dark:bg-secondary-900 dark:text-white"
                    />
                  </View>

                  <View>
                    <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      Max members
                    </Text>
                    <TextInput
                      value={form.maxMembers}
                      onChangeText={(text) =>
                        handleChange("maxMembers", text.replace(/[^0-9]/g, ""))
                      }
                      placeholder="100"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      className="rounded-2xl border border-border bg-white px-4 py-4 text-base text-gray-900 dark:border-gray-700 dark:bg-secondary-900 dark:text-white"
                    />
                  </View>
                </View>
              </View>

              <View className="mt-5 rounded-3xl bg-secondary-50 p-5 dark:bg-secondary-800">
                <View className="flex-row items-start justify-between">
                  <View className="mr-4 flex-1">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white">
                      Privacy
                    </Text>
                    <Text className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                      {form.isPrivate
                        ? "Only invited or approved members should join this group."
                        : "Anyone can discover and join this group from the community tab."}
                    </Text>
                  </View>

                  <Switch
                    value={form.isPrivate}
                    onValueChange={(value) => handleChange("isPrivate", value)}
                    trackColor={{ false: "#CBD5E1", true: "#A78BFA" }}
                    thumbColor={form.isPrivate ? "#7A25FF" : "#F8FAFC"}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <View
            className="absolute inset-x-0 bottom-0"
            pointerEvents="box-none"
          >
            <LinearGradient
              colors={
                isDarkMode
                  ? [
                      "rgba(15, 23, 42, 0)",
                      "rgba(15, 23, 42, 0.88)",
                      "rgba(15, 23, 42, 1)",
                    ]
                  : [
                      "rgba(248, 250, 252, 0)",
                      "rgba(248, 250, 252, 0.9)",
                      "rgba(248, 250, 252, 1)",
                    ]
              }
              locations={[0, 0.55, 1]}
              style={{ height: 70 }}
            >
              <View
                className="px-8"
                style={{ paddingBottom: Math.max(insets.bottom, 16) }}
                pointerEvents="box-none"
              >
                <TouchableOpacity
                  className={`items-center rounded-full px-6 py-4 ${
                    isSaveDisabled ? "bg-primary-300" : "bg-primary"
                  }`}
                  disabled={isSaveDisabled}
                  onPress={handleCreateGroup}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-base font-semibold text-white">
                      Create Group
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </View>
  );
}
