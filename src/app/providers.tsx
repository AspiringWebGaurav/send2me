"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { ToastProvider } from "@/components/Toast";
import { LoadingOverlayProvider } from "@/components/LoadingOverlayProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <LoadingOverlayProvider>{children}</LoadingOverlayProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
