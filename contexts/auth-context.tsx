// contexts/auth-context.tsx

import { apiClient } from "@/lib/api/api-client";
import { AuthService } from "@/lib/services/auth-service";
import {
  FirebaseAuthTypes,
  getAuth,
  signOut,
} from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  initializing: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  initializing: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const auth = getAuth();
  const hasCompletedInitialAuth = useRef(false);

  /**
   * 🔁 Listen for Firebase auth + silent token refresh
   */
  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged(async (firebaseUser) => {
      const isInitialBootstrap = !hasCompletedInitialAuth.current;

      try {
        if (isInitialBootstrap) {
          setLoading(true);
        }

        if (!firebaseUser) {
          // 🔓 Logged out
          await SecureStore.deleteItemAsync("auth_uid");
          await SecureStore.deleteItemAsync("last_sync_time");

          setUser(null);
          return;
        }

        const uid = firebaseUser.uid;

        // 🔎 check cached session
        const storedUid = await SecureStore.getItemAsync("auth_uid");
        const lastSync = await SecureStore.getItemAsync("last_sync_time");

        const now = Date.now();

        // 🧠 decide if backend sync needed
        const shouldSync =
          storedUid !== uid ||
          !lastSync ||
          now - Number(lastSync) > 1000 * 60 * 60 * 12; // 12 hours

        if (shouldSync) {
          console.log("🔄 Syncing backend session...");
          await apiClient.clearAuth();
          await AuthService.syncBackendSession(firebaseUser);

          console.log("✅ Backend session synced");
        } else {
          console.log("⚡ Using cached backend session");
        }

        setUser(firebaseUser);
      } catch (error) {
        Alert.alert("❌ Auth sync error:", error.message);

        // force logout if backend session invalid
        await signOut(auth);
        setUser(null);
      } finally {
        if (isInitialBootstrap) {
          hasCompletedInitialAuth.current = true;
          setInitializing(false);
          setLoading(false);
        }
      }
    });

    return unsubscribe;
  }, [auth]);

  /**
   * 🔓 Logout everything (Firebase + backend + cache)
   */
  const logout = async () => {
    try {
      await apiClient.post("/logout");

      await SecureStore.deleteItemAsync("auth_uid");
      await SecureStore.deleteItemAsync("last_sync_time");

      await GoogleSignin.signOut();
      await signOut(auth);

      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        initializing,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
