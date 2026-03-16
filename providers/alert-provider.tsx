// providers/alert-provider.tsx
import AlertUI from "@/components/ui/alert-ui";
import { useAlert as useAlertHook } from "@/hook/use-alert";
import React, { createContext, ReactNode, useContext } from "react";

interface AlertContextType {
  showAlert: (options: any) => void;
  showSuccess: (title: string, message?: string, buttons?: any[]) => void;
  showError: (title: string, message?: string, buttons?: any[]) => void;
  showWarning: (title: string, message?: string, buttons?: any[]) => void;
  showInfo: (title: string, message?: string, buttons?: any[]) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
  ) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

export function AlertProvider({ children }: { children: ReactNode }) {
  const alert = useAlertHook();

  return (
    <AlertContext.Provider value={alert}>
      {children}
      <AlertUI
        visible={alert.visible}
        title={alert.options.title}
        message={alert.options.message}
        type={alert.options.type}
        buttons={alert.options.buttons}
        showCloseButton={alert.options.showCloseButton}
        closeOnTouchOutside={alert.options.closeOnTouchOutside}
        icon={alert.options.icon}
        iconName={alert.options.iconName}
        iconColor={alert.options.iconColor}
        onClose={alert.hideAlert}
      />
    </AlertContext.Provider>
  );
}
