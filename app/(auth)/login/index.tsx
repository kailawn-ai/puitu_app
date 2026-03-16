import { useAuth } from "@/contexts/auth-context";
import { AuthService } from "@/lib/services/auth-service";
import { FCMService } from "@/lib/services/fcm-service";
import {
  hasCompletedProfileOnboarding,
  resolveOnboardingIdentity,
} from "@/lib/utils/onboarding-status";
import { saveAuthUserToStore } from "@/lib/utils/auth-user-store";
import { useAlert } from "@/providers/alert-provider";
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { getAuth } from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Eye, EyeClosed, Lock, Mail, Phone } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useRef, useState } from "react";
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

// Secure store keys
const SECURE_KEYS = {
  AUTH_EMAIL: "auth_email",
  AUTH_PHONE: "auth_phone",
  AUTH_NAME: "auth_name",
  AUTH_IMAGE: "auth_image",
  AUTH_PROVIDER: "auth_provider", // To track which provider was used
} as const;

export default function NativeAuthScreen() {
  const { user, loading: authLoading } = useAuth(); // Renamed to authLoading
  const alert = useAlert();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Renamed to isLoading
  // Add these missing state variables
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const authInFlightRef = useRef(false);

  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const routeAfterLogin = async (params: {
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
  };

  // Helper function to clear existing secure store data
  const clearSecureStore = async () => {
    try {
      await SecureStore.deleteItemAsync(SECURE_KEYS.AUTH_EMAIL);
      await SecureStore.deleteItemAsync(SECURE_KEYS.AUTH_PHONE);
      await SecureStore.deleteItemAsync(SECURE_KEYS.AUTH_NAME);
      await SecureStore.deleteItemAsync(SECURE_KEYS.AUTH_IMAGE);
      await SecureStore.deleteItemAsync(SECURE_KEYS.AUTH_PROVIDER);
    } catch (error) {
      console.error("Error clearing secure store:", error);
    }
  };

  // Helper function to save user data to secure store
  const saveUserDataToSecureStore = async (data: {
    email?: string | null;
    phone?: string | null;
    name?: string | null;
    image?: string | null;
    provider: "email" | "google";
  }) => {
    try {
      // Clear existing data first
      await clearSecureStore();

      // Save new data
      const savePromises = [];

      if (data.email) {
        savePromises.push(
          SecureStore.setItemAsync(SECURE_KEYS.AUTH_EMAIL, data.email),
        );
      }

      if (data.phone) {
        savePromises.push(
          SecureStore.setItemAsync(SECURE_KEYS.AUTH_PHONE, data.phone),
        );
      }

      if (data.name) {
        savePromises.push(
          SecureStore.setItemAsync(SECURE_KEYS.AUTH_NAME, data.name),
        );
      }

      if (data.image) {
        savePromises.push(
          SecureStore.setItemAsync(SECURE_KEYS.AUTH_IMAGE, data.image),
        );
      }

      savePromises.push(
        SecureStore.setItemAsync(SECURE_KEYS.AUTH_PROVIDER, data.provider),
      );

      await Promise.all(savePromises);

      console.log("User data saved to secure store successfully");
    } catch (error) {
      console.error("Error saving to secure store:", error);
    }
  };

  const handleEmailAuth = async () => {
    if (authInFlightRef.current || isLoading) return;

    if (!email || !password) {
      ToastAndroid.show("Fill in all fields", ToastAndroid.SHORT);
      return;
    }

    authInFlightRef.current = true;
    setIsLoading(true);

    try {
      let data: any;

      if (isRegistering) {
        data = await AuthService.registerWithEmail(email, password);
      } else {
        data = await AuthService.loginWithEmail(email, password);
      }

      // Save email data to secure store
      await saveUserDataToSecureStore({
        email: email,
        provider: "email",
        // Email/password auth might return user data including name and phone
        name: data?.user?.name || null,
        phone: data?.user?.phone || null,
        image: data?.user?.image || null,
      });

      const fcmResult = await FCMService.handleLoginSuccess();

      console.log("FCM result after email auth:", fcmResult);

      await saveAuthUserToStore(
        {
          id: data?.user?.id ?? getAuth().currentUser?.uid ?? null,
          name: data?.user?.name ?? null,
          email: data?.user?.email ?? email,
          phone: data?.user?.phone ?? null,
          profile_image: data?.user?.profile_image ?? data?.user?.image ?? null,
          country: data?.user?.country ?? null,
          state: data?.user?.state ?? null,
          district: data?.user?.district ?? null,
          town: data?.user?.town ?? null,
          is_active: data?.user?.is_active ?? true,
        },
        "email",
      );

      ToastAndroid.show("Signed in successfully", ToastAndroid.SHORT);

      await routeAfterLogin({
        uid: getAuth().currentUser?.uid,
        email: data?.user?.email ?? email,
        phone: data?.user?.phone ?? null,
        fallbackNextStep: data?.next_step ?? "onboarding",
      });
    } catch (error: any) {
      alert.showError("Authentication Failed", error.message);
    } finally {
      authInFlightRef.current = false;
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (authInFlightRef.current || isLoading) return;

    authInFlightRef.current = true;
    setIsLoading(true);
    try {
      let backend: any;
      const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;

      if (!webClientId) {
        throw new Error(
          "Google Sign-In is not configured. Missing EXPO_PUBLIC_WEB_CLIENT_ID in build environment.",
        );
      }

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { idToken, user } = response.data;

        // Get all available user data from Google
        const googleUserData = {
          email: user.email,
          name: user.name || null,
          phone: user.phone || null, // Google might not always provide phone
          image: user.photo || null,
          id: user.id || null,
          familyName: user.familyName || null,
          givenName: user.givenName || null,
        };

        if (!idToken) {
          throw new Error(
            "No ID Token found. Ensure webClientId is correct in configure()",
          );
        }

        backend = await AuthService.loginWithGoogle(idToken);

        // Save all available Google user data to secure store
        await saveUserDataToSecureStore({
          email: googleUserData.email,
          name: googleUserData.name,
          phone: googleUserData.phone,
          image: googleUserData.image,
          provider: "google",
        });

        // Optionally, you can also save additional Google-specific data
        // if your SecureStore keys support them
        if (googleUserData.id) {
          await SecureStore.setItemAsync("google_user_id", googleUserData.id);
        }

        await FCMService.handleLoginSuccess();

        await saveAuthUserToStore(
          {
            id: backend?.user?.id ?? getAuth().currentUser?.uid ?? null,
            name: backend?.user?.name ?? googleUserData.name,
            email: backend?.user?.email ?? googleUserData.email,
            phone: backend?.user?.phone ?? googleUserData.phone,
            profile_image:
              backend?.user?.profile_image ?? backend?.user?.image ?? googleUserData.image,
            country: backend?.user?.country ?? null,
            state: backend?.user?.state ?? null,
            district: backend?.user?.district ?? null,
            town: backend?.user?.town ?? null,
            is_active: backend?.user?.is_active ?? true,
          },
          "google",
        );

        ToastAndroid.show(
          `Welcome ${user.name || "User"}!`,
          ToastAndroid.SHORT,
        );
        await routeAfterLogin({
          uid: getAuth().currentUser?.uid,
          email: backend?.user?.email ?? googleUserData.email,
          phone: backend?.user?.phone ?? googleUserData.phone,
          fallbackNextStep: backend?.next_step ?? "onboarding",
        });
      } else if (isCancelledResponse(response)) {
        alert.showWarning("Cancelled", "User cancelled login");
      } else if (isNoSavedCredentialFoundResponse(response)) {
        alert.showError("No Credentials", "No saved credentials found");
      }
    } catch (error: any) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            alert.showWarning("Cancelled", "Login was cancelled.");
            break;
          case statusCodes.IN_PROGRESS:
            alert.showWarning("In Progress", "Sign in is already running.");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            alert.showError(
              "Play Services",
              "Google Play Services not available.",
            );
            break;
          default:
            alert.showError("Google Error", error.message);
        }
      } else {
        alert.showError("Error", error.message);
      }
    } finally {
      authInFlightRef.current = false;
      setIsLoading(false);
    }
  };

  // Helper function to retrieve stored user data (useful for debugging or other screens)
  const getStoredUserData = async () => {
    try {
      const [email, phone, name, image, provider] = await Promise.all([
        SecureStore.getItemAsync(SECURE_KEYS.AUTH_EMAIL),
        SecureStore.getItemAsync(SECURE_KEYS.AUTH_PHONE),
        SecureStore.getItemAsync(SECURE_KEYS.AUTH_NAME),
        SecureStore.getItemAsync(SECURE_KEYS.AUTH_IMAGE),
        SecureStore.getItemAsync(SECURE_KEYS.AUTH_PROVIDER),
      ]);

      return {
        email,
        phone,
        name,
        image,
        provider,
      };
    } catch (error) {
      console.error("Error retrieving from secure store:", error);
      return null;
    }
  };

  // Don't render anything while auth is loading or user is logged in
  if (authLoading || user) {
    return (
      <View className="flex-1 items-center justify-center bg-secondary-100 dark:bg-background-ddark">
        <ActivityIndicator
          size="large"
          color={colorScheme === "dark" ? "#7A25FF" : "#7A25FF"}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-secondary-50 dark:bg-background-ddark"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient Header */}
        <View className="h-64 rounded-b-3xl px-8 pt-12 pb-8 mt-4 mb-6">
          <View className="flex-col justify-center items-center mb-6">
            <Image
              source={require("../../../assets/logo/logo_w.png")}
              className="w-28 h-28 mb-2"
              resizeMode="contain"
            />
            <View className="">
              <Text className="text-secondary-800 dark:text-white text-3xl font-bold">
                {isRegistering ? "Create your account" : "Sign in"}
              </Text>
            </View>
          </View>
        </View>

        {/* Form Container */}
        <View className="px-6">
          <View className="rounded-3xl drop-shadow-lg p-8">
            {/* Input Fields */}
            <View className="gap-y-6 mb-4">
              {/* Email Input */}
              <View>
                <Text className="text-sm font-medium text-secondary-600 dark:text-secondary-300 mb-2 ml-1">
                  Email Address
                </Text>
                <View
                  className={`flex-row items-center bg-secondary-150 dark:bg-secondary-700 rounded-2xl px-4 border-2 transition-colors ${
                    focusedInput === "email"
                      ? "border-primary-500"
                      : "border-transparent"
                  }`}
                >
                  <Mail
                    color={
                      focusedInput === "email"
                        ? "#7A25FF"
                        : colorScheme === "dark"
                          ? "white"
                          : "black"
                    }
                    size={22}
                  />
                  <TextInput
                    placeholder="you@example.com"
                    className="flex-1 py-4 text-base text-secondary-900 dark:text-white"
                    placeholderTextColor="#A3A3A3"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedInput("email")}
                    onBlur={() => setFocusedInput(null)}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-sm font-medium text-secondary-600 dark:text-secondary-300 mb-2 ml-1">
                  Password
                </Text>
                <View
                  className={`flex-row items-center bg-secondary-150 dark:bg-secondary-700 rounded-2xl px-4 border-2 transition-colors ${
                    focusedInput === "password"
                      ? "border-primary-500"
                      : "border-transparent"
                  }`}
                >
                  <Lock
                    color={
                      focusedInput === "password"
                        ? "#7A25FF"
                        : colorScheme === "dark"
                          ? "white"
                          : "black"
                    }
                    size={22}
                  />
                  <TextInput
                    placeholder="••••••••"
                    className="flex-1 py-4 text-base text-secondary-900 dark:text-white"
                    placeholderTextColor="#A3A3A3"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedInput("password")}
                    onBlur={() => setFocusedInput(null)}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="p-2"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <Eye
                        color={
                          focusedInput === "password"
                            ? "#7A25FF"
                            : colorScheme === "dark"
                              ? "white"
                              : "black"
                        }
                        size={22}
                      />
                    ) : (
                      <EyeClosed
                        color={
                          focusedInput === "password"
                            ? "#7A25FF"
                            : colorScheme === "dark"
                              ? "white"
                              : "black"
                        }
                        size={22}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Primary Button */}
              <TouchableOpacity
                onPress={handleEmailAuth}
                disabled={isLoading}
                className={`bg-primary-500 active:bg-primary-600 h-[50px] rounded-2xl shadow-button flex items-center justify-center ${isLoading ? "opacity-70" : ""}`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="large" />
                ) : (
                  <Text className="text-white text-lg font-bold">
                    {isRegistering ? "Create Account" : "Sign In"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Toggle Switch */}
            <TouchableOpacity
              onPress={() => setIsRegistering(!isRegistering)}
              className="mb-4 py-3"
              disabled={isLoading}
            >
              <Text className="text-center text-secondary-500 dark:text-secondary-400">
                {isRegistering ? "Already have an account? " : "New to Puitu? "}
                <Text className="text-primary-600 dark:text-primary-400 font-bold">
                  {isRegistering ? "Sign In" : "Create Account"}
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center mb-4">
              <View className="flex-1 h-[1px] bg-border dark:bg-border-dark" />
              <Text className="mx-4 text-secondary-400 dark:text-secondary-500 font-medium">
                Or continue with
              </Text>
              <View className="flex-1 h-[1px] bg-border dark:bg-border-dark" />
            </View>

            {/* Social Buttons */}
            <View className="flex-row gap-4">
              {/* Google Button */}
              <TouchableOpacity
                onPress={handleGoogleLogin}
                disabled={isLoading}
                className={`flex-1 flex-row items-center justify-center bg-secondary-150 dark:bg-secondary-700 py-4 rounded-2xl border-2 transition-colors ${
                  pressedButton === "google"
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-transparent"
                } ${isLoading ? "opacity-70" : ""}`}
                onPressIn={() => setPressedButton("google")}
                onPressOut={() => setPressedButton(null)}
              >
                <Image
                  source={{ uri: "https://www.google.com/favicon.ico" }}
                  className="w-6 h-6 mr-4"
                />
                <Text
                  className={`text-secondary-800 dark:text-white font-semibold text-base ${
                    pressedButton === "google"
                      ? "text-primary-600 dark:text-primary-400"
                      : ""
                  }`}
                >
                  Google
                </Text>
              </TouchableOpacity>

              {/* Phone Button */}
              <TouchableOpacity
                onPress={() => router.push("/login/phone")}
                className={`flex-1 flex-row items-center justify-center bg-secondary-150 dark:bg-secondary-700 py-4 rounded-2xl border-2 transition-colors ${
                  pressedButton === "phone"
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-transparent"
                } ${isLoading ? "opacity-70" : ""}`}
                disabled={isLoading}
                onPressIn={() => setPressedButton("phone")}
                onPressOut={() => setPressedButton(null)}
              >
                <View className="px-2">
                  <Phone
                    color={
                      pressedButton === "phone"
                        ? "#7A25FF"
                        : colorScheme === "dark"
                          ? "white"
                          : "black"
                    }
                    size={22}
                  />
                </View>
                <Text
                  className={`text-secondary-800 dark:text-white font-semibold text-base ${
                    pressedButton === "phone"
                      ? "text-primary-600 dark:text-primary-400"
                      : ""
                  }`}
                >
                  Phone
                </Text>
              </TouchableOpacity>
            </View>

            {/* Terms */}
            <View className="mt-10 pt-6 border-t border-border dark:border-border-dark">
              <Text className="text-center text-xs text-secondary-400 dark:text-secondary-500">
                By continuing, you agree to our{" "}
                <Text className="text-primary-600 dark:text-primary-400">
                  Terms
                </Text>{" "}
                and{" "}
                <Text className="text-primary-600 dark:text-primary-400">
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
