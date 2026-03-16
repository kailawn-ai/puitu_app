// screens/OnboardingScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity } from "react-native";
import Onboarding from "react-native-onboarding-swiper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const OnboardingScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Handle when onboarding is complete
  const handleDone = async () => {
    try {
      // Set flag that user has completed onboarding
      await AsyncStorage.setItem("hasOnboarded", "true");
      // Navigate to main app screen
      router.replace("/login");
    } catch (error) {
      console.error("Error saving onboarding status:", error);
    }
  };

  // Custom Done button
  const DoneButton = ({ ...props }) => (
    <TouchableOpacity style={styles.doneButton} {...props}>
      <Text style={styles.doneButtonText}>Get Started</Text>
    </TouchableOpacity>
  );

  // Custom Skip button
  const SkipButton = ({ ...props }) => (
    <TouchableOpacity style={styles.skipButton} {...props}>
      <Text style={styles.skipButtonText}>Skip</Text>
    </TouchableOpacity>
  );

  // Custom Next button
  const NextButton = ({ ...props }) => (
    <TouchableOpacity style={styles.nextButton} {...props}>
      <Text style={styles.nextButtonText}>Next</Text>
    </TouchableOpacity>
  );

  const onboardingPages = [
    {
      backgroundColor: "#a6e4e7",
      image: (
        <Image
          source={require("../assets/images/google_logo.png")}
          style={styles.image}
        />
      ),
      title: "Welcome to Our App",
      subtitle:
        "Discover amazing features that will help you achieve your goals",
    },
    {
      backgroundColor: "#fdeb93",
      image: (
        <Image
          source={require("../assets/images/google_logo.png")}
          style={styles.image}
        />
      ),
      title: "Stay Organized",
      subtitle: "Keep track of all your tasks and activities in one place",
    },
    {
      backgroundColor: "#e3bcff",
      image: (
        <Image
          source={require("../assets/images/google_logo.png")}
          style={styles.image}
        />
      ),
      title: "Connect with Others",
      subtitle: "Share your progress and collaborate with friends",
    },
    {
      backgroundColor: "#b0e57c",
      image: (
        <Image
          source={require("../assets/images/google_logo.png")}
          style={styles.image}
        />
      ),
      title: "Track Your Progress",
      subtitle: "Monitor your achievements and see how far you've come",
    },
    {
      backgroundColor: "#ffb6c1",
      image: (
        <Image
          source={require("../assets/images/google_logo.png")}
          style={styles.image}
        />
      ),
      title: "Get Started Now",
      subtitle: "Join thousands of users who are already enjoying our app",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <Onboarding
        pages={onboardingPages}
        onDone={handleDone}
        onSkip={handleDone}
        DoneButtonComponent={DoneButton}
        SkipButtonComponent={SkipButton}
        NextButtonComponent={NextButton}
        bottomBarHighlight={false}
        showSkip={true}
        showNext={true}
        showDone={true}
        titleStyles={styles.title}
        subTitleStyles={styles.subtitle}
        bottomBarHeight={88 + insets.bottom}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: "contain",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  doneButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    marginRight: 20,
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginLeft: 20,
  },
  skipButtonText: {
    color: "#666",
    fontSize: 16,
  },
  nextButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#007AFF",
    borderRadius: 25,
    marginRight: 20,
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default OnboardingScreen;
