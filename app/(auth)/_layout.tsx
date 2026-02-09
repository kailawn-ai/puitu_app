// app/(auth)/_layout.tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // This hides the header for all screens in this group
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          // You can also set individual screen options here
        }}
      />
      <Stack.Screen
        name="login/phone"
        options={{
          headerShown: false,
          // If you want to show header for specific screen:
          // headerShown: true,
          // title: "Phone Login"
        }}
      />
      {/* Add other screens in the auth group if needed */}
    </Stack>
  );
}
