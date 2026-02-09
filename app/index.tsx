import { Link } from "expo-router";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Index() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView className="flex-1 bg-gradient-to-t from-stone-50 to-slate-200 dark:bg-background-dark">
        {/* Hero Section */}
        <View className="pt-16 pb-8 px-6 bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-secondary-900">
          <Text className="text-5xl font-bold text-primary-600 dark:text-primary-300 mb-2">
            Welcome
          </Text>
          <Text className="text-2xl font-semibold text-secondary-800 dark:text-text-light mb-4">
            Expo + NativeWind
          </Text>
          <Text className="text-base text-text-muted dark:text-text-mutedLight mb-6">
            Testing the beautiful theme with primary #7A25FF
          </Text>
        </View>

        {/* Primary Color Shades */}
        <View className="px-6 py-8">
          <Text className="text-2xl font-bold text-secondary-900 dark:text-text-light mb-4">
            Primary Color Shades
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            <View className="w-12 h-12 rounded-lg bg-primary-50 items-center justify-center">
              <Text className="text-xs font-bold text-secondary-900">50</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-primary-100 items-center justify-center">
              <Text className="text-xs font-bold text-secondary-900">100</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-primary-200 items-center justify-center">
              <Text className="text-xs font-bold text-secondary-900">200</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-primary-300 items-center justify-center">
              <Text className="text-xs font-bold text-secondary-900">300</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-primary-400 items-center justify-center">
              <Text className="text-xs font-bold text-secondary-900">400</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-primary-500 items-center justify-center">
              <Text className="text-xs font-bold text-white">500</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-primary-600 items-center justify-center">
              <Text className="text-xs font-bold text-white">600</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-primary-700 items-center justify-center">
              <Text className="text-xs font-bold text-white">700</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-primary-800 items-center justify-center">
              <Text className="text-xs font-bold text-white">800</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-primary-900 items-center justify-center">
              <Text className="text-xs font-bold text-white">900</Text>
            </View>
          </View>

          {/* Secondary Color Shades */}
          <Text className="text-2xl font-bold text-secondary-900 dark:text-text-light mb-4">
            Secondary Color Shades
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-8">
            <View className="w-12 h-12 rounded-lg bg-secondary-50 items-center justify-center border border-border dark:border-border-dark">
              <Text className="text-xs font-bold text-secondary-900">50</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-secondary-100 items-center justify-center border border-border dark:border-border-dark">
              <Text className="text-xs font-bold text-secondary-900">100</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-secondary-200 items-center justify-center border border-border dark:border-border-dark">
              <Text className="text-xs font-bold text-secondary-900">200</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-secondary-300 items-center justify-center border border-border dark:border-border-dark">
              <Text className="text-xs font-bold text-secondary-900">300</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-secondary-400 items-center justify-center border border-border dark:border-border-dark">
              <Text className="text-xs font-bold text-secondary-900">400</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-secondary-500 items-center justify-center border border-border dark:border-border-dark">
              <Text className="text-xs font-bold text-white">500</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-secondary-600 items-center justify-center border border-border dark:border-border-dark">
              <Text className="text-xs font-bold text-white">600</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-secondary-700 items-center justify-center border border-border dark:border-border-dark">
              <Text className="text-xs font-bold text-white">700</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-secondary-800 items-center justify-center border border-border dark:border-border-dark">
              <Text className="text-xs font-bold text-white">800</Text>
            </View>
            <View className="w-12 h-12 rounded-lg bg-secondary-900 items-center justify-center border border-border dark:border-border-dark">
              <Text className="text-xs font-bold text-white">900</Text>
            </View>
          </View>
        </View>

        {/* Button Examples */}
        <View className="px-6 py-8 bg-background-card dark:bg-background-cardDark">
          <Text className="text-2xl font-bold text-secondary-900 dark:text-text-light mb-6">
            Button Variants
          </Text>

          <TouchableOpacity
            className="bg-primary-500 active:bg-primary-600 px-6 py-4 rounded-xl shadow-button mb-4 items-center"
            onPress={() => console.log("Primary pressed")}
          >
            <Text className="text-white font-bold text-lg">Primary Button</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-secondary-800 dark:bg-secondary-700 active:bg-secondary-900 px-6 py-4 rounded-xl mb-4 items-center border border-border-dark"
            onPress={() => console.log("Secondary pressed")}
          >
            <Text className="text-white font-bold text-lg">
              Secondary Button
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-transparent px-6 py-4 rounded-xl mb-4 items-center border-2 border-primary-500"
            onPress={() => console.log("Outline pressed")}
          >
            <Text className="text-primary-600 dark:text-primary-400 font-bold text-lg">
              Outline Button
            </Text>
          </TouchableOpacity>

          <Link href="/login" asChild>
            <TouchableOpacity className="bg-gradient-to-r from-primary-500 to-primary-700 px-6 py-4 rounded-xl shadow-hard items-center">
              <Text className="text-secondary-900 dark:text-text-light font-bold text-lg">
                Go to Login →
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Card Examples */}
        <View className="px-6 py-8">
          <Text className="text-2xl font-bold text-secondary-900 dark:text-text-light mb-6">
            Card Examples
          </Text>

          <View className="bg-background-card dark:bg-background-cardDark p-6 rounded-2xl shadow-medium mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center mr-4">
                <Text className="text-primary-600 dark:text-primary-300 text-xl font-bold">
                  💜
                </Text>
              </View>
              <View>
                <Text className="text-xl font-bold text-text-default dark:text-text-light">
                  Beautiful Card
                </Text>
                <Text className="text-text-muted dark:text-text-mutedLight">
                  With icon and content
                </Text>
              </View>
            </View>
            <Text className="text-base text-text-default dark:text-text-light">
              This card demonstrates the shadow system, rounded corners, and
              proper spacing using the theme.
            </Text>
          </View>

          <View className="bg-gradient-to-br from-primary-500 to-primary-700 p-6 rounded-2xl shadow-hard mb-8">
            <Text className="text-white text-xl font-bold mb-2">
              Gradient Card
            </Text>
            <Text className="text-primary-100 text-base">
              Using primary color gradient for emphasis
            </Text>
          </View>
        </View>

        {/* Status Indicators */}
        <View className="px-6 py-8 bg-background-card dark:bg-background-cardDark">
          <Text className="text-2xl font-bold text-secondary-900 dark:text-text-light mb-6">
            Status Indicators
          </Text>

          <View className="flex-row flex-wrap gap-3 mb-6">
            <View className="flex-1 min-w-[45%] bg-success-light dark:bg-success-dark p-4 rounded-xl">
              <Text className="text-success-dark dark:text-success-light font-bold text-center">
                ✅ Success
              </Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-warning-light dark:bg-warning-dark p-4 rounded-xl">
              <Text className="text-warning-dark dark:text-warning-light font-bold text-center">
                ⚠️ Warning
              </Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-error-light dark:bg-error-dark p-4 rounded-xl">
              <Text className="text-error-dark dark:text-error-light font-bold text-center">
                ❌ Error
              </Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-info-light dark:bg-info-dark p-4 rounded-xl">
              <Text className="text-info-dark dark:text-info-light font-bold text-center">
                ℹ️ Info
              </Text>
            </View>
          </View>
        </View>

        {/* Typography Scale */}
        <View className="px-6 py-8">
          <Text className="text-2xl font-bold text-secondary-900 dark:text-text-light mb-6">
            Typography Scale
          </Text>

          <Text className="text-xxs text-secondary-800 dark:text-text-light mb-2">
            Extra Extra Small (10px)
          </Text>
          <Text className="text-xs text-secondary-800 dark:text-text-light mb-2">
            Extra Small (12px)
          </Text>
          <Text className="text-sm text-secondary-800 dark:text-text-light mb-2">
            Small (14px)
          </Text>
          <Text className="text-base text-secondary-800 dark:text-text-light mb-2">
            Base (16px)
          </Text>
          <Text className="text-lg text-secondary-800 dark:text-text-light mb-2">
            Large (18px)
          </Text>
          <Text className="text-xl text-secondary-800 dark:text-text-light mb-2">
            Extra Large (20px)
          </Text>
          <Text className="text-2xl text-secondary-800 dark:text-text-light mb-2">
            2XL (24px)
          </Text>
          <Text className="text-3xl text-secondary-800 dark:text-text-light mb-2">
            3XL (30px)
          </Text>
          <Text className="text-4xl text-secondary-800 dark:text-text-light mb-2">
            4XL (36px)
          </Text>
          <Text className="text-5xl text-secondary-800 dark:text-text-light mb-2">
            5XL (48px)
          </Text>
        </View>

        {/* Border Radius Examples */}
        <View className="px-6 py-8 bg-background-card dark:bg-background-cardDark mb-8">
          <Text className="text-2xl font-bold text-secondary-900 dark:text-text-light mb-6">
            Border Radius Scale
          </Text>

          <View className="flex-row flex-wrap gap-4 mb-6">
            <View className="w-16 h-16 bg-primary-500 items-center justify-center rounded-xs">
              <Text className="text-white text-xs font-bold">xs</Text>
            </View>
            <View className="w-16 h-16 bg-primary-500 items-center justify-center rounded-sm">
              <Text className="text-white text-xs font-bold">sm</Text>
            </View>
            <View className="w-16 h-16 bg-primary-500 items-center justify-center rounded-default">
              <Text className="text-white text-xs font-bold">default</Text>
            </View>
            <View className="w-16 h-16 bg-primary-500 items-center justify-center rounded-md">
              <Text className="text-white text-xs font-bold">md</Text>
            </View>
            <View className="w-16 h-16 bg-primary-500 items-center justify-center rounded-lg">
              <Text className="text-white text-xs font-bold">lg</Text>
            </View>
            <View className="w-16 h-16 bg-primary-500 items-center justify-center rounded-xl">
              <Text className="text-white text-xs font-bold">xl</Text>
            </View>
            <View className="w-16 h-16 bg-primary-500 items-center justify-center rounded-2xl">
              <Text className="text-white text-xs font-bold">2xl</Text>
            </View>
            <View className="w-16 h-16 bg-primary-500 items-center justify-center rounded-full">
              <Text className="text-white text-xs font-bold">full</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="px-6 py-8 bg-secondary-900 items-center">
          <Text className="text-white text-lg font-bold mb-2">
            Theme Testing Complete
          </Text>
          <Text className="text-secondary-300 text-center">
            Primary: #7A25FF | Secondary: #09090b
          </Text>
          <Text className="text-secondary-400 text-sm text-center mt-2">
            All theme colors, shadows, and utilities are working!
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
