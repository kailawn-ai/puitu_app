import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "ios_from_right",
        presentation: "transparentModal", // 👈 smoother back transitionr
        contentStyle: { backgroundColor: "transparent" },
      }}
    />
  );
}
