import QualificationModal from "@/components/modal/qualification-modal";
import ManageQualificationSkeleton from "@/components/qualification/manage-qualification-skeleton";
import { BackButton } from "@/components/ui/back-button";
import { UserProfile, UserService } from "@/lib/services/user-service";
import { useAlert } from "@/providers/alert-provider";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  ScrollView,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type QualificationChip = {
  id: number;
  name: string;
};

const extractQualificationChips = (
  qualifications: UserProfile["qualifications"],
): QualificationChip[] => {
  if (!Array.isArray(qualifications)) {
    return [];
  }

  return qualifications
    .map((item) => {
      if (typeof item === "number") {
        return { id: item, name: `Qualification ${item}` };
      }

      if (item?.id) {
        return {
          id: item.id,
          name: item.name || `Qualification ${item.id}`,
        };
      }

      return null;
    })
    .filter((item): item is QualificationChip => item !== null);
};

export default function ManageQualificationScreen() {
  const { showError } = useAlert();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [selectedQualificationChips, setSelectedQualificationChips] = useState<
    QualificationChip[]
  >([]);
  const [initialQualificationIds, setInitialQualificationIds] = useState<
    number[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showQualificationModal, setShowQualificationModal] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
      const user = await UserService.getMe();
      const qualificationChips = extractQualificationChips(
        user?.qualifications,
      );
      setSelectedQualificationChips(qualificationChips);
      setInitialQualificationIds(qualificationChips.map((item) => item.id));
    } catch (err: any) {
      const errorMessage =
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        "Failed to load your qualifications.";
      setLoadError(errorMessage);
      showError("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const selectedIds = useMemo(
    () => selectedQualificationChips.map((item) => item.id),
    [selectedQualificationChips],
  );

  const hasChanges = useMemo(() => {
    if (selectedIds.length !== initialQualificationIds.length) {
      return true;
    }

    const sortedSelectedIds = [...selectedIds].sort((a, b) => a - b);
    const sortedInitialIds = [...initialQualificationIds].sort((a, b) => a - b);

    return sortedSelectedIds.some(
      (id, index) => id !== sortedInitialIds[index],
    );
  }, [initialQualificationIds, selectedIds]);

  const isSaveDisabled = isSaving || !hasChanges;

  const handleQualificationSelect = (ids: number[]) => {
    setSelectedQualificationChips((prev) =>
      ids.map(
        (id) =>
          prev.find((item) => item.id === id) || {
            id,
            name: `Qualification ${id}`,
          },
      ),
    );
  };

  const handleRemoveQualification = (id: number) => {
    setSelectedQualificationChips((prev) =>
      prev.filter((item) => item.id !== id),
    );
  };

  const handleClearAll = () => {
    setSelectedQualificationChips([]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (selectedIds.length === 0) {
        await UserService.detachMyQualifications();
      } else {
        await UserService.updateMe({ qualifications: selectedIds });
      }

      setInitialQualificationIds(selectedIds);
      ToastAndroid.show(
        "Qualifications updated successfully",
        ToastAndroid.SHORT,
      );
      router.back();
    } catch (err: any) {
      const errorMessage =
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        "Failed to update your qualifications.";
      showError("Error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <ManageQualificationSkeleton />;
  }

  if (loadError) {
    return (
      <View className="flex-1 bg-background dark:bg-background-dark">
        <LinearGradient
          colors={isDarkMode ? ["#09090b", "#171717"] : ["#F8FAFC", "#E2E8F0"]}
          locations={[0, 1]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={{ flex: 1 }}
        >
          <View
            className="px-5 flex-row items-center justify-between"
            style={{ paddingTop: insets.top + 4 }}
          >
            <BackButton onPress={() => router.back()} />
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              Qualifications
            </Text>
            <View className="h-12 w-12" />
          </View>

          <View className="flex-1 justify-center px-5">
            <View className="rounded-3xl border border-red-200 bg-white/95 px-5 py-6 dark:border-red-900/60 dark:bg-secondary-900/95">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Unable to load qualifications
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
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <LinearGradient
        colors={isDarkMode ? ["#09090b", "#171717"] : ["#F8FAFC", "#E2E8F0"]}
        locations={[0, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ flex: 1 }}
      >
        <View
          className="px-5 flex-row items-center justify-between"
          style={{ paddingTop: insets.top + 4 }}
        >
          <BackButton onPress={() => router.back()} />
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Qualifications
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
            <View className="rounded-3xl bg-secondary-50 p-5 dark:bg-secondary-800">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Manage Your Qualifications
              </Text>
              <Text className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                Pick the qualifications that match your profile. These help
                personalize the content, jobs, and learning items you see.
              </Text>

              <View className="mt-5 rounded-2xl bg-white p-4 dark:bg-secondary-900">
                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Selected
                </Text>
                <Text className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {selectedIds.length}
                </Text>
                <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  qualification{selectedIds.length === 1 ? "" : "s"} chosen
                </Text>
              </View>

              {selectedQualificationChips.length > 0 ? (
                <View className="mt-5 flex-row flex-wrap">
                  {selectedQualificationChips.map((item) => (
                    <View
                      key={item.id}
                      className="mb-2 mr-2 flex-row items-center rounded-full border border-gray-200 bg-lime-50 px-3 py-2"
                    >
                      <Text
                        className="max-w-[180px] text-sm font-medium text-zinc-900"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <TouchableOpacity
                        className="ml-2 rounded-full bg-red-600 px-2 py-2"
                        onPress={() => handleRemoveQualification(item.id)}
                      >
                        <X color="#ffffff" size={12} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="mt-5 rounded-2xl border border-dashed border-border px-4 py-5 dark:border-gray-700">
                  <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
                    No qualifications selected yet.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                className="mt-5 rounded-2xl border border-dashed border-sky-500 bg-white px-4 py-4 dark:border-sky-600 dark:bg-secondary-900"
                onPress={() => setShowQualificationModal(true)}
              >
                <Text className="text-base font-medium text-sky-700 dark:text-sky-600">
                  {selectedIds.length > 0
                    ? "Update selected qualifications"
                    : "Tap to select qualifications"}
                </Text>
              </TouchableOpacity>

              {selectedIds.length > 0 && (
                <TouchableOpacity
                  className="mt-3 items-center rounded-2xl border border-border px-4 py-4 dark:border-gray-700"
                  onPress={handleClearAll}
                >
                  <Text className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Clear all selections
                  </Text>
                </TouchableOpacity>
              )}
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
                  Save Qualifications
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <QualificationModal
          visible={showQualificationModal}
          onClose={() => setShowQualificationModal(false)}
          onSelect={handleQualificationSelect}
          selectedIds={selectedIds}
        />
      </LinearGradient>
    </View>
  );
}
