// app/lib/services/auth-service.ts

import { apiClient } from "@/lib/api/api-client";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import * as SecureStore from "expo-secure-store";
import { ToastAndroid } from "react-native";
import { FCMService } from "./fcm-service";

let backendLoginPromise: Promise<any> | null = null;
let backendLoginUid: string | null = null;

export const AuthService = {
  async syncBackendSession(
    firebaseUser: FirebaseAuthTypes.User,
    options?: { force?: boolean },
  ) {
    const uid = firebaseUser.uid;
    const force = options?.force ?? false;

    if (backendLoginPromise && backendLoginUid === uid) {
      return backendLoginPromise;
    }

    const storedUid = await SecureStore.getItemAsync("auth_uid");
    const lastSync = await SecureStore.getItemAsync("last_sync_time");
    const now = Date.now();

    const shouldSync =
      force ||
      storedUid !== uid ||
      !lastSync ||
      now - Number(lastSync) > 1000 * 60 * 60 * 12;

    if (!shouldSync) {
      return null;
    }

    backendLoginUid = uid;
    backendLoginPromise = (async () => {
      const token = await firebaseUser.getIdToken(force);
      const response = await apiClient.post(
        "/login",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await SecureStore.setItemAsync("auth_uid", uid);
      await SecureStore.setItemAsync("last_sync_time", now.toString());

      return response.data;
    })();

    try {
      return await backendLoginPromise;
    } finally {
      backendLoginPromise = null;
      backendLoginUid = null;
    }
  },

  async loginWithEmail(email: string, password: string) {
    const result = await auth().signInWithEmailAndPassword(email, password);
    return this.syncBackendSession(result.user, { force: true });
  },

  async registerWithEmail(email: string, password: string) {
    const result = await auth().createUserWithEmailAndPassword(email, password);
    return this.syncBackendSession(result.user, { force: true });
  },

  async loginWithGoogle(idToken: string) {
    const credential = auth.GoogleAuthProvider.credential(idToken);
    const result = await auth().signInWithCredential(credential);
    return this.syncBackendSession(result.user, { force: true });
  },

  async signInWithPhoneNumber(phoneNumber: string) {
    return auth().signInWithPhoneNumber(phoneNumber);
  },

  async confirmPhoneCode(confirm: any, code: string) {
    await confirm.confirm(code);
    const user = auth().currentUser;

    if (!user) throw new Error("User not found");

    return this.syncBackendSession(user, { force: true });
  },

  // 🔥 Add this method for FCM token
  async updateFcmToken(fcmToken: string): Promise<any> {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error("User not authenticated");

      const idToken = await user.getIdToken();

      const response = await apiClient.post(
        "/fcm/token",
        { fcm_token: fcmToken },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Update FCM token error:", error);
      throw error;
    }
  },

  async removeFcmToken(): Promise<void> {
    try {
      await apiClient.delete("/fcm/token");
    } catch (error) {
      console.error("Remove FCM token error:", error);
    }
  },

  async logout() {
    let res: any;
    try {
      await AuthService.removeFcmToken();
      await FCMService.deleteToken();

      res = await apiClient.post("/users/logout");
      console.log("Logout response:", res);
      ToastAndroid.show(res.data.message, ToastAndroid.SHORT);
    } catch (error) {
      console.error("Logout failed:", error);
    }
    await auth().signOut();
    await apiClient.clearAuth();
  },
};
