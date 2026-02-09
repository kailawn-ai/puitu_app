// components/screen-wrapper.tsx
import { ReactNode } from "react";
import { ScrollView, ScrollViewProps, View } from "react-native";

interface ScreenWrapperProps extends ScrollViewProps {
  children: ReactNode;
  scrollable?: boolean;
  className?: string;
}

export function ScreenWrapper({
  children,
  scrollable = true,
  className = "",
  ...props
}: ScreenWrapperProps) {
  if (scrollable) {
    return (
      <ScrollView
        className={`flex-1 px-5 pt-4 ${className}`}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        {...props}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View className={`flex-1 px-5 pt-4 pb-32 ${className}`}>{children}</View>
  );
}
