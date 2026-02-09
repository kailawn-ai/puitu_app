import auth from "@react-native-firebase/auth";
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useRouter } from "expo-router";
import { Eye, EyeClosed, Lock, Mail, Phone } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import {
  Alert,
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

export default function NativeAuthScreen() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const handleEmailAuth = async () => {
    if (!email || !password) return Alert.alert("Error", "Fill in all fields");
    setLoading(true);
    try {
      if (isRegistering) {
        await auth().createUserWithEmailAndPassword(email, password);
      } else {
        await auth().signInWithEmailAndPassword(email, password);
      }
      ToastAndroid.show("Signed in successfully", ToastAndroid.SHORT);
      router.replace("/home");
    } catch (error: any) {
      Alert.alert("Authentication Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { idToken } = response.data;

        if (!idToken) {
          throw new Error(
            "No ID Token found. Ensure webClientId is correct in configure()",
          );
        }

        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        const result = await auth().signInWithCredential(googleCredential);

        ToastAndroid.show(
          `Welcome ${result.user.displayName}!`,
          ToastAndroid.SHORT,
        );
        router.replace("/home");
      } else if (isCancelledResponse(response)) {
        console.log("User cancelled login");
      } else if (isNoSavedCredentialFoundResponse(response)) {
        console.log("No saved credentials found");
      }
    } catch (error: any) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            Alert.alert("Cancelled", "Login was cancelled.");
            break;
          case statusCodes.IN_PROGRESS:
            Alert.alert("In Progress", "Sign in is already running.");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert("Play Services", "Google Play Services not available.");
            break;
          default:
            Alert.alert("Google Error", error.message);
        }
      } else {
        Alert.alert("Error", "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white dark:bg-background-dark"
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
                {isRegistering ? "Create your account " : "Sign in here"}
              </Text>
            </View>
          </View>
        </View>

        {/* Form Container */}
        <View className="px-6 -mt-16">
          <View className="bg-secondary-150 dark:bg-secondary-800 rounded-3xl drop-shadow-lg p-8">
            {/* Input Fields */}
            <View className="gap-y-6 mb-4">
              {/* Email Input */}
              <View>
                <Text className="text-sm font-medium text-secondary-600 dark:text-secondary-300 mb-2 ml-1">
                  Email Address
                </Text>
                <View className="flex-row items-center bg-white dark:bg-secondary-900 rounded-2xl border border-border dark:border-border-dark px-4">
                  <Mail
                    color={colorScheme === "dark" ? "white" : "black"}
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
                  />
                </View>
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-sm font-medium text-secondary-600 dark:text-secondary-300 mb-2 ml-1">
                  Password
                </Text>
                <View className="flex-row items-center bg-white dark:bg-secondary-900 rounded-2xl border border-border dark:border-border-dark px-4">
                  <Lock
                    color={colorScheme === "dark" ? "white" : "black"}
                    size={22}
                  />
                  <TextInput
                    placeholder="••••••••"
                    className="flex-1 py-4 text-base text-secondary-900 dark:text-white"
                    placeholderTextColor="#A3A3A3"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="p-2"
                  >
                    {showPassword ? (
                      <Eye
                        color={colorScheme === "dark" ? "white" : "black"}
                        size={22}
                      />
                    ) : (
                      <EyeClosed
                        color={colorScheme === "dark" ? "white" : "black"}
                        size={22}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Primary Button */}
              <TouchableOpacity
                onPress={handleEmailAuth}
                disabled={loading}
                className={`bg-primary-500 active:bg-primary-600 py-5 rounded-2xl shadow-button ${loading ? "opacity-70" : ""}`}
              >
                {loading ? (
                  <Text className="text-white text-lg font-bold text-center">
                    Processing...
                  </Text>
                ) : (
                  <Text className="text-white text-lg font-bold text-center">
                    {isRegistering ? "Create Account" : "Sign In"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Toggle Switch */}
            <TouchableOpacity
              onPress={() => setIsRegistering(!isRegistering)}
              className="mb-8 py-3"
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
            <View className="gap-y-4">
              {/* Google Button */}
              <TouchableOpacity
                onPress={handleGoogleLogin}
                disabled={loading}
                className={`flex-row items-center justify-center bg-white dark:bg-secondary-900 py-4 rounded-2xl border border-border dark:border-border-dark ${loading ? "opacity-70" : ""}`}
              >
                <Image
                  source={{ uri: "https://www.google.com/favicon.ico" }}
                  className="w-6 h-6 mr-4"
                />
                <Text className="text-secondary-800 dark:text-white font-semibold text-base">
                  Continue with Google
                </Text>
              </TouchableOpacity>

              {/* Phone Button */}
              <TouchableOpacity
                onPress={() => router.push("/login/phone")}
                className="flex-row items-center justify-center bg-white dark:bg-secondary-900 py-4 rounded-2xl border border-border dark:border-border-dark"
              >
                <View className="px-2">
                  <Phone
                    color={colorScheme === "dark" ? "white" : "black"}
                    size={22}
                  />
                </View>
                <Text className="text-secondary-800 dark:text-white font-semibold text-base">
                  Continue with Phone
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
