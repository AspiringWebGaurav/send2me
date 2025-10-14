"use client";

import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { UserProfileProvider } from "@/components/auth/UserContext";
import { LoadingOverlayProvider } from "@/components/LoadingOverlayProvider";
import { TurnstileVerificationProvider } from "@/components/turnstile/TurnstileProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <UserProfileProvider>
          <TurnstileVerificationProvider>
            <LoadingOverlayProvider>{children}</LoadingOverlayProvider>
          </TurnstileVerificationProvider>
        </UserProfileProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
