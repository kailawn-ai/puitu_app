// contexts/auth-context.tsx
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import React, { createContext, useContext, useEffect, useState } from "react";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  initializing: boolean;
  checkAuth: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  initializing: true,
  checkAuth: async () => false,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth().onAuthStateChanged((userState) => {
      console.log(
        "Auth state changed:",
        userState ? "User logged in" : "No user",
      );
      setUser(userState);
      setInitializing(false);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const checkAuth = async (): Promise<boolean> => {
    try {
      const currentUser = auth().currentUser;
      return !!currentUser;
    } catch (error) {
      console.error("Auth check error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await GoogleSignin.signOut();
      await auth().signOut();
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
        checkAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
