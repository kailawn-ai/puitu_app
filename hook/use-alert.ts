// hooks/useAlert.ts
import { AlertButton, AlertType } from "@/components/ui/alert-ui";
import { useCallback, useState } from "react";

interface AlertOptions {
  title?: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
  showCloseButton?: boolean;
  closeOnTouchOutside?: boolean;
  icon?: React.ReactNode;
  iconName?: string;
  iconColor?: string;
}

// Create a global state manager
let globalSetAlertState: React.Dispatch<
  React.SetStateAction<{
    visible: boolean;
    options: AlertOptions;
  }>
> = () => {};

export const useAlert = () => {
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    options: AlertOptions;
  }>({
    visible: false,
    options: {},
  });

  // Store the setter for global access
  globalSetAlertState = setAlertState;

  const showAlert = useCallback((alertOptions: AlertOptions) => {
    setAlertState({
      visible: true,
      options: alertOptions,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState({
      visible: false,
      options: {},
    });
  }, []);

  const showSuccess = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      showAlert({
        title,
        message,
        type: "success",
        buttons: buttons || [{ text: "OK", onPress: hideAlert }],
      });
    },
    [showAlert, hideAlert],
  );

  const showError = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      showAlert({
        title,
        message,
        type: "error",
        buttons: buttons || [{ text: "OK", onPress: hideAlert }],
      });
    },
    [showAlert, hideAlert],
  );

  const showWarning = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      showAlert({
        title,
        message,
        type: "warning",
        buttons: buttons || [{ text: "OK", onPress: hideAlert }],
      });
    },
    [showAlert, hideAlert],
  );

  const showInfo = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      showAlert({
        title,
        message,
        type: "info",
        buttons: buttons || [{ text: "OK", onPress: hideAlert }],
      });
    },
    [showAlert, hideAlert],
  );

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void,
    ) => {
      showAlert({
        title,
        message,
        type: "warning",
        buttons: [
          { text: "Cancel", style: "cancel", onPress: onCancel || hideAlert },
          {
            text: "Confirm",
            style: "destructive",
            onPress: () => {
              onConfirm();
              hideAlert();
            },
          },
        ],
      });
    },
    [showAlert, hideAlert],
  );

  return {
    visible: alertState.visible,
    options: alertState.options,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
};

// Global alert functions that can be called from anywhere
export const GlobalAlert = {
  show: (options: AlertOptions) => {
    globalSetAlertState({
      visible: true,
      options,
    });
  },
  hide: () => {
    globalSetAlertState({
      visible: false,
      options: {},
    });
  },
  success: (title: string, message?: string, buttons?: AlertButton[]) => {
    globalSetAlertState({
      visible: true,
      options: {
        title,
        message,
        type: "success",
        buttons: buttons || [{ text: "OK", onPress: GlobalAlert.hide }],
      },
    });
  },
  error: (title: string, message?: string, buttons?: AlertButton[]) => {
    globalSetAlertState({
      visible: true,
      options: {
        title,
        message,
        type: "error",
        buttons: buttons || [{ text: "OK", onPress: GlobalAlert.hide }],
      },
    });
  },
  warning: (title: string, message?: string, buttons?: AlertButton[]) => {
    globalSetAlertState({
      visible: true,
      options: {
        title,
        message,
        type: "warning",
        buttons: buttons || [{ text: "OK", onPress: GlobalAlert.hide }],
      },
    });
  },
  info: (title: string, message?: string, buttons?: AlertButton[]) => {
    globalSetAlertState({
      visible: true,
      options: {
        title,
        message,
        type: "info",
        buttons: buttons || [{ text: "OK", onPress: GlobalAlert.hide }],
      },
    });
  },
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
  ) => {
    globalSetAlertState({
      visible: true,
      options: {
        title,
        message,
        type: "warning",
        buttons: [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              onCancel?.();
              GlobalAlert.hide();
            },
          },
          {
            text: "Confirm",
            style: "destructive",
            onPress: () => {
              onConfirm();
              GlobalAlert.hide();
            },
          },
        ],
      },
    });
  },
};
