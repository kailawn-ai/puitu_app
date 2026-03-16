// button-ui.tsx
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  backgroundColor?: string;
  textColor?: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const ButtonUI: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  backgroundColor,
  textColor,
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  style,
  textStyle,
  fullWidth = false,
  ...rest
}) => {
  // Size configurations
  const sizeStyles = {
    small: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      fontSize: 14,
      iconSize: 16,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      fontSize: 16,
      iconSize: 20,
    },
    large: {
      paddingVertical: 13,
      paddingHorizontal: 32,
      fontSize: 18,
      iconSize: 24,
    },
  };

  // Variant configurations
  const getVariantStyles = () => {
    const baseStyle: ViewStyle = {};
    const baseTextStyle: TextStyle = {};

    switch (variant) {
      case "primary":
        baseStyle.backgroundColor = backgroundColor || "#007AFF";
        baseTextStyle.color = textColor || "#FFFFFF";
        break;
      case "secondary":
        baseStyle.backgroundColor = backgroundColor || "#5856D6";
        baseTextStyle.color = textColor || "#FFFFFF";
        break;
      case "outline":
        baseStyle.backgroundColor = "transparent";
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = backgroundColor || "#007AFF";
        baseTextStyle.color = textColor || backgroundColor || "#007AFF";
        break;
      case "ghost":
        baseStyle.backgroundColor = "transparent";
        baseTextStyle.color = textColor || backgroundColor || "#007AFF";
        break;
    }

    return { baseStyle, baseTextStyle };
  };

  const { baseStyle, baseTextStyle } = getVariantStyles();
  const currentSize = sizeStyles[size];

  // Disabled state styles
  const disabledStyle: ViewStyle = disabled ? styles.disabled : {};
  const disabledTextStyle: TextStyle = disabled ? styles.disabledText : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        baseStyle,
        {
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
          width: fullWidth ? "100%" : "auto",
        },
        disabledStyle,
        style,
      ]}
      activeOpacity={0.7}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={baseTextStyle.color || "#FFFFFF"}
        />
      ) : (
        <>
          {icon && iconPosition === "left" && icon}
          <Text
            style={[
              styles.text,
              baseTextStyle,
              {
                fontSize: currentSize.fontSize,
                marginLeft: icon && iconPosition === "left" ? 8 : 0,
                marginRight: icon && iconPosition === "right" ? 8 : 0,
              },
              disabledTextStyle,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === "right" && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0000008c",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  disabled: {
    backgroundColor: "#E0E0E0",
    borderColor: "#E0E0E0",
  },
  disabledText: {
    color: "#9E9E9E",
  },
});

export default ButtonUI;
