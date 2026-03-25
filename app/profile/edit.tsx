import EditProfileSkeleton from "@/components/profile/edit-profile-skeleton";
import { BackButton } from "@/components/ui/back-button";
import { FirebaseUploadService } from "@/lib/services/firebase-upload-service";
import {
  ProfileResponseService,
  type ProfileResponseData,
} from "@/lib/services/profile-response-service";
import { UserPayload, UserService } from "@/lib/services/user-service";
import { saveAuthUserToStore } from "@/lib/utils/auth-user-store";
import { useAlert } from "@/providers/alert-provider";
import { useProfileResponseStore } from "@/store/profile-response-store";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Camera, X } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type EditFormData = {
  profileImage: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  district: string;
  town: string;
};

const mapProfileResponseToForm = (
  profileResponse?: ProfileResponseData | null,
): EditFormData => ({
  profileImage: profileResponse?.user?.profile_image ?? "",
  name: profileResponse?.user?.name ?? "",
  email: profileResponse?.user?.email ?? "",
  phone: profileResponse?.user?.phone ?? "",
  country: profileResponse?.user?.country ?? "",
  state: profileResponse?.user?.state ?? "",
  district: profileResponse?.user?.district ?? "",
  town: profileResponse?.user?.town ?? "",
});

const EditProfileScreen = () => {
  const { showError, showWarning } = useAlert();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const profileResponse = useProfileResponseStore(
    (state) => state.profileResponse,
  );
  const setProfileResponseStore = useProfileResponseStore(
    (state) => state.setProfileResponse,
  );

  const [formData, setFormData] = useState<EditFormData>(() =>
    mapProfileResponseToForm(profileResponse),
  );
  const [isLoading, setIsLoading] = useState(!profileResponse);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [avatarPreviewUri, setAvatarPreviewUri] = useState(
    profileResponse?.user?.profile_image ?? "",
  );
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

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await ProfileResponseService.getProfileResponse();
      setProfileResponseStore(response);
      setFormData(mapProfileResponseToForm(response));
      setAvatarPreviewUri(response?.user?.profile_image ?? "");
    } catch (err: any) {
      const errorMessage =
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        "Failed to load your profile.";

      setLoadError(errorMessage);
      showError("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [setProfileResponseStore, showError]);

  useEffect(() => {
    if (!profileResponse) {
      return;
    }

    setFormData(mapProfileResponseToForm(profileResponse));
    setAvatarPreviewUri(profileResponse?.user?.profile_image ?? "");
    setIsLoading(false);
    setLoadError(null);
  }, [profileResponse]);

  useEffect(() => {
    if (!profileResponse) {
      loadProfile();
    }
  }, [loadProfile]);

  const handleChange = (field: keyof EditFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePickAvatar = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showWarning(
          "Permission needed",
          "Please allow photo library access to choose a profile photo.",
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
      const previousAvatarUrl = formData.profileImage;
      const previousPreviewUri = avatarPreviewUri;

      setAvatarPreviewUri(asset.uri);
      setIsUploadingAvatar(true);

      try {
        const upload = await FirebaseUploadService.uploadProfileAsset({
          uri: asset.uri,
          name: asset.fileName || `profile-avatar-${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
        });

        setFormData((prev) => ({ ...prev, profileImage: upload.url }));
        setAvatarPreviewUri(upload.url);
      } catch (error: any) {
        setFormData((prev) => ({ ...prev, profileImage: previousAvatarUrl }));
        setAvatarPreviewUri(previousPreviewUri);
        showError(
          "Upload failed",
          error?.message || "We could not upload the profile photo.",
        );
      } finally {
        setIsUploadingAvatar(false);
      }
    } catch (error: any) {
      showError(
        "Picker error",
        error?.message || "We could not open the image picker.",
      );
    }
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, profileImage: "" }));
    setAvatarPreviewUri("");
  };

  const isSaveDisabled = useMemo(
    () =>
      isSaving ||
      isUploadingAvatar ||
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim(),
    [formData, isSaving, isUploadingAvatar],
  );

  const handleSave = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (isSaveDisabled) {
      showWarning(
        "Missing details",
        "Name, email, and phone number are required.",
      );
      return;
    }

    if (!emailRegex.test(formData.email.trim())) {
      showWarning("Invalid email", "Please enter a valid email address.");
      return;
    }

    const payload: UserPayload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      profile_image: formData.profileImage.trim() || undefined,
      country: formData.country.trim() || undefined,
      state: formData.state.trim() || undefined,
      district: formData.district.trim() || undefined,
      town: formData.town.trim() || undefined,
    };

    setIsSaving(true);
    try {
      const updatedUser = await UserService.updateMe(payload);
      const nextProfileResponse: ProfileResponseData | null = profileResponse
        ? {
            ...profileResponse,
            user: {
              ...profileResponse.user,
              id: updatedUser?.id ?? profileResponse.user.id,
              name:
                updatedUser?.name ?? payload.name ?? profileResponse.user.name,
              email:
                updatedUser?.email ??
                payload.email ??
                profileResponse.user.email,
              phone:
                updatedUser?.phone ??
                payload.phone ??
                profileResponse.user.phone,
              profile_image:
                updatedUser?.profile_image ??
                payload.profile_image ??
                profileResponse.user.profile_image,
              country:
                updatedUser?.country ??
                payload.country ??
                profileResponse.user.country,
              state:
                updatedUser?.state ??
                payload.state ??
                profileResponse.user.state,
              district:
                updatedUser?.district ??
                payload.district ??
                profileResponse.user.district,
              town:
                updatedUser?.town ?? payload.town ?? profileResponse.user.town,
              is_active:
                updatedUser?.is_active ?? profileResponse.user.is_active,
            },
          }
        : null;

      if (nextProfileResponse) {
        setProfileResponseStore(nextProfileResponse);
      }

      await saveAuthUserToStore(
        {
          id: updatedUser?.id ?? null,
          name: updatedUser?.name ?? formData.name,
          email: updatedUser?.email ?? formData.email,
          phone: updatedUser?.phone ?? formData.phone,
          profile_image:
            updatedUser?.profile_image ?? formData.profileImage ?? null,
          country: updatedUser?.country ?? formData.country,
          state: updatedUser?.state ?? formData.state,
          district: updatedUser?.district ?? formData.district,
          town: updatedUser?.town ?? formData.town,
          is_active: updatedUser?.is_active ?? true,
        },
        "system",
      );

      ToastAndroid.show("Profile updated successfully", ToastAndroid.SHORT);
      router.back();
    } catch (err: any) {
      const errorMessage =
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        "Failed to update your profile.";
      showError("Error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <EditProfileSkeleton />;
  }

  if (loadError) {
    return (
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
              Edit Profile
            </Text>
            <View className="w-12 h-12" />
          </View>

          <View className="flex-1 px-5 justify-center">
            <View className="rounded-3xl border border-red-200 bg-white/95 px-5 py-6 dark:border-red-900/60 dark:bg-secondary-900/95">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Unable to load profile
              </Text>
              <Text className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {loadError}
              </Text>

              <View className="mt-5 gap-3">
                <TouchableOpacity
                  className="items-center rounded-full bg-primary px-6 py-4"
                  onPress={loadProfile}
                >
                  <Text className="text-base font-semibold text-white">
                    Retry
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="items-center rounded-full border border-gray-300 px-6 py-4 dark:border-gray-700"
                  onPress={() => router.back()}
                >
                  <Text className="text-base font-semibold text-gray-900 dark:text-white">
                    Go Back
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    );
  }

  return (
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
          className="px-5 flex-row items-center justify-between mb-2"
          style={{ paddingTop: insets.top + 4 }}
        >
          <BackButton onPress={() => router.back()} />
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Profile
          </Text>
          <View className="w-12 h-12" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom + 120),
            paddingTop: Math.max(insets.top - 20),
          }}
        >
          <View className="px-5">
            <View className="rounded-3xl px-4">
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

                      {isUploadingAvatar ? (
                        <View className="absolute inset-0 items-center justify-center bg-black/35">
                          <ActivityIndicator color="#FFFFFF" />
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>

                  {avatarPreviewUri ? (
                    <TouchableOpacity
                      onPress={handleRemoveAvatar}
                      className="absolute -right-2 -top-2 rounded-full bg-slate-900 p-2 dark:bg-white"
                      disabled={isUploadingAvatar}
                    >
                      <X size={14} color={isDarkMode ? "#0F172A" : "#FFFFFF"} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                <Text className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                  Profile photo
                </Text>
                <Text className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
                  Tap to upload a square photo for your profile.
                </Text>
              </View>

              <View className="my-5 h-px bg-slate-200 dark:bg-secondary-700" />

              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Personal Info
              </Text>
              <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Update your details and keep your profile current.
              </Text>

              <View className="mt-5 gap-4">
                <View>
                  <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Name
                  </Text>
                  <TextInput
                    value={formData.name}
                    onChangeText={(text) => handleChange("name", text)}
                    placeholder="Your full name"
                    placeholderTextColor="#9CA3AF"
                    className="rounded-2xl border border-border bg-white px-4 py-4 text-base text-gray-900 dark:border-gray-700 dark:bg-secondary-900 dark:text-white"
                  />
                </View>

                <View>
                  <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Email
                  </Text>
                  <TextInput
                    value={formData.email}
                    onChangeText={(text) => handleChange("email", text)}
                    placeholder="name@example.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="rounded-2xl border border-border bg-white px-4 py-4 text-base text-gray-900 dark:border-gray-700 dark:bg-secondary-900 dark:text-white"
                  />
                </View>

                <View>
                  <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Phone
                  </Text>
                  <TextInput
                    value={formData.phone}
                    onChangeText={(text) => handleChange("phone", text)}
                    placeholder="+1 234 567 8900"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    className="rounded-2xl border border-border bg-white px-4 py-4 text-base text-gray-900 dark:border-gray-700 dark:bg-secondary-900 dark:text-white"
                  />
                </View>
              </View>
            </View>

            <View className="mt-6 rounded-3xl px-4">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Location
              </Text>

              <View className="mt-5 gap-4">
                <View>
                  <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Country
                  </Text>
                  <TextInput
                    value={formData.country}
                    onChangeText={(text) => handleChange("country", text)}
                    placeholder="Country"
                    placeholderTextColor="#9CA3AF"
                    className="rounded-2xl border border-border bg-white px-4 py-4 text-base text-gray-900 dark:border-gray-700 dark:bg-secondary-900 dark:text-white"
                  />
                </View>

                <View>
                  <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    State
                  </Text>
                  <TextInput
                    value={formData.state}
                    onChangeText={(text) => handleChange("state", text)}
                    placeholder="State"
                    placeholderTextColor="#9CA3AF"
                    className="rounded-2xl border border-border bg-white px-4 py-4 text-base text-gray-900 dark:border-gray-700 dark:bg-secondary-900 dark:text-white"
                  />
                </View>

                <View>
                  <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    District
                  </Text>
                  <TextInput
                    value={formData.district}
                    onChangeText={(text) => handleChange("district", text)}
                    placeholder="District"
                    placeholderTextColor="#9CA3AF"
                    className="rounded-2xl border border-border bg-white px-4 py-4 text-base text-gray-900 dark:border-gray-700 dark:bg-secondary-900 dark:text-white"
                  />
                </View>

                <View>
                  <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Town / City
                  </Text>
                  <TextInput
                    value={formData.town}
                    onChangeText={(text) => handleChange("town", text)}
                    placeholder="Town or city"
                    placeholderTextColor="#9CA3AF"
                    className="rounded-2xl border border-border bg-white px-4 py-4 text-base text-gray-900 dark:border-gray-700 dark:bg-secondary-900 dark:text-white"
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <View className="absolute inset-x-0 bottom-0" pointerEvents="box-none">
          <LinearGradient
            pointerEvents="none"
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
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          />
          <View
            className="px-8"
            style={{
              paddingTop: 24,
              paddingBottom: Math.max(insets.bottom, 16),
            }}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              className={`items-center rounded-full px-6 py-4 ${
                isSaveDisabled ? "bg-primary-300" : "bg-primary"
              }`}
              disabled={isSaveDisabled}
              onPress={handleSave}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;
