// contexts/api-context.tsx
import { apiClient } from "@/lib/api/api-client";
import React, { createContext, useCallback, useContext, useState } from "react";
import { Alert } from "react-native";

interface ApiContextType {
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  makeRequest: <T>(
    request: () => Promise<any>,
    options?: {
      showError?: boolean;
      successMessage?: string;
      onSuccess?: (data: T) => void;
      onError?: (error: any) => void;
      loadingMessage?: string;
    },
  ) => Promise<T | null>;
}

const ApiContext = createContext<ApiContextType>({
  isLoading: false,
  error: null,
  clearError: () => {},
  makeRequest: async () => null,
});

export const useApi = () => useContext(ApiContext);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const makeRequest = useCallback(
    async <T,>(
      request: () => Promise<any>,
      options: {
        showError?: boolean;
        successMessage?: string;
        onSuccess?: (data: T) => void;
        onError?: (error: any) => void;
        loadingMessage?: string;
      } = {},
    ): Promise<T | null> => {
      const {
        showError = true,
        successMessage,
        onSuccess,
        onError,
        loadingMessage,
      } = options;

      setIsLoading(true);
      clearError();

      try {
        const response = await request();

        if (successMessage) {
          Alert.alert("Success", successMessage);
        }

        if (onSuccess) {
          onSuccess(response.data);
        }

        return response.data;
      } catch (error: any) {
        const errorMessage = error.message || "An error occurred";
        setError(errorMessage);

        // Handle specific error cases
        if (error.status === 401) {
          // Unauthorized - Token expired or invalid
          Alert.alert(
            "Session Expired",
            "Your session has expired. Please login again.",
            [
              {
                text: "OK",
                onPress: () => {
                  // Handle logout and redirect to login
                  apiClient.clearAuth();
                  // You might want to dispatch a logout action here
                },
              },
            ],
          );
        } else if (error.status === 403) {
          Alert.alert(
            "Access Denied",
            "You do not have permission to perform this action.",
          );
        } else if (error.status === 404) {
          Alert.alert("Not Found", "The requested resource was not found.");
        } else if (error.status === 422) {
          // Validation errors from Laravel
          const validationErrors = error.data?.errors;
          if (validationErrors) {
            const firstError = Object.values(validationErrors)[0] as string[];
            Alert.alert(
              "Validation Error",
              firstError?.[0] || "Please check your input.",
            );
          } else {
            Alert.alert("Error", errorMessage);
          }
        } else if (error.status === 500) {
          Alert.alert(
            "Server Error",
            "Something went wrong on our end. Please try again later.",
          );
        } else if (showError) {
          Alert.alert("Error", errorMessage);
        }

        if (onError) {
          onError(error);
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const value = {
    isLoading,
    error,
    clearError,
    makeRequest,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}
