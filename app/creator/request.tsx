import { BackButton } from "@/components/ui/back-button";
import { R2FileUploaderField } from "@/components/ui/r2-file-uploader-field";
import {
  CreatorProfile,
  CreatorProfilePayload,
  CreatorService,
} from "@/lib/services/creator-service";
import { useAlert } from "@/providers/alert-provider";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  BadgeCheck,
  CirclePlus,
  ChevronLeft,
  ChevronRight,
  FileBadge2,
  FileText,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  Platform,
  ScrollView,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CreatorRequestForm = {
  occupation: string;
  religion: string;
  bio: string;
  expertAt: string;
  totalYearsExperience: string;
  maritalStatus: "single" | "married" | "divorced" | "widowed" | "";
  resumeUrl: string;
  documentUrls: string[];
};

type SaveMode = "draft" | "submit";

const maritalStatuses: CreatorRequestForm["maritalStatus"][] = [
  "single",
  "married",
  "divorced",
  "widowed",
];

const STEP_COUNT = 3;

const mapProfileToForm = (
  profile?: CreatorProfile | null,
): CreatorRequestForm => ({
  occupation: profile?.occupation ?? "",
  religion: profile?.religion ?? "",
  bio: profile?.bio ?? "",
  expertAt: profile?.expert_at ?? "",
  totalYearsExperience:
    profile?.total_years_experience !== null &&
    profile?.total_years_experience !== undefined
      ? String(profile.total_years_experience)
      : "",
  maritalStatus:
    profile?.marital_status === "single" ||
    profile?.marital_status === "married" ||
    profile?.marital_status === "divorced" ||
    profile?.marital_status === "widowed"
      ? profile.marital_status
      : "",
  resumeUrl: profile?.resume_url ?? "",
  documentUrls: profile?.document_url ?? [],
});

