import QualificationModal from "@/components/modal/qualification-modal";
import { useSound } from "@/hook/use-sound";
import { UserPayload, UserService } from "@/lib/services/user-service";
import {
  markProfileOnboardingCompleted,
  resolveOnboardingIdentity,
} from "@/lib/utils/onboarding-status";
import { saveAuthUserToStore } from "@/lib/utils/auth-user-store";
import { useAlert } from "@/providers/alert-provider";
import { getAuth } from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Volume2, VolumeX } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Secure store keys (should match the ones used in auth screen)
const SECURE_KEYS = {
  AUTH_EMAIL: "auth_email",
  AUTH_PHONE: "auth_phone",
  AUTH_NAME: "auth_name",
  AUTH_IMAGE: "auth_image",
  AUTH_PROVIDER: "auth_provider",
} as const;

const DATA = [
  {
    id: "1",
    title: "What is your name?",
    subtitle: "We'd love to know what to call you.",
    bgColor: "#6366f1",
    image: require("../../assets/images/google_logo.png"),
    placeholder: "e.g. Alex Henderson",
    field: "name" as const,
    keyboardType: "default",
  },
  {
    id: "2",
    title: "What's your email?",
    subtitle: "We'll send you updates and notifications.",
    bgColor: "#8b5cf6",
    image: require("../../assets/images/google_logo.png"),
    placeholder: "e.g. alex@example.com",
    field: "email" as const,
    keyboardType: "email-address",
  },
  {
    id: "3",
    title: "Your phone number?",
    subtitle: "For important updates and verification.",
    bgColor: "#ec4899",
    image: require("../../assets/images/google_logo.png"),
    placeholder: "e.g. +1 234 567 8900",
    field: "phone" as const,
    keyboardType: "phone-pad",
  },
  {
    id: "4",
    title: "Where are you located? (Country)",
    subtitle: "This helps us find events near you.",
    bgColor: "#2dd4bf",
    image: require("../../assets/images/google_logo.png"),
    placeholder: "e.g. United States",
    field: "country" as const,
    keyboardType: "default",
  },
  {
    id: "5",
    title: "Which state do you live in?",
    subtitle: "To find local events and communities.",
    bgColor: "#f59e0b",
    image: require("../../assets/images/google_logo.png"),
    placeholder: "e.g. California",
    field: "state" as const,
    keyboardType: "default",
  },
  {
    id: "6",
    title: "Your district?",
    subtitle: "For more precise local recommendations.",
    bgColor: "#10b981",
    image: require("../../assets/images/google_logo.png"),
    placeholder: "e.g. San Francisco County",
    field: "district" as const,
    keyboardType: "default",
  },
  {
    id: "7",
    title: "Your town/city?",
    subtitle: "Last step for your location!",
    bgColor: "#fb7185",
    image: require("../../assets/images/google_logo.png"),
    placeholder: "e.g. San Francisco",
    field: "town" as const,
    keyboardType: "default",
  },
  {
    id: "8",
    title: "What are your qualifications?",
    subtitle: "Select your qualifications (you can choose multiple)",
    bgColor: "#a855f7",
    image: require("../../assets/images/google_logo.png"),
    placeholder: "Search qualifications...",
    field: "qualifications" as const,
    keyboardType: "default",
    isQualification: true,
  },
];

type FormData = {
  name: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  district: string;
  town: string;
  qualifications: number[];
};

