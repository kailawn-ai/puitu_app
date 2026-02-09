// components/auth/auth-guard.tsx
import { useAuth } from "@/contexts/auth-context";
import { useRouter, useSegments } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const segments = useSegments();
  const { colorScheme } = useColorScheme();
  const { user, loading, initializing } = useAuth();

  useEffect(() => {
    // Don't redirect while still loading
    if (loading || initializing) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";

    console.log("AuthGuard - User:", user ? "Logged in" : "Not logged in");
    console.log("AuthGuard - Current segment:", segments[0]);
    console.log("AuthGuard - In auth group:", inAuthGroup);

    if (!user && !inAuthGroup) {
      // Not logged in and not on auth pages
      console.log("AuthGuard - Redirecting to login");
      router.replace("/login");
    } else if (user && inAuthGroup) {
      // Logged in and trying to access auth pages
      console.log("AuthGuard - Redirecting to home");
      router.replace("/home");
    } else if (inTabsGroup && !user) {
      // Handle index page redirect
      if (user) {
        router.replace("/login");
      } else {
        router.replace("/login");
      }
    }
  }, [user, segments, loading, initializing]);

  if (loading || initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-background-dark">
        <ActivityIndicator
          size="large"
          color={colorScheme === "dark" ? "#7A25FF" : "#7A25FF"}
        />
      </View>
    );
  }

  return <>{children}</>;
}
