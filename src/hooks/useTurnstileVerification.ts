"use client";

import { useCallback, useMemo } from "react";
import { useTurnstileVerificationContext } from "@/components/turnstile/TurnstileProvider";
import type { TurnstileStatus } from "@/types/turnstile";

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

/**
 * Provides an imperative API around the shared Turnstile verification state.
 * The hook centralises token verification, expiry handling, and error messaging.
 */
export function useTurnstileVerification(): UseTurnstileVerificationResult {
  const { state, dispatch } = useTurnstileVerificationContext();

  const verifyToken = useCallback(
    async (token: string) => {
      if (!token) {
        dispatch({
          type: "VERIFY_FAILURE",
          error: "Missing Turnstile token. Please retry verification.",
        });
        return false;
      }

      if (state.status === "success" && state.token === token) {
        return true;
      }

      dispatch({ type: "VERIFY_SUCCESS", token });
      return true;
    },
    [dispatch, state],
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, [dispatch]);

  const markExpired = useCallback(() => {
    dispatch({ type: "EXPIRED" });
  }, [dispatch]);

  const markFailed = useCallback(
    (message: string) => {
      dispatch({
        type: "VERIFY_FAILURE",
        error: message,
      });
    },
    [dispatch],
  );

  const markWidgetReady = useCallback(() => {
    dispatch({ type: "WIDGET_READY" });
  }, [dispatch]);

  const markWidgetLoading = useCallback(() => {
    dispatch({ type: "WIDGET_LOADING" });
  }, [dispatch]);

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
