"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BoundTurnstileObject, TurnstileProps } from "react-turnstile";
import { useChromeVisibility } from "@/components/ChromeVisibilityProvider";

const Turnstile = dynamic<TurnstileProps>(
  () =>
    import("react-turnstile").then((mod) => {
      const TurnstileComponent =
        "Turnstile" in mod ? mod.Turnstile : mod.default;
      return TurnstileComponent as React.ComponentType<TurnstileProps>;
    }),
  { ssr: false }
);

type VerificationMode = "auto" | "manual";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Send2me";
const AUTO_TRIGGER_DELAY_MS = 2000;
const SUPPORT_EMAIL = "support@send2me.app";

function generateRayId(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  } catch {
    return Math.random().toString(16).slice(2, 10);
  }
}

function sanitizeRedirectTarget(target: string | null): string {
  if (!target) return "/";
  if (!target.startsWith("/")) return "/";
  if (target.startsWith("//")) return "/";
  return target;
}

export function VerifyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnParam = searchParams?.get("returnTo") ?? null;
  const returnTarget = useMemo(
    () => sanitizeRedirectTarget(returnParam),
    [returnParam]
  );

  const [rayId, setRayId] = useState<string | null>(null);
  const [mode, setMode] = useState<VerificationMode>("auto");
  const [status, setStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoTriggerArmed, setAutoTriggerArmed] = useState(false);
  const [widgetKey, setWidgetKey] = useState(0);

  const boundRef = useRef<BoundTurnstileObject | null>(null);
  const autoTriggerTimeoutRef = useRef<number | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    try {
      window.sessionStorage.removeItem("turnstile-verified");
    } catch {
      // Ignore storage access issues.
    }
  }, []);

  const { setChromeHidden } = useChromeVisibility();

  useEffect(() => {
    setChromeHidden(true);
    return () => {
      setChromeHidden(false);
    };
  }, [setChromeHidden]);

  useEffect(() => {
    if (!rayId) {
      setRayId(generateRayId());
    }
  }, [rayId]);

  const resetWidget = useCallback(() => {
    setAutoTriggerArmed(false);
    if (autoTriggerTimeoutRef.current) {
      window.clearTimeout(autoTriggerTimeoutRef.current);
      autoTriggerTimeoutRef.current = null;
    }
    boundRef.current?.reset();
    boundRef.current = null;
    setWidgetKey((prev) => prev + 1);
  }, []);

  const downgradeToManual = useCallback(
    (message?: string) => {
      setStatus("error");
      setErrorMessage(message ?? "Verification failed. Please try again.");
      setMode("manual");
      try {
        window.sessionStorage.removeItem("turnstile-verified");
      } catch {
        // Ignore storage access issues.
      }
      resetWidget();
    },
    [resetWidget]
  );

  const handleRetry = useCallback(() => {
    setStatus("idle");
    setErrorMessage(null);
    setMode("manual");
    try {
      window.sessionStorage.removeItem("turnstile-verified");
    } catch {
      // Ignore storage access issues.
    }
    resetWidget();
  }, [resetWidget]);

  useEffect(() => {
    if (mode !== "auto") {
      return;
    }
    if (autoTriggerTimeoutRef.current) {
      window.clearTimeout(autoTriggerTimeoutRef.current);
    }

    autoTriggerTimeoutRef.current = window.setTimeout(() => {
      setAutoTriggerArmed(true);
    }, AUTO_TRIGGER_DELAY_MS);

    return () => {
      if (autoTriggerTimeoutRef.current) {
        window.clearTimeout(autoTriggerTimeoutRef.current);
        autoTriggerTimeoutRef.current = null;
      }
    };
  }, [mode]);

  useEffect(() => {
    if (mode === "auto" && autoTriggerArmed && boundRef.current) {
      boundRef.current.execute();
    }
  }, [mode, autoTriggerArmed]);

  useEffect(() => {
    if (status !== "success") return;

    // Ensure chrome is visible immediately
    setChromeHidden(false);

    // Set a flag in sessionStorage to indicate successful verification
    try {
      window.sessionStorage.setItem("verification-complete", "true");
    } catch {
      // Ignore storage access issues
    }

    // Force a hard redirect instead of using Next.js router to ensure a fresh page load
    const redirectUrl = returnTarget || "/";
    window.location.href = redirectUrl;
  }, [status, returnTarget, setChromeHidden]);

  const handleVerify = useCallback(
    async (token: string) => {
      if (!token) return;
      setStatus("verifying");
      setErrorMessage(null);

      try {
        const response = await fetch("/api/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
          cache: "no-store",
          credentials: "same-origin",
        });

        const payload: unknown = await response
          .json()
          .catch(() => ({ ok: false, error: "Verification failed" }));

        const ok = Boolean((payload as { ok?: unknown })?.ok === true);

        if (!response.ok || !ok) {
          const message =
            typeof (payload as { error?: unknown })?.error === "string"
              ? ((payload as { error?: unknown }).error as string)
              : "Verification failed";
          throw new Error(message);
        }

        try {
          window.sessionStorage.setItem("turnstile-verified", "1");
        } catch {
          // sessionStorage may be unavailable; ignore.
        }
        setStatus("success");
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Verification failed";
        downgradeToManual(message);
      }
    },
    [downgradeToManual]
  );

  const handleLoad = useCallback(
    (_widgetId: string, bound: BoundTurnstileObject) => {
      boundRef.current = bound;
      if (mode === "auto" && autoTriggerArmed) {
        bound.execute();
      }
    },
    [mode, autoTriggerArmed]
  );

  const handleError = useCallback(
    (_error?: unknown) => {
      downgradeToManual(
        "Verification failed. Please complete the challenge below."
      );
    },
    [downgradeToManual]
  );

  const handleTimeout = useCallback(() => {
    downgradeToManual(
      "Verification timed out. Please complete the challenge below."
    );
  }, [downgradeToManual]);

  const handleExpire = useCallback(
    () =>
      downgradeToManual("Verification expired. Please refresh the challenge."),
    [downgradeToManual]
  );

  const handleUnsupported = useCallback(
    () =>
      downgradeToManual(
        "Your browser requires manual verification. Please check the box below."
      ),
    [downgradeToManual]
  );

  const supportingMessage = useMemo(() => {
    if (status === "success") {
      return "Success! Redirecting you to your destination...";
    }
    if (errorMessage) {
      return errorMessage;
    }
    if (mode === "manual") {
      return "Please complete the Turnstile challenge to continue.";
    }
    if (status === "verifying") {
      return "Hang tight while we verify your browser...";
    }
    return "Checking your connection before granting access...";
  }, [mode, status, errorMessage]);

  const supportingToneClass = useMemo(() => {
    if (status === "success") {
      return "text-emerald-600";
    }
    if (errorMessage || status === "error") {
      return "text-red-600";
    }
    if (status === "verifying") {
      return "text-slate-600";
    }
    return "text-slate-500";
  }, [status, errorMessage]);

  return (
    <div className="fixed inset-0 min-h-screen bg-white">
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <h1 className="mb-6 text-3xl font-medium text-gray-900">{SITE_NAME}</h1>
        <h2 className="mb-8 text-xl text-gray-700">
          Verifying you are human. This may take a few seconds.
        </h2>

        {status !== "success" && (
          <div className="relative mb-4">
            <div className="h-10 w-10">
              <svg className="h-full w-full animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="rgb(209 213 219)"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  className="opacity-75"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="rgb(249 115 22)"
                  strokeWidth="4"
                  strokeDasharray="30 70"
                  fill="none"
                />
              </svg>
            </div>
            <span className="mt-4 block text-sm text-gray-600">
              Verifying...
            </span>
          </div>
        )}

        <div className="turnstile-container">
          {siteKey ? (
            <Turnstile
              key={widgetKey}
              sitekey={siteKey}
              appearance={mode === "auto" ? "execute" : "always"}
              execution={mode === "auto" ? "execute" : "render"}
              {...(mode === "manual" ? { size: "normal" as const } : {})}
              onVerify={handleVerify}
              onLoad={handleLoad}
              onTimeout={handleTimeout}
              onError={handleError}
              onExpire={handleExpire}
              onUnsupported={handleUnsupported}
              refreshExpired="auto"
              retry="auto"
            />
          ) : (
            <div className="text-sm text-red-600">
              Turnstile verification unavailable. Please contact support.
            </div>
          )}
        </div>

        {status === "error" && (
          <div className="mt-6 text-center">
            <p className="text-sm text-red-600">{errorMessage}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 rounded px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Try again
            </button>
          </div>
        )}

        <div className="absolute bottom-8 text-xs text-gray-400">
          <p>
            {SITE_NAME} needs to review the security of your connection before
            proceeding.
          </p>
          {rayId && <p className="mt-2">Ray ID: {rayId}</p>}
          <div className="mt-4 flex items-center justify-center space-x-2">
            <span>Performance & security by</span>
            <a
              href="https://www.cloudflare.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Cloudflare
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
