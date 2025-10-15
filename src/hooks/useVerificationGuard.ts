"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useCallback } from "react";

/**
 * Hook to check verification status during client-side navigation
 */
export function useVerificationGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const checkVerification = useCallback(() => {
    // Check if we're on a public route
    const isPublicRoute = ["/verify", "/api/verify", "/api/turnstile"].some(
      (prefix) => pathname?.startsWith(prefix)
    );

    if (isPublicRoute) {
      return;
    }

    // Check for verification cookie
    const hasVerification = document.cookie
      .split("; ")
      .some((row) => row.startsWith("verified=1"));

    if (!hasVerification) {
      const currentPath =
        pathname +
        (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      router.replace(`/verify?returnTo=${encodeURIComponent(currentPath)}`);
    }
  }, [pathname, searchParams, router]);

  useEffect(() => {
    // Check on mount and pathname changes
    checkVerification();
  }, [pathname, checkVerification]);

  return { checkVerification };
}
