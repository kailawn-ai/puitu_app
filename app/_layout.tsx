import { AuthGuard } from "@/components/auth/auth-guard";
import { AuthProvider } from "@/contexts/auth-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "./globals.css";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard>
        <StatusBar style="auto" backgroundColor="transparent" translucent />
        <Stack
          screenOptions={{
            headerShown: false, // This hides the header globally
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </AuthGuard>
    </AuthProvider>
  );
}
