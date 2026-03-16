import { BackButton } from "@/components/ui/back-button";
import { AuthService } from "@/lib/services/auth-service";
import { FCMService } from "@/lib/services/fcm-service";
import {
  hasCompletedProfileOnboarding,
  resolveOnboardingIdentity,
} from "@/lib/utils/onboarding-status";
import { saveAuthUserToStore } from "@/lib/utils/auth-user-store";
import { useAlert } from "@/providers/alert-provider";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { getAuth } from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import { Phone, RefreshCw } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

const RESEND_TIMER_SECONDS = 25;

export default function PhoneLoginScreen() {
  const alert = useAlert();
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [confirm, setConfirm] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const sendCodeInFlightRef = useRef(false);
  const verifyCodeInFlightRef = useRef(false);

  const routeAfterLogin = useCallback(
    async (params: {
      uid?: string | null;
      email?: string | null;
      phone?: string | null;
      fallbackNextStep?: string;
    }) => {
      const identity = resolveOnboardingIdentity({
        uid: params.uid,
        email: params.email,
        phone: params.phone,
      });
      const completed = await hasCompletedProfileOnboarding(identity);

      if (completed) {
        router.replace("/home");
        return;
      }

      if (params.fallbackNextStep) {
        router.replace(`/${params.fallbackNextStep}` as any);
        return;
      }

      router.replace("/onboarding");
    },
    [router],
  );

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Cross-platform toast helper
  const showToast = (message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // If you have a cross-platform toast library, use it here
      // Fallback to alert for iOS if no toast library exists
      console.log(message);
    }
  };

  // Handle Sending SMS
  const signInWithPhoneNumber = async () => {
    if (sendCodeInFlightRef.current || loading) return;

    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return alert.showError(
        "Invalid Phone",
        "Please enter a 10-digit phone number.",
      );
    }

    sendCodeInFlightRef.current = true;
    setLoading(true);
    try {
      const confirmation = await AuthService.signInWithPhoneNumber(
        `+91${cleanPhone}`,
      );
      setConfirm(confirmation);
      setTimer(RESEND_TIMER_SECONDS);
      showToast("Verification code sent!");
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      sendCodeInFlightRef.current = false;
      setLoading(false);
    }
  };

  // Handle Verifying OTP
  const confirmCode = useCallback(
    async (otpValue?: string) => {
      const codeToVerify = otpValue || code;
      if (
        !confirm ||
        codeToVerify.length !== 6 ||
        verifyCodeInFlightRef.current ||
        loading
      ) {
        return;
      }

      verifyCodeInFlightRef.current = true;
      setLoading(true);
      try {
        const data: any = await AuthService.confirmPhoneCode(
          confirm,
          codeToVerify,
        );
        await FCMService.handleLoginSuccess();
        await saveAuthUserToStore(
          {
            id: data?.user?.id ?? getAuth().currentUser?.uid ?? null,
            name: data?.user?.name ?? null,
            email: data?.user?.email ?? null,
            phone: data?.user?.phone ?? phoneNumber.replace(/\D/g, ""),
            profile_image: data?.user?.profile_image ?? data?.user?.image ?? null,
            country: data?.user?.country ?? null,
            state: data?.user?.state ?? null,
            district: data?.user?.district ?? null,
            town: data?.user?.town ?? null,
            is_active: data?.user?.is_active ?? true,
          },
          "phone",
        );
        showToast("Signed in successfully");
        await routeAfterLogin({
          uid: getAuth().currentUser?.uid,
          email: data?.user?.email ?? null,
          phone: data?.user?.phone ?? phoneNumber.replace(/\D/g, ""),
          fallbackNextStep: data?.next_step ?? "onboarding",
        });
      } catch (error: any) {
        if (error.code === "auth/invalid-verification-code") {
          alert.showError("Invalid Code", "The OTP you entered is incorrect.");
        } else {
          alert.showError("Authentication Failed", error.message);
        }
        setCode(""); // Clear code on failure
      } finally {
        verifyCodeInFlightRef.current = false;
        setLoading(false);
      }
    },
    [confirm, code, routeAfterLogin, phoneNumber, loading],
  );

  // Auto-submit when 6 digits are reached
  useEffect(() => {
    if (code.length === 6) {
      confirmCode();
    }
  }, [code, confirmCode]);

  const handleAuthError = (error: any) => {
    console.error("Auth Error Code:", error.code);
    switch (error.code) {
      case "auth/too-many-requests":
        alert.showError(
          "Blocked",
          "Too many attempts. Please try again later.",
        );
        break;
      case "auth/invalid-phone-number":
        alert.showError(
          "Invalid Number",
          "The phone number entered is not valid.",
        );
        break;
      case "auth/captcha-check-failed":
        alert.showError(
          "Security Error",
          "Captcha verification failed. Please check your network.",
        );
        break;
      default:
        alert.showError("Error", error.message || "Something went wrong");
    }
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 10);
    let formatted = cleaned;
    if (cleaned.length > 6) {
      formatted = `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    } else if (cleaned.length > 0) {
      formatted = cleaned;
    }
    setPhoneNumber(formatted);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-secondary-50 dark:bg-background-ddark"
    >
      <BackButton className="absolute top-12 left-6 z-20" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingVertical: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="h-64 rounded-b-3xl px-8 pt-12 pb-8 mt-4 mb-6">
          <View className="flex-col justify-center items-center mb-6">
            <Image
              source={require("../../../assets/logo/logo_w.png")}
              className="w-28 h-28 mb-2"
              resizeMode="contain"
            />
            <Text className="text-secondary-700 dark:text-white text-3xl font-bold mb-2 text-center">
              {!confirm ? "Phone Verification" : "Verify OTP"}
            </Text>
            <Text className="text-secondary-500 dark:text-secondary-300 text-center px-10">
              {!confirm
                ? "We'll send a 6-digit verification code to your number"
                : `Enter the code sent to +91 ${phoneNumber}`}
            </Text>
          </View>
        </View>

        <View className="px-6">
          <View className="rounded-3xl p-6">
            {!confirm ? (
              <View className="gap-y-6">
                <View>
                  <Text className="text-sm font-semibold text-secondary-600 dark:text-secondary-300 mb-2 ml-1">
                    Phone Number
                  </Text>
                  <View
                    className={`flex-row items-center bg-secondary-150 dark:bg-secondary-700 rounded-2xl px-4 border-2 transition-colors ${
                      focusedInput === "phone"
                        ? "border-primary-500"
                        : "border-transparent"
                    }`}
                  >
                    <View className="mr-3">
                      <Phone
                        color={
                          focusedInput === "phone"
                            ? "#7A25FF"
                            : colorScheme === "dark"
                              ? "white"
                              : "black"
                        }
                        size={22}
                      />
                    </View>
                    <Text className="text-base text-secondary-900 dark:text-white mr-2 font-medium">
                      +91
                    </Text>
                    <TextInput
                      placeholder="98765 43210"
                      className="flex-1 py-4 text-base text-secondary-900 dark:text-white"
                      placeholderTextColor="#A3A3A3"
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={formatPhoneNumber}
                      maxLength={11}
                      onFocus={() => setFocusedInput("phone")}
                      onBlur={() => setFocusedInput(null)}
                      editable={!loading}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={signInWithPhoneNumber}
                  disabled={
                    loading || phoneNumber.replace(/\D/g, "").length < 10
                  }
                  className={`bg-primary-500 active:bg-primary-600 h-14 rounded-2xl flex-row items-center justify-center border-2 transition-colors ${
                    pressedButton === "send"
                      ? "border-primary-700"
                      : "border-transparent"
                  } ${loading || phoneNumber.replace(/\D/g, "").length < 10 ? "opacity-60" : ""}`}
                  onPressIn={() => setPressedButton("send")}
                  onPressOut={() => setPressedButton(null)}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-lg font-bold">
                      Send Code
                    </Text>
                  )}
                </TouchableOpacity>

                <View className="flex-row items-center">
                  <View className="flex-1 h-[1px] bg-secondary-200 dark:bg-secondary-700" />
                  <Text className="mx-4 text-secondary-400">Or</Text>
                  <View className="flex-1 h-[1px] bg-secondary-200 dark:bg-secondary-700" />
                </View>

                {/* Alternative Methods */}
                <View className="pt-0">
                  <TouchableOpacity
                    onPress={() => router.back()}
                    disabled={loading}
                    className={`flex-1 flex-row items-center justify-center bg-secondary-150 dark:bg-secondary-700 py-4 rounded-2xl border-2 transition-colors ${
                      pressedButton === "back"
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        : "border-transparent"
                    } ${loading ? "opacity-70" : ""}`}
                    onPressIn={() => setPressedButton("back")}
                    onPressOut={() => setPressedButton(null)}
                    accessibilityLabel="Back to email login"
                    accessibilityRole="button"
                  >
                    <Text
                      className={`text-secondary-800 dark:text-white font-semibold text-base ${
                        pressedButton === "back"
                          ? "text-primary-600 dark:text-primary-400"
                          : ""
                      }`}
                    >
                      Back to Email Login
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="gap-y-6">
                <View>
                  <View className="flex-row justify-between mb-4">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <View
                        key={index}
                        className={`w-[14%] h-14 rounded-xl border-2 items-center justify-center ${
                          code.length === index
                            ? "border-primary-500 bg-white dark:bg-secondary-900"
                            : code[index]
                              ? "border-primary-300 bg-primary-50 dark:bg-primary-900/20"
                              : "border-border dark:border-border-dark bg-background-card dark:bg-secondary-900"
                        }`}
                      >
                        <Text className="text-xl font-bold text-secondary-900 dark:text-white">
                          {code[index] || ""}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <TextInput
                    className="absolute w-full h-14 opacity-0"
                    value={code}
                    onChangeText={(text) =>
                      setCode(text.replace(/[^0-9]/g, ""))
                    }
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>

                <View className="flex-row justify-between items-center">
                  <TouchableOpacity
                    onPress={signInWithPhoneNumber}
                    disabled={loading || timer > 0}
                    className={`flex-row items-center p-2 rounded-xl transition-colors ${
                      pressedButton === "resend"
                        ? "bg-primary-50 dark:bg-primary-900/20"
                        : ""
                    }`}
                    onPressIn={() => setPressedButton("resend")}
                    onPressOut={() => setPressedButton(null)}
                  >
                    <RefreshCw
                      size={16}
                      color={
                        pressedButton === "resend" && timer === 0
                          ? "#7A25FF"
                          : timer > 0
                            ? "#A3A3A3"
                            : "#7A25FF"
                      }
                    />
                    <Text
                      className={`ml-2 font-semibold ${
                        pressedButton === "resend" && timer === 0
                          ? "text-primary-700"
                          : timer > 0
                            ? "text-secondary-400"
                            : "text-primary-600"
                      }`}
                    >
                      {timer > 0 ? `Resend in ${timer}s` : "Resend Code"}
                    </Text>
                  </TouchableOpacity>

                  {timer > 0 && (
                    <Text className="text-xs text-secondary-400">
                      Code valid for 10m
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => confirmCode()}
                  disabled={loading || code.length !== 6}
                  className={`bg-primary-500 active:bg-primary-600 h-14 rounded-2xl flex-row items-center justify-center border-2 transition-colors ${
                    pressedButton === "verify"
                      ? "border-primary-700"
                      : "border-transparent"
                  } ${loading || code.length !== 6 ? "opacity-60" : ""}`}
                  onPressIn={() => setPressedButton("verify")}
                  onPressOut={() => setPressedButton(null)}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-lg font-bold">
                      Verify & Login
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setConfirm(null);
                    setCode("");
                    setTimer(0);
                  }}
                  className={`py-2 rounded-xl transition-colors ${
                    pressedButton === "edit"
                      ? "bg-primary-50 dark:bg-primary-900/20"
                      : ""
                  }`}
                  onPressIn={() => setPressedButton("edit")}
                  onPressOut={() => setPressedButton(null)}
                >
                  <Text className="text-center text-secondary-500 dark:text-secondary-400">
                    Entered wrong number?{" "}
                    <Text
                      className={`font-bold ${
                        pressedButton === "edit"
                          ? "text-primary-700 dark:text-primary-300"
                          : "text-primary-600 dark:text-primary-400"
                      }`}
                    >
                      Edit
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text className="text-center text-xs text-secondary-400 dark:text-secondary-500 mt-8 px-6">
            By continuing, you agree to our{" "}
            <Text className="text-secondary-700 dark:text-secondary-300 underline">
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text className="text-secondary-700 dark:text-secondary-300 underline">
              Privacy Policy
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
