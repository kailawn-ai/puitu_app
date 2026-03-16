import auth from "@react-native-firebase/auth";
import messaging, {
  FirebaseMessagingTypes,
} from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { AuthService } from "./auth-service";

const FCM_TOKEN_KEY = "fcm_token";
const FCM_TOKEN_SENT_KEY = "fcm_token_sent";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class FCMServiceClass {
  private static instance: FCMServiceClass;
  private pendingToken: string | null = null;
  private isInitialized = false;
  private tokenRefreshUnsubscribe: (() => void) | null = null;
  private onMessageUnsubscribe: (() => void) | null = null;
  private onOpenUnsubscribe: (() => void) | null = null;
  private notificationTapSubscription: { remove: () => void } | null = null;
  private recentForegroundMessageKeys = new Set<string>();

  private constructor() {}

  static getInstance(): FCMServiceClass {
    if (!FCMServiceClass.instance) {
      FCMServiceClass.instance = new FCMServiceClass();
    }
    return FCMServiceClass.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
          sound: "default",
        });
      }

      const permissionGranted = await this.requestPermission();
      this.configureNotificationOpenHandlers();

      if (!permissionGranted) {
        console.log("Notification permission denied.");
        this.isInitialized = true;
        return;
      }

      await this.ensureRemoteMessagesRegistration();
      await this.refreshToken();
      this.configureMessageHandlers();

      this.isInitialized = true;
      console.log("FCM initialized successfully.");
    } catch (error) {
      console.error("FCM initialization failed:", error);
    }
  }

  cleanup(): void {
    this.tokenRefreshUnsubscribe?.();
    this.tokenRefreshUnsubscribe = null;

    this.onMessageUnsubscribe?.();
    this.onMessageUnsubscribe = null;

    this.onOpenUnsubscribe?.();
    this.onOpenUnsubscribe = null;

    this.notificationTapSubscription?.remove();
    this.notificationTapSubscription = null;

    this.isInitialized = false;
  }

  private async requestPermission(): Promise<boolean> {
    try {
      const current = await Notifications.getPermissionsAsync();
      if (current.granted) {
        return true;
      }

      const requested = await Notifications.requestPermissionsAsync();
      return requested.granted;
    } catch (error) {
      console.error("Notification permission error:", error);
      return false;
    }
  }

  private async ensureRemoteMessagesRegistration(): Promise<void> {
    if (!messaging().isDeviceRegisteredForRemoteMessages) {
      await messaging().registerDeviceForRemoteMessages();
    }
  }

  private configureMessageHandlers(): void {
    this.tokenRefreshUnsubscribe = messaging().onTokenRefresh(async (token) => {
      await this.handleTokenRefresh(token);
    });

    this.onMessageUnsubscribe = messaging().onMessage(
      async (message: FirebaseMessagingTypes.RemoteMessage) => {
        await this.handleForegroundMessage(message);
      },
    );
  }

  private configureNotificationOpenHandlers(): void {
    this.onOpenUnsubscribe = messaging().onNotificationOpenedApp((message) => {
      this.handleRemoteMessageOpen(message);
    });

    messaging()
      .getInitialNotification()
      .then((message) => {
        if (message) {
          this.handleRemoteMessageOpen(message);
        }
      })
      .catch((error) =>
        console.error("Failed to get initial notification:", error),
      );

    this.notificationTapSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log("Notification tapped:", data);
      });
  }

  private async handleForegroundMessage(
    message: FirebaseMessagingTypes.RemoteMessage,
  ): Promise<void> {
    const title =
      message.notification?.title ||
      (typeof message.data?.title === "string" ? message.data.title : "") ||
      "New notification";
    const body =
      message.notification?.body ||
      (typeof message.data?.body === "string" ? message.data.body : "");
    const messageKey = this.getForegroundMessageKey(message, title, body);

    if (this.recentForegroundMessageKeys.has(messageKey)) {
      console.log("Skipping duplicate foreground FCM:", messageKey);
      return;
    }

    this.recentForegroundMessageKeys.add(messageKey);
    setTimeout(() => {
      this.recentForegroundMessageKeys.delete(messageKey);
    }, 10000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: message.data || {},
        sound: "default",
      },
      trigger: null,
    });
  }

  private getForegroundMessageKey(
    message: FirebaseMessagingTypes.RemoteMessage,
    title: string,
    body: string,
  ): string {
    if (message.messageId) {
      return message.messageId;
    }

    return JSON.stringify({
      title,
      body,
      data: message.data || {},
    });
  }

  private handleRemoteMessageOpen(
    message: FirebaseMessagingTypes.RemoteMessage,
  ): void {
    console.log("Notification opened:", message.data || {});
  }

  async getCurrentToken(): Promise<string | null> {
    try {
      if (this.pendingToken) {
        return this.pendingToken;
      }

      const storedToken = await SecureStore.getItemAsync(FCM_TOKEN_KEY);
      if (storedToken) {
        this.pendingToken = storedToken;
        return storedToken;
      }

      await this.ensureRemoteMessagesRegistration();
      const token = await messaging().getToken();
      if (token) {
        await this.storeTokenLocally(token);
      }

      return token || null;
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  }

  private async storeTokenLocally(token: string): Promise<void> {
    await SecureStore.setItemAsync(FCM_TOKEN_KEY, token);
    this.pendingToken = token;
  }

  private async handleTokenRefresh(newToken: string): Promise<void> {
    await this.storeTokenLocally(newToken);
    await SecureStore.deleteItemAsync(FCM_TOKEN_SENT_KEY);

    const isLoggedIn = await this.checkIfUserLoggedIn();
    if (isLoggedIn) {
      await this.sendTokenToBackend(newToken);
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      await this.ensureRemoteMessagesRegistration();
      const token = await messaging().getToken();
      if (!token) return null;

      await this.storeTokenLocally(token);
      console.log("FCM token refreshed:", `${token.substring(0, 20)}...`);
      return token;
    } catch (error) {
      console.error("Error refreshing FCM token:", error);
      return null;
    }
  }

  async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      await SecureStore.deleteItemAsync(FCM_TOKEN_KEY);
      await SecureStore.deleteItemAsync(FCM_TOKEN_SENT_KEY);
      this.pendingToken = null;
      console.log("FCM token deleted.");
    } catch (error) {
      console.error("Error deleting FCM token:", error);
    }
  }

  async sendTokenToBackend(token: string): Promise<boolean> {
    try {
      const response = await AuthService.updateFcmToken(token);
      if (response.status === "success") {
        await SecureStore.setItemAsync(FCM_TOKEN_SENT_KEY, "true");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error sending token to backend:", error);
      return false;
    }
  }

  private async checkIfUserLoggedIn(): Promise<boolean> {
    const currentUser = auth().currentUser;
    return !!currentUser;
  }

  async handleLoginSuccess(): Promise<boolean> {
    const token = await this.getCurrentToken();
    if (!token) return false;

    const tokenSent = await SecureStore.getItemAsync(FCM_TOKEN_SENT_KEY);
    if (tokenSent) return true;

    return this.sendTokenToBackend(token);
  }

  async scheduleLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: "default",
      },
      trigger: null,
    });
  }
}

export const FCMService = FCMServiceClass.getInstance();
