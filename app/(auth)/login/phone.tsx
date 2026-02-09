import { BackButton } from "@/components/ui/back-button";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import { MessageSquare, Phone } from "lucide-react-native";
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

export default function PhoneLoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [confirm, setConfirm] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  // Handle Sending SMS
  async function signInWithPhoneNumber() {
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10)
      return Alert.alert(
        "Invalid Phone",
        "Please enter a valid 10-digit phone number.",
      );

    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber(
        `+91${cleanPhone}`,
      );
      setConfirm(confirmation);
      ToastAndroid.show(
        "Verification code sent to your phone!",
        ToastAndroid.SHORT,
      );
    } catch (error: any) {
      console.log(error.code);
      if (error.code === "auth/captcha-check-failed") {
        Alert.alert("Error", "Captcha check failed. Check your SHA-1 keys.");
      } else if (error.code === "auth/invalid-phone-number") {
        Alert.alert("Invalid Number", "Please enter a valid phone number.");
      } else {
        Alert.alert("Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle Verifying OTP
  async function confirmCode() {
    if (!confirm) return;
    if (code.length !== 6)
      return Alert.alert("Invalid Code", "Please enter 6-digit code");

    setLoading(true);
    try {
      await confirm.confirm(code);
      router.replace("/(tabs)/home");
    } catch (error) {
      Alert.alert("Invalid Code", "The OTP you entered is incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background dark:bg-background-dark"
    >
      {/* Background Gradient */}
      <View className="absolute top-0 w-full h-[45%] bg-gradient-to-b from-primary-600 via-primary-500 to-primary-400 rounded-b-[40px]" />

      {/* Back Button */}
      <BackButton className="absolute top-12 left-6 z-20" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingVertical: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Content */}
        <View className="items-center mb-8">
          <Image
            source={require("../../../assets/logo/logo_w.png")}
            className="w-28 h-28 mb-4"
            resizeMode="contain"
          />
          <Text className="text-white text-3xl font-bold mb-2">
            {!confirm ? "Phone Verification" : "Enter OTP"}
          </Text>
          <Text className="text-text dark:text-white text-center px-8">
            {!confirm
              ? "Enter your phone number to receive a verification code"
              : "Enter the 6-digit code sent to your phone"}
          </Text>
        </View>

        {/* Form Container */}
        <View className="px-6">
          <View className="bg-secondary-150 dark:bg-secondary-800 rounded-3xl p-8">
            {!confirm ? (
              // Phone Number Input
              <View className="gap-y-6">
                <View>
                  <Text className="text-sm font-medium text-secondary-600 dark:text-secondary-300 mb-2 ml-1">
                    Phone Number
                  </Text>
                  <View className="flex-row items-center bg-background dark:bg-secondary-900 rounded-2xl border border-border dark:border-border-dark px-4">
                    <View className="mr-3">
                      <Phone
                        color={colorScheme === "dark" ? "#A3A3A3" : "#737373"}
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
                      onChangeText={(text) => {
                        // Auto-format phone number
                        const cleaned = text.replace(/\D/g, "");
                        const truncated = cleaned.slice(0, 10);
                        let formatted = truncated;
                        if (truncated.length > 6) {
                          formatted = `${truncated.slice(0, 3)} ${truncated.slice(3, 6)} ${truncated.slice(6)}`;
                        } else if (truncated.length > 3) {
                          formatted = `${truncated.slice(0, 3)} ${truncated.slice(3)}`;
                        }
                        setPhoneNumber(formatted);
                      }}
                      autoFocus
                      maxLength={12} // 999 999 9999
                    />
                  </View>
                  <Text className="text-xs text-secondary-400 dark:text-secondary-500 mt-2 ml-1">
                    Include country code (e.g., +91 for India)
                  </Text>
                </View>

                {/* Send Code Button */}
                <TouchableOpacity
                  onPress={signInWithPhoneNumber}
                  disabled={loading || phoneNumber.length < 10}
                  className={`bg-primary-500 active:bg-primary-600 py-5 rounded-2xl shadow-button ${loading || phoneNumber.length < 10 ? "opacity-70" : ""}`}
                >
                  {loading ? (
                    <Text className="text-background text-lg font-bold text-center">
                      Sending Code...
                    </Text>
                  ) : (
                    <Text className="text-background text-lg font-bold text-center">
                      Send Verification Code
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Alternative Methods */}
                <View className="mt-4 pt-4 border-t border-border dark:border-border-dark">
                  <Text className="text-center text-secondary-500 dark:text-secondary-400 mb-3">
                    Or use another method
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center justify-center bg-background dark:bg-secondary-900 py-3 rounded-2xl border border-border dark:border-border-dark"
                  >
                    <Text className="text-secondary-800 dark:text-white font-semibold text-base">
                      Back to Email Login
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // OTP Verification
              <View className="gap-y-6">
                <View>
                  <Text className="text-sm font-medium text-secondary-600 dark:text-secondary-300 mb-2 ml-1">
                    6-Digit Verification Code
                  </Text>
                  <View className="relative mb-2">
                    <View className="flex-row justify-between gap-x-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <View
                          key={index}
                          className={`flex-1 h-14 rounded-xl border-2 items-center justify-center ${
                            code.length === index
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : code.length > index
                                ? "border-primary-500 bg-white dark:bg-secondary-900"
                                : "border-border dark:border-border-dark bg-background-card dark:bg-secondary-900"
                          }`}
                        >
                          <Text className="text-xl font-bold text-secondary-900 dark:text-white">
                            {code[index]}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <TextInput
                      className="absolute w-full h-full opacity-0"
                      value={code}
                      onChangeText={(text) => {
                        if (text.length <= 6)
                          setCode(text.replace(/[^0-9]/g, ""));
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                      caretHidden
                    />
                  </View>
                  <Text className="text-xs text-secondary-400 dark:text-secondary-500 mt-2 ml-1">
                    Enter the 6-digit code sent to +91 {phoneNumber}
                  </Text>
                </View>

                {/* OTP Timer and Resend */}
                <View className="flex-row justify-between items-center mb-4">
                  <TouchableOpacity
                    onPress={signInWithPhoneNumber}
                    disabled={loading}
                    className="flex-row items-center"
                  >
                    <MessageSquare size={16} color="#7A25FF" className="mr-2" />
                    <Text className="text-primary-600 dark:text-primary-400 font-medium">
                      Resend Code
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row items-center">
                    <View className="w-2 h-2 bg-primary-500 rounded-full mr-2 animate-pulse" />
                    <Text className="text-secondary-500 dark:text-secondary-400 text-sm">
                      Code valid for 10:00
                    </Text>
                  </View>
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  onPress={confirmCode}
                  disabled={loading || code.length !== 6}
                  className={`bg-primary-500 active:bg-primary-600 py-5 rounded-2xl shadow-button ${loading || code.length !== 6 ? "opacity-70" : ""}`}
                >
                  {loading ? (
                    <Text className="text-white text-lg font-bold text-center">
                      Verifying...
                    </Text>
                  ) : (
                    <Text className="text-white text-lg font-bold text-center">
                      Verify & Continue
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Change Number */}
                <TouchableOpacity
                  onPress={() => {
                    setConfirm(null);
                    setCode("");
                  }}
                  className="mt-4 py-3"
                >
                  <Text className="text-center text-secondary-500 dark:text-secondary-400">
                    Didnt receive code?{" "}
                    <Text className="text-primary-600 dark:text-primary-400 font-bold">
                      Change Phone Number
                    </Text>
                  </Text>
                </TouchableOpacity>

                <Text className="text-center text-xs text-secondary-400 dark:text-secondary-500 mt-4">
                  The code expires in 10 minutes
                </Text>
              </View>
            )}

            {/* Terms */}
            <View className="mt-6 pt-6 border-t border-border dark:border-border-dark">
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
