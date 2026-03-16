// utils/glass-button-utils.ts
import { Platform } from "react-native";

export interface GlassButtonColors {
  blurIntensity: number;
  borderColor: string;
  glassBorder: {
    top: string;
    left: string;
  };
  gradientColors: string[];
  reflectionColor: string;
  shadowColor: string;
  shadowOpacity: number;
  iconColor: string;
}

export const getGlassButtonColors = (
  isDarkMode: boolean,
): GlassButtonColors => {
  if (isDarkMode) {
    return {
      blurIntensity: Platform.OS === "ios" ? 50 : 90,
      borderColor: "rgba(255, 255, 255, 0.15)",
      glassBorder: {
        top: "rgba(255, 255, 255, 0.25)",
        left: "rgba(255, 255, 255, 0.15)",
      },
      gradientColors: [
        "rgba(255, 255, 255, 0.12)",
        "rgba(255, 255, 255, 0.04)",
        "transparent",
      ],
      reflectionColor: "rgba(255, 255, 255, 0.15)",
      shadowColor: "#000",
      shadowOpacity: 0.3,
      iconColor: "#FFFFFF",
    };
  } else {
    return {
      blurIntensity: Platform.OS === "ios" ? 45 : 80,
      borderColor: "rgba(255, 255, 255, 0.3)",
      glassBorder: {
        top: "rgba(255, 255, 255, 0.6)",
        left: "rgba(255, 255, 255, 0.4)",
      },
      gradientColors: [
        "rgba(255, 255, 255, 0.5)",
        "rgba(255, 255, 255, 0.1)",
        "transparent",
      ],
      reflectionColor: "rgba(255, 255, 255, 0.35)",
      shadowColor: "#000",
      shadowOpacity: 0.15,
      iconColor: "#000000",
    };
  }
};

export const getGlassButtonTint = (
  tint: "light" | "dark" | "default" | "extraLight",
  isDarkMode: boolean,
): "light" | "dark" | "extraLight" => {
  if (tint !== "default") return tint;
  return isDarkMode ? "dark" : "light";
};

export const glassButtonStyles = {
  container: {
    borderRadius: 24,
    overflow: "hidden" as const,
    borderWidth: 0.8,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  glassBorder: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: "transparent",
    borderTopColor: "#FFF",
    borderLeftColor: "#FFF",
    opacity: 0.9,
    pointerEvents: "none" as const,
  },
  bottomShadow: {
    position: "absolute" as const,
    bottom: 0,
    right: 0,
    width: "60%",
    height: "40%",
    borderRadius: 24,
    opacity: 0.6,
    pointerEvents: "none" as const,
  },
  reflection: {
    position: "absolute" as const,
    top: 5,
    left: 8,
    width: "35%",
    height: "18%",
    borderRadius: 8,
    transform: [{ rotate: "-15deg" }],
    opacity: 0.8,
    pointerEvents: "none" as const,
  },
  iconShadow: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
} as const;
