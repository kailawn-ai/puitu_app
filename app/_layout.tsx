// app/_layout.tsx
import { FloatingAudioPlayer } from "@/components/audio/floating-audio-player";
import { FloatingVideoPlayer } from "@/components/video/floating-video-player";
import { SideDrawer } from "@/components/layout/side-drawer";
import { AuthProvider } from "@/contexts/auth-context";
import { FCMService } from "@/lib/services/fcm-service";
import { AlertProvider } from "@/providers/alert-provider";
import { AuthGuard } from "@/providers/auth-guard";
import { NotificationProvider } from "@/providers/notification-provider";
import { useDrawerStore } from "@/store/drawer-store";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import "./globals.css";

// Wrapper component to use the store
function DrawerWrapper() {
  const { isVisible, closeDrawer } = useDrawerStore();
  return <SideDrawer isVisible={isVisible} onClose={closeDrawer} />;
}

export default function RootLayout() {
  useEffect(() => {
    FCMService.initialize();

    return () => {
      FCMService.cleanup();
    };
  }, []);

  return (
    <AuthProvider>
      <AuthGuard>
        <AlertProvider>
          <NotificationProvider>
            <StatusBar style="auto" backgroundColor="transparent" translucent />
            <View className="flex-1">
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="index" options={{ headerShown: false }} />
              </Stack>
              <FloatingAudioPlayer />
              <FloatingVideoPlayer />
              <DrawerWrapper />
            </View>
          </NotificationProvider>
        </AlertProvider>
      </AuthGuard>
    </AuthProvider>
  );
}
