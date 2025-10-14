"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from "react";
import type { User } from "firebase/auth";
import { useAuth } from "@/components/auth/AuthProvider";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId: string | null;
}

export interface UserContextValue {
  profile: UserProfile | null;
  loading: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

const createProfile = (user: User | null): UserProfile | null => {
  if (!user) {
    return null;
  }

  const providerId = user.providerData?.[0]?.providerId ?? user.providerId ?? null;

  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? user.email ?? null,
    photoURL: user.photoURL ?? null,
    providerId,
  };
};

/**
 * Provides a memoised snapshot of the authenticated user's Google profile
 * details for downstream consumers.
 */
export function UserProfileProvider({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();

  const value = useMemo<UserContextValue>(() => {
    const profile = createProfile(user);
    return {
      profile,
      loading,
    };
  }, [
    user?.uid,
    user?.displayName,
    user?.email,
    user?.photoURL,
    user?.providerId,
    loading,
  ]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

type SelectorReturn<T> = T;
type Selector<T> = (value: UserContextValue) => SelectorReturn<T>;

/**
 * Selects a slice of the cached Firebase user profile without forcing consumers
 * to subscribe to unrelated authentication state.
 */
export function useUserProfileSelector<T>(selector: Selector<T>): SelectorReturn<T> {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserProfileSelector must be used within UserProfileProvider");
  }

  return useMemo(() => selector(context), [context, selector]);
}
