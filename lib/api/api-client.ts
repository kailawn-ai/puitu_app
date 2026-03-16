// lib/api/api-client.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";
import { getDeviceInfo } from "../device/device-info";

const API_BASE_URL = "http://192.168.1.41:8000/api/v1";
const API_TIMEOUT = 30000;

interface RequestOptions extends RequestInit {
  timeout?: number;
  skipAuth?: boolean;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
  success: boolean;
}

interface ApiError {
  message: string;
  status: number;
  data?: any;
}

class ApiClient {
  private async getHeaders(skipAuth = false): Promise<Record<string, string>> {
    const device = await getDeviceInfo();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Device-ID": device.id,
      "X-Device-Name": device.name,
    };

    if (!skipAuth) {
      const token = await this.getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async getAccessToken(): Promise<string | null> {
    try {
      // Try to get from Firebase (if using Firebase Auth with Laravel Sanctum)
      const user = auth().currentUser;
      if (user) {
        const idToken = await user.getIdToken();

        // Optionally store in AsyncStorage for offline access
        await AsyncStorage.setItem("@access_token", idToken);
        return idToken;
      }

      // Fallback to AsyncStorage
      const storedToken = await AsyncStorage.getItem("@access_token");
      return storedToken;
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem("@device_id");
      if (!deviceId) {
        // Generate a unique device ID
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem("@device_id", deviceId);
      }
      return deviceId;
    } catch (error) {
      return "unknown_device";
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get("content-type");
    const data = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    if (response.status === 401) {
      const code = data?.code;

      if (
        code === "450" ||
        code === "451" ||
        code === "452" ||
        code === "453" ||
        code === "454"
      ) {
        await this.clearAuth();
      }
    }

    if (!response.ok) {
      throw {
        message: data?.message || "An error occurred",
        status: response.status,
        data: data,
      } as ApiError;
    }

    return {
      data: data?.data ?? data,
      status: response.status,
      message: data?.message,
      success: data?.status === "success",
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const {
      timeout = API_TIMEOUT,
      skipAuth = false,
      ...fetchOptions
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers = await this.getHeaders(skipAuth);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers: {
          ...headers,
          ...(fetchOptions.headers || {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return await this.handleResponse<T>(response);
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw {
          message: "Request timeout. Please check your connection.",
          status: 408,
        } as ApiError;
      }

      throw {
        message:
          error.message || "Network error. Please check your connection.",
        status: error.status || 0,
        data: error.data,
      } as ApiError;
    }
  }

  async get<T>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }

  async uploadFile<T>(
    endpoint: string,
    fileUri: string,
    fieldName = "file",
    additionalData: Record<string, any> = {},
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();

    // @ts-ignore
    formData.append(fieldName, {
      uri: fileUri,
      type: "image/jpeg", // Adjust based on file type
      name: fileUri.split("/").pop() || "photo.jpg",
    });

    // Append additional data
    Object.keys(additionalData).forEach((key) => {
      formData.append(key, additionalData[key]);
    });

    const headers = await this.getHeaders();

    // Remove JSON headers for multipart/form-data
    delete headers["Content-Type"];

    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
      headers: headers as HeadersInit,
    });
  }

  // Clear stored tokens
  async clearAuth(): Promise<void> {
    await AsyncStorage.removeItem("@access_token");
    // You might want to keep device ID for analytics
  }
}

export const apiClient = new ApiClient();
