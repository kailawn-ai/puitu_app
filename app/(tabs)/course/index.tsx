import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
import React from "react";
import { KeyboardAvoidingView, Platform } from "react-native";

export default function YourComponent() {
  const { colorScheme } = useColorScheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#09090b", "#171717"] // Using your secondary-900 and secondary-800
            : ["#F8FAFC", "#E2E8F0"]
        } // Light mode gradient
        locations={[0, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ flex: 1 }}
      >
        {/* Your content */}
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
