"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase";
import { useToast } from "@/components/Toast";

type AuthContextValue = {
  user: User | null;
  idToken: string | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getToken: (force?: boolean) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  const getToken = useCallback(
    async (force = false) => {
      if (!user) {
        setIdToken(null);
        return null;
      }
      const token = await user.getIdToken(force);
      setIdToken(token);
      return token;
    },
    [user],
  );

  const refreshToken = useCallback(async () => {
    await getToken(true);
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        const token = await nextUser.getIdToken();
        setIdToken(token);
      } else {
        setIdToken(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [getToken]);

  const signIn = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      await signInWithPopup(auth, googleProvider);
      push({
        title: "Signed in",
        type: "success",
        description: "You're ready to claim your Send2me link.",
      });
    } catch (error) {
      push({
        title: "Sign-in failed",
        type: "error",
        description: "Please try signing in again.",
      });
    }
  }, [push]);

  const signOut = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
      push({ title: "Signed out", type: "info", description: "See you again soon." });
    } catch (error) {
      push({
        title: "Sign-out failed",
        type: "error",
        description: "Something went wrong. Try again.",
      });
    }
  }, [push]);

  const value = useMemo(
    () => ({
      user,
      idToken,
      loading,
      signIn,
      signOut,
      refreshToken,
      getToken,
    }),
    [user, idToken, loading, signIn, signOut, refreshToken, getToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
