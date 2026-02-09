import React from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: "primary" | "secondary" | "outline" | "danger";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
}) => {
  // Define variant styles using Tailwind classes
  const variantStyles = {
    primary: "bg-blue-600 border-transparent",
    secondary: "bg-gray-800 border-transparent",
    outline: "bg-transparent border-gray-300 border",
    danger: "bg-red-500 border-transparent",
  };

  const textStyles = {
    primary: "text-white",
    secondary: "text-white",
    outline: "text-gray-700",
    danger: "text-white",
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={isDisabled}
      className={`
        flex-row items-center justify-center 
        py-4 px-6 rounded-2xl 
        ${variantStyles[variant]} 
        ${isDisabled ? "opacity-50" : ""} 
        ${className}
      `}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? "#000" : "#fff"} />
      ) : (
        <Text className={`text-lg font-semibold ${textStyles[variant]}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