const statusLabel = (status?: string | null) => {
  if (!status) return "Draft";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function CreatorRequestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { showError, showWarning } = useAlert();

  const [form, setForm] = useState<CreatorRequestForm>(() =>
    mapProfileToForm(),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(1);
  const slideTranslateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/home");
        }
        return true;
      },
    );

    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    const loadCreatorProfile = async () => {
      setIsLoading(true);

      try {
        const response = await CreatorService.getMe();
        setForm(mapProfileToForm(response.creator_profile));
        setStatus(response.creator_profile?.verification_status ?? null);
      } catch (error: any) {
        const message =
          error?.data?.message ||
          error?.message ||
          "Failed to load your creator profile.";
        showError("Creator profile", message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCreatorProfile();
  }, [showError]);

  useEffect(() => {
    Animated.timing(slideTranslateX, {
      toValue: -stepIndex * slideWidth,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [slideTranslateX, slideWidth, stepIndex]);

  const isBusy =
    isSaving || isUploadingResume || isUploadingDocument || isLoading;

  const isSubmitDisabled = useMemo(
    () =>
      isBusy ||
      !form.occupation.trim() ||
      !form.bio.trim() ||
      !form.expertAt.trim(),
    [form, isBusy],
  );

  const progress = ((stepIndex + 1) / STEP_COUNT) * 100;
  const normalizedDocumentUrls = form.documentUrls.length
    ? form.documentUrls
    : [""];

  const setField = <K extends keyof CreatorRequestForm>(
    key: K,
    value: CreatorRequestForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setDocumentUrlAt = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      documentUrls:
        prev.documentUrls.length === 0 && index === 0
          ? [value]
          : prev.documentUrls.map((item, itemIndex) =>
              itemIndex === index ? value : item,
            ),
    }));
  };

  const addDocumentField = () => {
    setForm((prev) => ({
      ...prev,
      documentUrls: [...prev.documentUrls, ""],
    }));
  };

  const removeDocumentAt = (index: number) => {
    setForm((prev) => ({
      ...prev,
      documentUrls: prev.documentUrls.filter(
        (_item, itemIndex) => itemIndex !== index,
      ),
    }));
  };

  const validateBeforeSubmit = () => {
    if (!form.occupation.trim() || !form.bio.trim() || !form.expertAt.trim()) {
      showWarning(
        "Missing details",
        "Occupation, bio, and expertise are required before final submission.",
      );
      return false;
    }

    const years = form.totalYearsExperience.trim();
    const numericYears = years ? Number(years) : undefined;

    if (years && Number.isNaN(numericYears)) {
      showWarning(
        "Invalid experience",
        "Total years of experience must be a valid number.",
      );
      return false;
    }

    return true;
  };

  const buildPayload = (mode: SaveMode): CreatorProfilePayload => {
    const years = form.totalYearsExperience.trim();
    const numericYears = years ? Number(years) : undefined;

    return {
      occupation: form.occupation.trim() || undefined,
      religion: form.religion.trim() || undefined,
      bio: form.bio.trim() || undefined,
      expert_at: form.expertAt.trim() || undefined,
      total_years_experience:
        numericYears !== undefined && !Number.isNaN(numericYears)
          ? numericYears
          : undefined,
      marital_status: form.maritalStatus || undefined,
      resume_url: form.resumeUrl.trim() || undefined,
      document_url: form.documentUrls.map((url) => url.trim()).filter(Boolean)
        .length
        ? form.documentUrls.map((url) => url.trim()).filter(Boolean)
        : undefined,
      verification_status: mode === "draft" ? "draft" : "pending",
    };
  };

  const persistProfile = async (mode: SaveMode) => {
    if (mode === "submit" && !validateBeforeSubmit()) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await CreatorService.updateMe(buildPayload(mode));
      const nextStatus =
        response.creator_profile?.verification_status ??
        (mode === "draft" ? "draft" : "pending");

      setStatus(nextStatus);
      setForm(mapProfileToForm(response.creator_profile));

      if (Platform.OS === "android") {
        ToastAndroid.show(
          mode === "draft"
            ? "Draft saved successfully"
            : "Creator profile submitted successfully",
          ToastAndroid.SHORT,
        );
      }

      if (mode === "submit") {
        router.back();
      }
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.message ||
        (mode === "draft"
          ? "Failed to save your draft."
          : "Failed to save your creator request.");
      showError(mode === "draft" ? "Draft failed" : "Save failed", message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (stepIndex < STEP_COUNT - 1) {
      setStepIndex((current) => current + 1);
    }
  };

  const handlePrevious = () => {
    if (stepIndex > 0) {
      setStepIndex((current) => current - 1);
    }
  };

  const stepMeta = [
    {
      eyebrow: "Step 1",
      title: "Tell us what you do best",
      description:
        "Start with the essentials so learners instantly understand your strengths.",
    },
    {
      eyebrow: "Step 2",
      title: "Add proof and supporting files",
      description:
        "Upload your resume and an optional supporting document for verification.",
    },
    {
      eyebrow: "Step 3",
      title: "Round out your profile",
      description:
        "Finish with personal details and a bio that helps learners trust you.",
    },
  ] as const;

  const currentStep = stepMeta[stepIndex];

  return (
    <View className="flex-1 bg-stone-100 dark:bg-neutral-950">
      <LinearGradient
        colors={
          isDark
            ? ["#0F172A", "#111827", "#020617"]
            : ["#FFF9F1", "#F6EEDF", "#EADFCC"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <BackButton
          className="absolute left-4 top-12 z-10"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }

            router.replace("/home");
          }}
        />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: insets.top + 1,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="">
            <View
              className="overflow-hidden rounded-[32px] border px-5 pb-6 pt-16"
              style={{
                backgroundColor: isDark ? "rgba(17, 24, 39, 0.9)" : "#FFFDF8",
                borderColor: isDark ? "rgba(148, 163, 184, 0.2)" : "#E8DCC9",
                marginHorizontal: 10,
              }}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text
                    className="text-xs font-semibold uppercase tracking-[2px]"
                    style={{ color: isDark ? "#C4B5FD" : "#9A3412" }}
                  >
                    Puitu Creator Program
                  </Text>
                  <Text
                    className="mt-3 text-sm leading-6"
                    style={{ color: isDark ? "#CBD5E1" : "#57534E" }}
                  >
                    Submit your form to monitize your channel
                  </Text>
                </View>

                <View
                  className="rounded-2xl px-3 py-2"
                  style={{
                    backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                    borderWidth: 1,
                    borderColor: isDark ? "#334155" : "#E7DBC8",
                  }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: isDark ? "#F8FAFC" : "#111827" }}
                  >
                    {statusLabel(status)}
                  </Text>
                </View>
              </View>
            </View>

            {isLoading ? (
              <View className="mt-6 items-center py-16">
                <ActivityIndicator size="large" color="#C2410C" />
                <Text
                  className="mt-4 text-sm"
                  style={{ color: isDark ? "#A1A1AA" : "#71717A" }}
                >
                  Loading creator profile...
                </Text>
              </View>
            ) : (
              <View
                className="mt-6 rounded-[14px] border p-3 mx-1"
                style={{
                  backgroundColor: isDark
                    ? "rgba(10, 15, 28, 0.92)"
                    : "#FFFDF9",
                  borderColor: isDark ? "#1F2937" : "#E9DECC",
                }}
              >
                <View className="mb-5">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-xs font-semibold uppercase tracking-[2px]"
                      style={{ color: isDark ? "#FCA5A5" : "#B45309" }}
                    >
                      {currentStep.eyebrow}
                    </Text>
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: isDark ? "#94A3B8" : "#78716C" }}
                    >
                      {stepIndex + 1}/{STEP_COUNT}
                    </Text>
                  </View>

                  <View
                    className="mt-3 h-2 overflow-hidden rounded-full"
                    style={{ backgroundColor: isDark ? "#172033" : "#EFE4D5" }}
                  >
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: isDark ? "#F97316" : "#C2410C",
                      }}
                    />
                  </View>

                  <Text
                    className="mt-4 text-2xl font-bold"
                    style={{ color: isDark ? "#FFFFFF" : "#18181B" }}
                  >
                    {currentStep.title}
                  </Text>
                  <Text
                    className="mt-2 text-sm leading-6"
                    style={{ color: isDark ? "#CBD5E1" : "#57534E" }}
                  >
                    {currentStep.description}
                  </Text>
                </View>

                <View
                  className="overflow-hidden"
                  onLayout={(event) => {
                    const width = Math.max(1, event.nativeEvent.layout.width);
                    if (width !== slideWidth) {
                      setSlideWidth(width);
                    }
                  }}
                >
                  <Animated.View
                    style={{
                      flexDirection: "row",
                      width: slideWidth * STEP_COUNT,
                      transform: [{ translateX: slideTranslateX }],
                    }}
                  >
                    <View style={{ width: slideWidth }}>
                      <StepPanel
                        isDark={isDark}
                        accent="warm"
                        icon={
                          <Sparkles
                            size={18}
                            color={isDark ? "#FDBA74" : "#C2410C"}
                          />
                        }
                        title="Professional snapshot"
                        description="These answers shape the first impression learners get."
                      >
                        <InputField
                          label="Occupation"
                          value={form.occupation}
                          onChangeText={(value) =>
                            setField("occupation", value)
                          }
                          placeholder="Graphic designer, educator, exam mentor..."
                          isDark={isDark}
                        />

                        <InputField
                          label="Total experience"
                          value={form.totalYearsExperience}
                          onChangeText={(value) =>
                            setField("totalYearsExperience", value)
                          }
                          placeholder="4"
                          keyboardType="numeric"
                          isDark={isDark}
                          icon={
                            <BadgeCheck
                              size={16}
                              color={isDark ? "#A1A1AA" : "#71717A"}
                            />
                          }
                        />

                        <InputField
                          label="Expertise"
                          value={form.expertAt}
                          onChangeText={(value) => setField("expertAt", value)}
                          placeholder="Brand design, UPSC prep, spoken English..."
                          isDark={isDark}
                          icon={
                            <Sparkles
                              size={16}
                              color={isDark ? "#A1A1AA" : "#71717A"}
                            />
                          }
                        />
                      </StepPanel>
                    </View>

                    <View style={{ width: slideWidth }}>
                      <StepPanel
                        isDark={isDark}
                        accent="rose"
                        icon={
                          <FileText
                            size={18}
                            color={isDark ? "#F9A8D4" : "#BE185D"}
                          />
                        }
                        title="Verification uploads"
                        description="Resume is primary. Supporting document is optional but helpful."
                      >
                        <R2FileUploaderField
                          label="Resume"
                          value={form.resumeUrl}
                          onChange={(value) => setField("resumeUrl", value)}
                          isDark={isDark}
                          folder="creator/resumes"
                          forceMultipart
                          buttonLabel="Upload resume"
                          placeholder="https://example.com/resume"
                          helperText="Upload PDF, DOC, DOCX, image or any other file."
                          onUploadStateChange={setIsUploadingResume}
                          onUploadError={(message) => {
                            showError("Resume upload failed", message);
                          }}
                        />

                        {normalizedDocumentUrls.map((documentUrl, index) => (
                          <View key={`document-${index}`}>
                            <View className="flex-row items-center justify-between">
                              <View>
                                <Text
                                  className="text-sm font-semibold"
                                  style={{
                                    color: isDark ? "#F8FAFC" : "#1C1917",
                                  }}
                                >
                                  Supporting document {index + 1}
                                </Text>
                              </View>

                              {normalizedDocumentUrls.length > 1 ? (
                                <TouchableOpacity
                                  activeOpacity={0.85}
                                  onPress={() => removeDocumentAt(index)}
                                  className="rounded-2xl border px-3 py-2"
                                  style={{
                                    backgroundColor: isDark
                                      ? "#1E293B"
                                      : "#FFFFFF",
                                    borderColor: isDark ? "#334155" : "#E7E0D5",
                                  }}
                                >
                                  <View className="flex-row items-center">
                                    <Trash2
                                      size={14}
                                      color={isDark ? "#FCA5A5" : "#B91C1C"}
                                    />
                                    <Text
                                      className="ml-2 text-xs font-semibold"
                                      style={{
                                        color: isDark ? "#FCA5A5" : "#B91C1C",
                                      }}
                                    >
                                      Remove
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              ) : null}
                            </View>

                            <R2FileUploaderField
                              label={``}
                              value={documentUrl}
                              onChange={(value) =>
                                setDocumentUrlAt(index, value)
                              }
                              isDark={isDark}
                              folder="creator/documents"
                              forceMultipart
                              buttonLabel="Upload document"
                              placeholder="https://example.com/document"
                              helperText="Optional: upload one or more supporting files."
                              onUploadStateChange={setIsUploadingDocument}
                              onUploadError={(message) => {
                                showError("Document upload failed", message);
                              }}
                            />
                          </View>
                        ))}

                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={addDocumentField}
                          disabled={isBusy}
                          className="mb-1 rounded-[20px] border border-dashed px-4 py-4"
                          style={{
                            backgroundColor: isDark ? "#101826" : "#FFF8EE",
                            borderColor: isDark ? "#314158" : "#D9C7AE",
                            opacity: isBusy ? 0.6 : 1,
                          }}
                        >
                          <View className="flex-row items-center justify-center">
                            <CirclePlus
                              size={16}
                              color={isDark ? "#FDBA74" : "#C2410C"}
                            />
                            <Text
                              className="ml-2 text-sm font-semibold"
                              style={{
                                color: isDark ? "#FDBA74" : "#C2410C",
                              }}
                            >
                              Add another document
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </StepPanel>
                    </View>

                    <View style={{ width: slideWidth }}>
                      <StepPanel
                        isDark={isDark}
                        accent="cool"
                        icon={
                          <FileBadge2
                            size={18}
                            color={isDark ? "#93C5FD" : "#1D4ED8"}
                          />
                        }
                        title="Personal details"
                        description="Wrap up with context that makes your profile feel complete."
                      >
                        <InputField
                          label="Religion"
                          value={form.religion}
                          onChangeText={(value) => setField("religion", value)}
                          placeholder="Optional"
                          isDark={isDark}
                        />

                        <View className="mb-5">
                          <Text
                            className="mb-3 text-sm font-semibold"
                            style={{ color: isDark ? "#F4F4F5" : "#18181B" }}
                          >
                            Marital status
                          </Text>
                          <View className="flex-row flex-wrap">
                            {maritalStatuses.map((item) => {
                              const selected = form.maritalStatus === item;
                              return (
                                <TouchableOpacity
                                  key={item}
                                  activeOpacity={0.85}
                                  onPress={() =>
                                    setField(
                                      "maritalStatus",
                                      selected ? "" : item,
                                    )
                                  }
                                  className="mb-2 mr-2 rounded-2xl border px-4 py-3"
                                  style={{
                                    backgroundColor: selected
                                      ? isDark
                                        ? "#F4F4F5"
                                        : "#111111"
                                      : isDark
                                        ? "#18181B"
                                        : "#F8F5F0",
                                    borderColor: selected
                                      ? isDark
                                        ? "#F4F4F5"
                                        : "#111111"
                                      : isDark
                                        ? "#2A2A2E"
                                        : "#E7E0D5",
                                  }}
                                >
                                  <Text
                                    className="text-sm font-medium capitalize"
                                    style={{
                                      color: selected
                                        ? isDark
                                          ? "#111111"
                                          : "#FFFFFF"
                                        : isDark
                                          ? "#E4E4E7"
                                          : "#3F3F46",
                                    }}
                                  >
                                    {item}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>

                        <InputField
                          label="Bio"
                          value={form.bio}
                          onChangeText={(value) => setField("bio", value)}
                          placeholder="Tell learners about your teaching style, background, and what you can help with."
                          multiline
                          numberOfLines={6}
                          isDark={isDark}
                        />
                      </StepPanel>
                    </View>
                  </Animated.View>
                </View>
              </View>
            )}
            <View className="mt-6 px-5 flex-row items-center justify-between">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  void persistProfile("draft");
                }}
                disabled={isBusy}
                className="rounded-[20px] border px-4 py-3"
                style={{
                  backgroundColor: isDark ? "#141C2B" : "#F6EEDF",
                  borderColor: isDark ? "#25324A" : "#E4D5BF",
                  opacity: isBusy ? 0.6 : 1,
                }}
              >
                <View className="flex-row items-center">
                  <Save size={16} color={isDark ? "#E2E8F0" : "#7C2D12"} />
                  <Text
                    className="ml-2 text-sm font-semibold"
                    style={{ color: isDark ? "#E2E8F0" : "#7C2D12" }}
                  >
                    {isSaving ? "Saving..." : "draft"}
                  </Text>
                </View>
              </TouchableOpacity>

              <View className="flex-row items-center">
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={handlePrevious}
                  disabled={stepIndex === 0 || isBusy}
                  className="mr-3 rounded-[20px] border px-4 py-3"
                  style={{
                    backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                    borderColor: isDark ? "#243041" : "#E5DDD2",
                    opacity: stepIndex === 0 || isBusy ? 0.5 : 1,
                  }}
                >
                  <View className="flex-row items-center">
                    <ChevronLeft
                      size={16}
                      color={isDark ? "#E2E8F0" : "#111827"}
                    />
                    <Text
                      className="ml-1 text-sm font-semibold"
                      style={{ color: isDark ? "#E2E8F0" : "#111827" }}
                    >
                      Previous
                    </Text>
                  </View>
                </TouchableOpacity>

                {stepIndex < STEP_COUNT - 1 ? (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleNext}
                    disabled={isBusy}
                    className="rounded-[20px] px-5 py-3"
                    style={{
                      backgroundColor: isDark ? "#F97316" : "#111827",
                      opacity: isBusy ? 0.6 : 1,
                    }}
                  >
                    <View className="flex-row items-center">
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: "#FFFFFF" }}
                      >
                        Next
                      </Text>
                      <ChevronRight size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      void persistProfile("submit");
                    }}
                    disabled={isSubmitDisabled}
                    className="rounded-[20px] px-5 py-3"
                    style={{
                      backgroundColor: isSubmitDisabled
                        ? isDark
                          ? "#273449"
                          : "#D6D3D1"
                        : isDark
                          ? "#F97316"
                          : "#111827",
                    }}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{
                        color: isSubmitDisabled
                          ? isDark
                            ? "#94A3B8"
                            : "#78716C"
                          : "#FFFFFF",
                      }}
                    >
                      {isUploadingResume || isUploadingDocument
                        ? "Uploading files..."
                        : isSaving
                          ? "Submitting..."
                          : "Submit profile"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

type StepPanelProps = {
  isDark: boolean;
  title: string;
  description: string;
  accent: "warm" | "rose" | "cool";
  icon: React.ReactNode;
  children: React.ReactNode;
};

function StepPanel({
  isDark,
  title,
  description,
  accent,
  icon,
  children,
}: StepPanelProps) {
  const accentBackground =
    accent === "warm"
      ? isDark
        ? "#1C1917"
        : "#FFF2E2"
      : accent === "rose"
        ? isDark
          ? "#241321"
          : "#FFF0F6"
        : isDark
          ? "#101A2E"
          : "#EEF4FF";

  const accentBorder =
    accent === "warm"
      ? isDark
        ? "#7C2D12"
        : "#F1C793"
      : accent === "rose"
        ? isDark
          ? "#9D174D"
          : "#F6B1CF"
        : isDark
          ? "#1D4ED8"
          : "#B8CCF9";

  return (
    <View>
      <View
        className="mb-5 rounded-[24px] border px-4 py-4"
        style={{
          backgroundColor: accentBackground,
          borderColor: accentBorder,
        }}
      >
        <View className="flex-row items-center">
          <View
            className="rounded-2xl p-3"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
            }}
          >
            {icon}
          </View>
          <View className="ml-3 flex-1">
            <Text
              className="text-lg font-bold"
              style={{ color: isDark ? "#FFFFFF" : "#18181B" }}
            >
              {title}
            </Text>
            <Text
              className="mt-1 text-sm leading-5"
              style={{ color: isDark ? "#CBD5E1" : "#57534E" }}
            >
              {description}
            </Text>
          </View>
        </View>
      </View>

      {children}
    </View>
  );
}

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  isDark: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default" | "numeric" | "url";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  icon?: React.ReactNode;
};

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  isDark,
  multiline = false,
  numberOfLines,
  keyboardType = "default",
  autoCapitalize = "sentences",
  icon,
}: InputFieldProps) {
  return (
    <View className="mb-5">
      <Text
        className="mb-3 text-sm font-semibold"
        style={{ color: isDark ? "#F4F4F5" : "#18181B" }}
      >
        {label}
      </Text>

      <View
        className={`rounded-sm border px-4 ${multiline ? "py-4" : "py-1"}`}
        style={{
          backgroundColor: isDark ? "#18181B" : "#FAF8F5",
          borderColor: isDark ? "#2A2A2E" : "#E7E0D5",
        }}
      >
        <View className="flex-row items-center">
          {icon ? <View className="mr-2">{icon}</View> : null}
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={isDark ? "#71717A" : "#A1A1AA"}
            className={`flex-1 text-[15px] ${multiline ? "min-h-[120px]" : "h-12"}`}
            style={{
              color: isDark ? "#FFFFFF" : "#111827",
              textAlignVertical: multiline ? "top" : "center",
            }}
            multiline={multiline}
            numberOfLines={numberOfLines}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
          />
        </View>
      </View>
    </View>
  );
}
