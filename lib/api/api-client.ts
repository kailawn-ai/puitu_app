// lib/api/api-client.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";
import { getDeviceInfo } from "../device/device-info";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  "https://puitu.buannelstudio.in/api/v1";
const API_TIMEOUT = 30000;
const TOKEN_REFRESH_BUFFER_SECONDS = 60;

interface RequestOptions extends RequestInit {
  timeout?: number;
  skipAuth?: boolean;
  omitJsonContentType?: boolean;
  params?: Record<
    string,
    string | number | boolean | null | undefined | Array<string | number | boolean>
  >;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
  success: boolean;
  meta?: any;
  raw?: any;
}

interface ApiError {
  message: string;
  status: number;
  data?: any;
}

export type UploadFileInput =
  | string
  | {
      uri: string;
      name?: string;
      type?: string;
    };

class ApiClient {
  private accessTokenCache: string | null = null;
  private accessTokenPromise: Promise<string | null> | null = null;
  private lastStoredToken: string | null = null;

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

  private getTokenExpiry(token: string): number | null {
    try {
      const [, payloadPart] = token.split(".");
      if (!payloadPart) {
        return null;
      }
      const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const padded =
        normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
      if (typeof atob !== "function") {
        return null;
      }
      const decoded = atob(padded);
      const payload = JSON.parse(decoded);
      return typeof payload.exp === "number" ? payload.exp : null;
    } catch {
      return null;
    }
  }

  private isTokenUsable(token: string | null): boolean {
    if (!token) {
      return false;
    }
    const exp = this.getTokenExpiry(token);
    if (!exp) {
      return false;
    }
    const now = Math.floor(Date.now() / 1000);
    return exp - now > TOKEN_REFRESH_BUFFER_SECONDS;
  }

  private async getAccessToken(): Promise<string | null> {
    if (this.isTokenUsable(this.accessTokenCache)) {
      return this.accessTokenCache;
    }

    if (this.accessTokenPromise) {
      return this.accessTokenPromise;
    }

    this.accessTokenPromise = this.resolveAccessToken();
    try {
      return await this.accessTokenPromise;
    } finally {
      this.accessTokenPromise = null;
    }
  }

  private async resolveAccessToken(): Promise<string | null> {
    try {
      // Try to get from Firebase (if using Firebase Auth with Laravel Sanctum)
      const user = auth().currentUser;
      if (user) {
        const cachedUserToken = this.accessTokenCache;
        if (this.isTokenUsable(cachedUserToken)) {
          return cachedUserToken;
        }

        const idToken = await user.getIdToken();
        this.accessTokenCache = idToken;

        // Persist only when token actually changed
        if (this.lastStoredToken !== idToken) {
          await AsyncStorage.setItem("@access_token", idToken);
          this.lastStoredToken = idToken;
        }
        return idToken;
      }

      // Fallback to AsyncStorage
      const storedToken = await AsyncStorage.getItem("@access_token");
      if (this.isTokenUsable(storedToken)) {
        this.accessTokenCache = storedToken;
        this.lastStoredToken = storedToken;
        return storedToken;
      }
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
    const payload = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    if (response.status === 401) {
      const code = payload?.code;

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
        message: payload?.message || "An error occurred",
        status: response.status,
        data: payload,
      } as ApiError;
    }

    return {
      data: payload?.data ?? payload,
      status: response.status,
      message: payload?.message,
      success: payload?.status === "success",
      meta: payload?.meta,
      raw: payload,
    };
  }

  private buildQueryString(
    params?: RequestOptions["params"],
  ): string {
    if (!params) {
      return "";
    }

    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          searchParams.append(key, String(item));
        });
        return;
      }

      searchParams.append(key, String(value));
    });

    const query = searchParams.toString();
    return query ? `?${query}` : "";
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const {
      timeout = API_TIMEOUT,
      skipAuth = false,
      omitJsonContentType = false,
      params,
      ...fetchOptions
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers = await this.getHeaders(skipAuth);

      if (omitJsonContentType) {
        delete headers["Content-Type"];
      }

      const requestUrl = `${API_BASE_URL}${endpoint}${this.buildQueryString(params)}`;
      const response = await fetch(requestUrl, {
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
    file: UploadFileInput,
    fieldName = "file",
    additionalData: Record<string, any> = {},
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    const filePayload =
      typeof file === "string"
        ? {
            uri: file,
            type: "image/jpeg",
            name: file.split("/").pop() || "photo.jpg",
          }
        : {
            uri: file.uri,
            type: file.type || "application/octet-stream",
            name: file.name || file.uri.split("/").pop() || "upload.file",
          };

    // @ts-ignore
    formData.append(fieldName, filePayload);

    // Append additional data
    Object.keys(additionalData).forEach((key) => {
      formData.append(key, additionalData[key]);
    });

    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
      omitJsonContentType: true,
    });
  }

  // Clear stored tokens
  async clearAuth(): Promise<void> {
    await AsyncStorage.removeItem("@access_token");
    this.accessTokenCache = null;
    this.accessTokenPromise = null;
    this.lastStoredToken = null;
    // You might want to keep device ID for analytics
  }
}

export const apiClient = new ApiClient();
