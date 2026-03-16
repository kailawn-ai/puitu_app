// alert-ui.tsx
import Icon from "@react-native-vector-icons/ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
  useColorScheme,
} from "react-native";

const { width } = Dimensions.get("window");

export type AlertType = "success" | "error" | "warning" | "info" | "custom";

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
  backgroundColor?: string;
  textColor?: string;
}

interface AlertUIProps {
  visible: boolean;
  title?: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
  icon?: React.ReactNode;
  iconName?: string;
  iconColor?: string;
  iconSize?: number;
  showCloseButton?: boolean;
  onClose?: () => void;
  closeOnTouchOutside?: boolean;
  animationType?: "fade" | "slide" | "none";
  customIcon?: React.ReactNode;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  buttonContainerStyle?: ViewStyle;
  buttonStyle?: ViewStyle;
  buttonTextStyle?: TextStyle;
  cancelButtonStyle?: ViewStyle;
  destructiveButtonStyle?: ViewStyle;
  theme?: "light" | "dark"; // Optional theme override
}

const AlertUI: React.FC<AlertUIProps> = ({
  visible,
  title,
  message,
  type = "info",
  buttons = [],
  icon,
  iconName,
  iconColor,
  iconSize = 40,
  showCloseButton = false,
  onClose,
  closeOnTouchOutside = true,
  animationType = "fade",
  customIcon,
  titleStyle,
  messageStyle,
  containerStyle,
  contentStyle,
  buttonContainerStyle,
  buttonStyle,
  buttonTextStyle,
  cancelButtonStyle,
  destructiveButtonStyle,
  theme: propTheme,
}) => {
  const systemTheme = useColorScheme();
  const theme = propTheme || systemTheme || "light";
  const isDark = theme === "dark";

  const scaleValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleValue.setValue(0);
      fadeValue.setValue(0);
    }
  }, [visible, scaleValue, fadeValue]);

  // Theme-based colors from your Tailwind confi
  const themeColors = {
    light: {
      background: "#FFFFFF",
      text: "#09090b",
      textMuted: "#737373",
      border: "#E5E5E5",
      card: "#F8F8F8",
      overlay: "rgba(0, 0, 0, 0.5)",
      closeIcon: "#737373",
      cancelButton: "#E0E0E0",
      cancelButtonText: "#525252",
      gradient: ["#ffffff", "#f3f4ff", "#e0e7ff"] as const,
    },
    dark: {
      background: "#171717",
      text: "#FFFFFF",
      textMuted: "#A3A3A3",
      border: "#262626",
      card: "#242424",
      overlay: "rgba(0, 0, 0, 0.7)",
      closeIcon: "#A3A3A3",
      cancelButton: "#303030",
      cancelButtonText: "#FFFFFF",
      gradient: ["#242424", "#1f1f2e", "#1a1a24"] as const,
    },
  };

  const colors = themeColors[isDark ? "dark" : "light"];

  const getIconByType = () => {
    if (customIcon) return customIcon;
    if (icon) return icon;

    const iconConfig = {
      success: { name: "checkmark-circle", color: "#10B981" },
      error: { name: "close-circle", color: "#EF4444" },
      warning: { name: "warning", color: "#F59E0B" },
      info: { name: "information-circle", color: "#3B82F6" },
      custom: {
        name: iconName || "alert",
        color: iconColor || (isDark ? "#7A25FF" : "#6200E6"),
      },
    };

    const config = iconConfig[type] || iconConfig.info;
    return (
      <Icon
        name={config.name}
        size={iconSize}
        color={iconColor || config.color}
      />
    );
  };

  const handleButtonPress = (button: AlertButton) => {
    button.onPress?.();
    // Any button press should initiate the closing of the alert.
    handleClose();
  };

  const getButtonStyle = (button: AlertButton) => {
    const baseStyle = [styles.button];

    if (button.style === "cancel") {
      return [
        ...baseStyle,
        { backgroundColor: colors.cancelButton },
        cancelButtonStyle,
      ];
    }
    if (button.style === "destructive") {
      return [...baseStyle, styles.destructiveButton, destructiveButtonStyle];
    }
    return [...baseStyle, styles.defaultButton, buttonStyle];
  };

  const getButtonTextStyle = (button: AlertButton) => {
    const baseStyle = [styles.buttonText];

    if (button.style === "cancel") {
      return [
        ...baseStyle,
        { color: colors.cancelButtonText },
        buttonTextStyle,
      ];
    }
    if (button.style === "destructive") {
      return [...baseStyle, styles.destructiveButtonText, buttonTextStyle];
    }
    return [...baseStyle, buttonTextStyle];
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onClose) onClose();
    });
  };

  const renderButtons = () => {
    if (buttons.length === 0) {
      return (
        <TouchableOpacity
          style={[styles.defaultButton, buttonStyle]}
          onPress={handleClose}
        >
          <Text style={[styles.buttonText, buttonTextStyle]}>OK</Text>
        </TouchableOpacity>
      );
    }

    return buttons.map((button, index) => (
      <TouchableOpacity
        key={index}
        style={[
          getButtonStyle(button),
          button.backgroundColor && { backgroundColor: button.backgroundColor },
          index > 0 && styles.buttonMargin,
        ]}
        onPress={() => handleButtonPress(button)}
      >
        <Text
          style={[
            getButtonTextStyle(button),
            button.textColor && { color: button.textColor },
          ]}
        >
          {button.text}
        </Text>
      </TouchableOpacity>
    ));
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType={animationType}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback
        onPress={closeOnTouchOutside ? handleClose : undefined}
      >
        <Animated.View
          style={[
            styles.overlay,
            { backgroundColor: colors.overlay, opacity: fadeValue },
          ]}
        >
          <TouchableWithoutFeedback>
            <LinearGradient
              colors={colors.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.alertContainer,
                isDark && styles.alertContainerDark,
                containerStyle,
              ]}
            >
              <View style={[styles.content, contentStyle]}>
                {showCloseButton && (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                  >
                    <Icon name="close" size={20} color={colors.closeIcon} />
                  </TouchableOpacity>
                )}

                {(icon || customIcon || type !== "custom") && (
                  <View style={styles.iconContainer}>{getIconByType()}</View>
                )}

                {title && (
                  <Text
                    style={[styles.title, { color: colors.text }, titleStyle]}
                  >
                    {title}
                  </Text>
                )}

                {message && (
                  <Text
                    style={[
                      styles.message,
                      { color: colors.textMuted },
                      messageStyle,
                    ]}
                  >
                    {message}
                  </Text>
                )}

                <View style={[styles.buttonContainer, buttonContainerStyle]}>
                  {renderButtons()}
                </View>
              </View>
            </LinearGradient>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  alertContainer: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 40,
    overflow: "hidden",
  },
  alertContainerDark: {
    shadowColor: "#7A25FF",
    shadowOpacity: 0.2,
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  defaultButton: {
    backgroundColor: "#7A25FF", // primary.DEFAULT
  },
  destructiveButton: {
    backgroundColor: "#EF4444", // error.DEFAULT
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF", // text.light
  },
  destructiveButtonText: {
    color: "#FFFFFF", // text.light
  },
  buttonMargin: {
    marginLeft: 8,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
});

export default AlertUI;
