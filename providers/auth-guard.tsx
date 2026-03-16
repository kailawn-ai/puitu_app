import { useAuth } from "@/contexts/auth-context";
import { useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || initializing) return;

    const root = segments[0];

    const inAuthGroup = root === "(auth)";
    const inTabsGroup = root === "(tabs)";
    const inRoot = root === undefined; // "/"

    // 🚀 logged in user trying to access auth pages
    if (user && (inAuthGroup || inRoot)) {
      router.replace("/home");
      return;
    }

    // 🚫 guest trying to access protected tabs
    if (!user && (inTabsGroup || inRoot)) {
      router.replace("/login");
      return;
    }
  }, [user, segments, loading, initializing, router]);

  // ⏳ global loading
  if (loading || initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-background-dark">
        <ActivityIndicator size="large" color="#7A25FF" />
      </View>
    );
  }

  // 🚫 block UI while redirecting
  const root = segments[0];
  const shouldBlock =
    (user && root === "(auth)") || (!user && root === "(tabs)");

  if (shouldBlock) return null;

  return <>{children}</>;
}
