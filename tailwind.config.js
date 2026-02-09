/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.tsx",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7A25FF",
          50: "#F2EBFF",
          100: "#E4D6FF",
          200: "#C9ADFF",
          300: "#AE85FF",
          400: "#945CFF",
          500: "#7A25FF", // Your primary color
          600: "#6200E6",
          700: "#4A00B3",
          800: "#320080",
          900: "#1A004D",
        },

        secondary: {
          DEFAULT: "#09090b",
          50: "#EEF3F8",
          100: "#F5F5F5",
          150: "#e2e8f0",
          200: "#D4D4D4",
          300: "#A3A3A3",
          400: "#737373",
          500: "#525252",
          600: "#404040",
          700: "#262626",
          800: "#171717",
          900: "#09090b", // Your secondary color
        },

        // Semantic colors for your app
        background: {
          DEFAULT: "#FFFFFF",
          dark: "#09090b",
          card: "#F8F8F8",
          cardDark: "#171717",
        },

        text: {
          DEFAULT: "#09090b",
          light: "#FFFFFF",
          muted: "#737373",
          mutedLight: "#A3A3A3",
        },

        border: {
          DEFAULT: "#E5E5E5",
          dark: "#262626",
          light: "#F5F5F5",
        },

        // Status colors
        success: {
          DEFAULT: "#10B981",
          light: "#D1FAE5",
          dark: "#065F46",
        },

        warning: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
          dark: "#92400E",
        },

        error: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
          dark: "#991B1B",
        },

        info: {
          DEFAULT: "#3B82F6",
          light: "#DBEAFE",
          dark: "#1E40AF",
        },
      },

      // Extended spacing for mobile app
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },

      // Custom shadows optimized for mobile
      boxShadow: {
        soft: "0 2px 15px rgba(122, 37, 255, 0.08)",
        medium: "0 4px 20px rgba(122, 37, 255, 0.12)",
        hard: "0 8px 30px rgba(122, 37, 255, 0.16)",
        "inner-glow": "inset 0 0 0 1px rgba(122, 37, 255, 0.1)",
        button: "0 4px 14px rgba(122, 37, 255, 0.4)",
      },

      // Custom animation for Expo app
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 2s infinite",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },

      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },

      // Font sizes optimized for mobile
      fontSize: {
        xxs: "10px",
        xs: "12px",
        sm: "14px",
        base: "16px",
        lg: "18px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "30px",
        "4xl": "36px",
        "5xl": "48px",
      },

      // Border radius system
      borderRadius: {
        none: "0",
        xs: "4px",
        sm: "8px",
        default: "12px",
        md: "16px",
        lg: "20px",
        xl: "24px",
        "2xl": "32px",
        full: "9999px",
      },
    },
  },
  plugins: [],
  // Dark mode support for Nativewind
  darkMode: "class",
};
