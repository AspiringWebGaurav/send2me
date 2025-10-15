"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTurnstileVerificationContext } from "@/components/turnstile/TurnstileProvider";
import { describeTurnstileErrors } from "@/lib/turnstile";
import type { TurnstileStatus } from "@/types/turnstile";

interface VerificationResponse {
  ok: boolean;
  error?: string;
  errors?: string[];
}

const DEFAULT_ERROR_MESSAGE =
  "Turnstile verification failed. Please refresh the challenge and try again.";

export interface UseTurnstileVerificationResult {
  status: TurnstileStatus;
  token: string | null;
  error: string | null;
  isLoading: boolean;
  isWidgetReady: boolean;
  isSuccessful: boolean;
  hasFailed: boolean;
  verifyToken: (token: string) => Promise<boolean>;
  reset: () => void;
  markExpired: () => void;
  markFailed: (message: string) => void;
  markWidgetReady: () => void;
  markWidgetLoading: () => void;
}

function parseVerificationError(payload: unknown): {
  message: string;
  codes: string[];
} {
  if (!payload || typeof payload !== "object") {
    return { message: DEFAULT_ERROR_MESSAGE, codes: [] };
  }

  const data = payload as VerificationResponse;
  const codes =
    Array.isArray(data.errors) &&
    data.errors.every((code) => typeof code === "string")
      ? (data.errors as string[])
      : [];

  const message =
    typeof data.error === "string" && data.error.trim().length > 0
      ? data.error.trim()
      : describeTurnstileErrors(codes);

  return { message, codes };
}

/**
 * Provides an imperative API around the shared Turnstile verification state.
 * The hook centralises token verification, expiry handling, and error messaging.
 */
export function useTurnstileVerification(): UseTurnstileVerificationResult {
  const { state, dispatch } = useTurnstileVerificationContext();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Sync verification state from sessionStorage on mount
    try {
      const isVerified =
        window.sessionStorage.getItem("turnstile-verified") === "1";
      const verificationTime = parseInt(
        window.sessionStorage.getItem("turnstile-verified-at") || "0",
        10
      );
      const hasExpired = Date.now() - verificationTime > 3600000; // 1 hour expiration

      if (isVerified && !hasExpired && state.status !== "success") {
        dispatch({ type: "VERIFY_SUCCESS", token: "session" });
      } else if (hasExpired) {
        // Clear expired verification
        window.sessionStorage.removeItem("turnstile-verified");
        window.sessionStorage.removeItem("turnstile-verified-at");
        dispatch({ type: "EXPIRED" });
      }
    } catch {
      // Ignore storage access issues
    }
  }, []);

  const abortVerification = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const verifyToken = useCallback(
    async (token: string) => {
      const trimmed = token?.trim();
      if (!trimmed) {
        dispatch({
          type: "VERIFY_FAILURE",
          error:
            "Missing Turnstile token. Please retry the verification challenge.",
        });
        return false;
      }

      if (state.status === "success" && state.token === trimmed) {
        return true;
      }

      if (state.status === "verifying" && state.token === trimmed) {
        // A verification request is already in-flight for this token.
        return false;
      }

      abortVerification();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      dispatch({ type: "VERIFY_PENDING", token: trimmed });

      try {
        const response = await fetch("/api/turnstile/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: trimmed }),
          cache: "no-store",
          signal: controller.signal,
        });

        const payload: unknown = await response
          .json()
          .catch(() => ({ ok: false, error: DEFAULT_ERROR_MESSAGE }));

        if (!response.ok) {
          const { message } = parseVerificationError(payload);
          dispatch({
            type: "VERIFY_FAILURE",
            error: message,
          });
          return false;
        }

        // Store verification time for expiry checks
        try {
          window.sessionStorage.setItem("turnstile-verified", "1");
          window.sessionStorage.setItem(
            "turnstile-verified-at",
            Date.now().toString()
          );
        } catch {
          // Ignore storage access issues
        }
        dispatch({ type: "VERIFY_SUCCESS", token: trimmed });
        return true;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // A newer verification cycle superseded this request.
          return false;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Turnstile verification request failed.";
        dispatch({
          type: "VERIFY_FAILURE",
          error: message || DEFAULT_ERROR_MESSAGE,
        });
        return false;
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [abortVerification, dispatch, state.status, state.token]
  );

  const reset = useCallback(() => {
    abortVerification();
    dispatch({ type: "RESET" });
  }, [abortVerification, dispatch]);

  const markExpired = useCallback(() => {
    abortVerification();
    dispatch({ type: "EXPIRED" });
  }, [abortVerification, dispatch]);

  const markFailed = useCallback(
    (message: string) => {
      abortVerification();
      dispatch({
        type: "VERIFY_FAILURE",
        error: message,
      });
    },
    [abortVerification, dispatch]
  );

  const markWidgetReady = useCallback(() => {
    dispatch({ type: "WIDGET_READY" });
  }, [dispatch]);

  const markWidgetLoading = useCallback(() => {
    abortVerification();
    dispatch({ type: "WIDGET_LOADING" });
  }, [abortVerification, dispatch]);

  const derived = useMemo(() => {
    const { status, token, error, isWidgetReady } = state;
    return {
      status,
      token,
      error,
      isLoading: status === "verifying",
      isWidgetReady,
      isSuccessful: status === "success",
      hasFailed: status === "failed",
    };
  }, [state]);

  return {
    ...derived,
    verifyToken,
    reset,
    markExpired,
    markFailed,
    markWidgetReady,
    markWidgetLoading,
  };
}