// OnboardingItem component
const OnboardingItem = ({
  item,
  index,
  translateX,
  value,
  onChangeText,
  onQualificationPress,
  selectedQualificationIds,
}: {
  item: (typeof DATA)[0];
  index: number;
  translateX: SharedValue<number>;
  value: string | number[];
  onChangeText: (text: string) => void;
  onQualificationPress?: () => void;
  selectedQualificationIds?: number[];
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    return {
      opacity: interpolate(translateX.value, inputRange, [0, 1, 0]),
      transform: [
        {
          translateY: interpolate(translateX.value, inputRange, [50, 0, 50]),
        },
      ],
    };
  });

  return (
    <View style={styles.page}>
      <Animated.View style={[styles.contentContainer, animatedStyle]}>
        <View style={styles.imageWrapper}>
          <View style={styles.imageCircle}>
            <Image source={item.image} style={styles.personImg} />
          </View>
        </View>

        <View style={styles.textSection}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>

        <View style={styles.inputContainer}>
          {item.isQualification ? (
            <TouchableOpacity
              style={styles.qualificationSelector}
              onPress={onQualificationPress}
            >
              <Text style={styles.qualificationSelectorText}>
                {selectedQualificationIds && selectedQualificationIds.length > 0
                  ? `${selectedQualificationIds.length} qualifications selected`
                  : "Tap to select qualifications"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TextInput
              placeholder={item.placeholder}
              placeholderTextColor="rgba(255,255,255,0.6)"
              style={styles.textInput}
              selectionColor="#fff"
              value={value as string}
              onChangeText={onChangeText}
              keyboardType={item.keyboardType as any}
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const PaginationDot = ({
  index,
  translateX,
}: {
  index: number;
  translateX: SharedValue<number>;
}) => {
  const dotStyle = useAnimatedStyle(() => {
    const dotWidth = interpolate(
      translateX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [8, 20, 8],
      "clamp",
    );
    const opacity = interpolate(
      translateX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0.4, 1, 0.4],
      "clamp",
    );
    return { width: dotWidth, opacity };
  });

  return <Animated.View style={[styles.dot, dotStyle]} />;
};

const OnboardingScreen = () => {
  const alert = useAlert();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(0);
  const flatListRef = useRef<Animated.FlatList<any>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showQualificationModal, setShowQualificationModal] = useState(false);

  const {
    playClick,
    playSwipe,
    playSuccess,
    playError,
    toggleSound,
    isEnabled,
  } = useSound();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    country: "",
    state: "",
    district: "",
    town: "",
    qualifications: [],
  });

  // Load saved data from secure store on mount
  useEffect(() => {
    const loadSavedData = async () => {
      setIsInitialLoading(true);
      try {
        // Retrieve all saved data from secure store
        const [savedEmail, savedPhone, savedName] = await Promise.all([
          SecureStore.getItemAsync(SECURE_KEYS.AUTH_EMAIL),
          SecureStore.getItemAsync(SECURE_KEYS.AUTH_PHONE),
          SecureStore.getItemAsync(SECURE_KEYS.AUTH_NAME),
        ]);

        // Update form data with saved values (only if they exist)
        setFormData((prev) => ({
          ...prev,
          name: savedName || prev.name,
          email: savedEmail || prev.email,
          phone: savedPhone || prev.phone,
        }));

        // Log what was loaded (for debugging)
        console.log("Loaded from secure store:", {
          name: savedName,
          email: savedEmail,
          phone: savedPhone,
        });
      } catch (error) {
        console.error("Error loading data from secure store:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadSavedData();
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      translateX.value = event.contentOffset.x;
    },
    onBeginDrag: () => {
      runOnJS(playSwipe)();
    },
  });

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handleInputChange = (field: keyof FormData, text: string) => {
    setFormData((prev) => ({ ...prev, [field]: text }));
  };

  const handleQualificationSelect = (ids: number[]) => {
    setFormData((prev) => ({ ...prev, qualifications: ids }));
  };

  const handleSkip = () => {
    playClick();
    alert.showWarning(
      "Skip Onboarding",
      "You can complete your profile later. Are you sure you want to skip?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Skip",
          onPress: async () => {
            playClick();
            const identity = resolveOnboardingIdentity({
              uid: getAuth().currentUser?.uid,
              email: formData.email || null,
              phone: formData.phone || null,
            });
            await markProfileOnboardingCompleted(identity);
            router.replace("/home");
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleNext = () => {
    playClick();
    if (currentIndex < DATA.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    playClick();
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      if (currentIndex > 0) {
        handleBack();
        return true;
      }

      alert.showWarning("Exit App", "Do you really want to exit the app?", [
        {
          text: "Cancel",
          onPress: () => null,
          style: "cancel",
        },
        {
          text: "Exit",
          onPress: () => BackHandler.exitApp(),
          style: "destructive",
        },
      ]);
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => subscription.remove();
  }, [currentIndex]);

  const handleSubmit = async () => {
    let response: any;
    // Validate required fields
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.qualifications
    ) {
      playError();
      alert.showWarning(
        "Error",
        "Please fill in your name, email, phone number, and qualifications",
      );
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      playError();
      alert.showWarning("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Create payload
      const payload: UserPayload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        country: formData.country || undefined,
        state: formData.state || undefined,
        district: formData.district || undefined,
        town: formData.town || undefined,
        qualifications:
          formData.qualifications.length > 0
            ? formData.qualifications
            : undefined,
      };

      response = await UserService.updateMe(payload);
      console.log("response:", response);

      if (response !== null) {
        await saveAuthUserToStore(
          {
            id: response?.data?.id ?? getAuth().currentUser?.uid ?? null,
            name: response?.data?.name ?? formData.name,
            email: response?.data?.email ?? formData.email,
            phone: response?.data?.phone ?? formData.phone,
            profile_image: response?.data?.profile_image ?? null,
            country: response?.data?.country ?? formData.country,
            state: response?.data?.state ?? formData.state,
            district: response?.data?.district ?? formData.district,
            town: response?.data?.town ?? formData.town,
            is_active: response?.data?.is_active ?? true,
          },
          "system",
        );

        const identity = resolveOnboardingIdentity({
          uid: getAuth().currentUser?.uid,
          email: formData.email || null,
          phone: formData.phone || null,
        });
        await markProfileOnboardingCompleted(identity);

        playSuccess();
        ToastAndroid.show(
          response.message || "Profile updated successfully",
          ToastAndroid.SHORT,
        );
        router.replace("/home");
      } else {
        playError();
        alert.showError("Error", response?.message || "Something went wrong");
      }
    } catch (err: any) {
      playError();

      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save your profile. Please try again.";

      alert.showError("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const colors = DATA.map((item) => item.bgColor);
    const inputRange = DATA.map((_, i) => i * width);

    return {
      backgroundColor: interpolateColor(translateX.value, inputRange, colors),
    };
  });

  return (
    <Animated.View style={[styles.container, animatedBackgroundStyle]}>
      {isInitialLoading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <View
              style={[
                styles.header,
                {
                  paddingTop: Math.max(insets.top, 12),
                },
              ]}
            >
              <Text style={styles.logo}>Complete Your Profile</Text>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  onPress={() => {
                    playClick();
                    toggleSound();
                  }}
                  style={styles.soundButton}
                >
                  {isEnabled ? (
                    <Volume2 color="#fff" size={18} />
                  ) : (
                    <VolumeX color="#fff" size={18} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSkip}
                  style={styles.skipButton}
                >
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.imageCircleOne} />

            <View style={styles.pagin}>
              <View style={styles.pagination}>
                {DATA.map((_, i) => (
                  <PaginationDot key={i} index={i} translateX={translateX} />
                ))}
              </View>
            </View>

            <Animated.FlatList
              ref={flatListRef}
              data={DATA}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={scrollHandler}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
              scrollEventThrottle={16}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <OnboardingItem
                  item={item}
                  index={index}
                  translateX={translateX}
                  value={
                    item.isQualification
                      ? formData.qualifications
                      : (formData[item.field as keyof FormData] as string)
                  }
                  onChangeText={(text) =>
                    !item.isQualification &&
                    handleInputChange(item.field as keyof FormData, text)
                  }
                  onQualificationPress={
                    item.isQualification
                      ? () => setShowQualificationModal(true)
                      : undefined
                  }
                  selectedQualificationIds={formData.qualifications}
                />
              )}
            />

            <View
              style={[
                styles.footer,
                {
                  paddingBottom: Math.max(insets.bottom, 16),
                },
              ]}
            >
              <TouchableOpacity
                onPress={handleBack}
                style={[styles.navBtn, { opacity: currentIndex === 0 ? 0 : 1 }]}
                disabled={currentIndex === 0}
              >
                <Text style={styles.navBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNext}
                style={styles.primaryBtn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#1A1141" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {currentIndex === DATA.length - 1
                      ? "Get Started"
                      : "Continue"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <QualificationModal
              visible={showQualificationModal}
              onClose={() => setShowQualificationModal(false)}
              onSelect={handleQualificationSelect}
              selectedIds={formData.qualifications}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  soundButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  skipText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  page: {
    width,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  contentContainer: {
    width: "100%",
    alignItems: "center",
    bottom: 20,
  },
  imageWrapper: {
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  imageCircleOne: {
    position: "absolute",
    top: 150,
    alignSelf: "center",
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  imageCircle: {
    width: width * 0.5,
    height: width * 0.5,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  personImg: {
    width: "60%",
    height: "60%",
    resizeMode: "contain",
  },
  textSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 10,
  },
  inputContainer: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  textInput: {
    height: 60,
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  pagin: {
    flexDirection: "row",
    paddingVertical: 20,
    marginTop: 350,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    left: 0,
    right: 0,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginLeft: 6,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 16,
  },
  navBtn: {
    paddingVertical: 15,
  },
  navBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 120,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#1A1141",
    fontSize: 16,
    fontWeight: "700",
  },
  qualificationSelector: {
    height: 60,
    justifyContent: "center",
  },
  qualificationSelectorText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default OnboardingScreen;
