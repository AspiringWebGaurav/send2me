"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { FullScreenLoader } from "@/components/ui/FullScreenLoader";

type LoadingOverlayContextValue = {
  showLoading: (label?: string) => void;
  hideLoading: () => void;
};

type LoadingOverlayState = {
  count: number;
  label?: string;
};

const LoadingOverlayContext = createContext<LoadingOverlayContextValue | undefined>(undefined);

export function LoadingOverlayProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LoadingOverlayState>({ count: 0, label: undefined });

  const showLoading = useCallback((label?: string) => {
    setState((prev) => ({
      count: prev.count + 1,
      label: label ?? prev.label ?? "Loading Send2me...",
    }));
  }, []);

  const hideLoading = useCallback(() => {
    setState((prev) => {
      const nextCount = Math.max(0, prev.count - 1);
      if (nextCount === 0) {
        return { count: 0, label: undefined };
      }
      return { count: nextCount, label: prev.label };
    });
  }, []);

  const value = useMemo(
    () => ({
      showLoading,
      hideLoading,
    }),
    [showLoading, hideLoading],
  );

  const { count, label } = state;

  return (
    <LoadingOverlayContext.Provider value={value}>
      {children}
      {count > 0 ? <FullScreenLoader label={label ?? "Loading Send2me..."} /> : null}
    </LoadingOverlayContext.Provider>
  );
}

export function useLoadingOverlay() {
  const context = useContext(LoadingOverlayContext);
  if (!context) {
    throw new Error("useLoadingOverlay must be used within a LoadingOverlayProvider");
  }
  return context;
}
