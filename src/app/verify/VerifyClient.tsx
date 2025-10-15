"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BoundTurnstileObject } from "react-turnstile";

// Dynamic import
const Turnstile = dynamic<React.ComponentType<any>>(
  async () => {
    const mod: any = await import("react-turnstile");
    return (mod?.Turnstile ?? mod?.default) as React.ComponentType<any>;
  },
  { ssr: false }
);

type VerificationMode = "auto" | "manual";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Send2me";
const SUPPORT_EMAIL = "support@send2me.app";
const IS_PROD = process.env.NODE_ENV === "production";

// ==========================================================================
// 🔍 Production-aware logger
// ==========================================================================
function debugLog(...args: any[]) {
  const time = new Date().toISOString();
  const env = IS_PROD ? "PROD" : "DEV";
  console.log(`[VerifyClient ${env} @ ${time}]`, ...args);
}

// ==========================================================================
// Helpers
// ==========================================================================
function generateRayId(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  } catch {
    return Math.random().toString(16).slice(2, 10);
  }
}

function sanitizeRedirectTarget(target: string | null): string {
  if (!target || !target.startsWith("/") || target.startsWith("//")) return "/";
  return target;
}

// ==========================================================================
// DOM manipulation
// ==========================================================================
function toggleGlobalChrome(hide: boolean) {
  const elements = document.querySelectorAll<HTMLElement>(
    "header, nav, footer"
  );
  debugLog(hide ? "→ Hiding chrome" : "→ Restoring chrome", elements.length, {
    elements: Array.from(elements).map((el) => el.tagName),
  });

  if (hide) {
    document.body.style.overflow = "hidden";
    elements.forEach((el) => (el.style.display = "none"));
  } else {
    document.body.style.overflow = "";
    elements.forEach((el) => (el.style.display = ""));
  }
}

// ==========================================================================
// Component
// ==========================================================================
export function VerifyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get("redirectTo") ?? null;
  const redirectTarget = useMemo(
    () => sanitizeRedirectTarget(redirectParam),
    [redirectParam]
  );

  const [rayId, setRayId] = useState<string | null>(null);
  const [mode, setMode] = useState<VerificationMode>("auto");
  const [status, setStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [widgetKey, setWidgetKey] = useState(0);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const boundRef = useRef<BoundTurnstileObject | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // ==========================================================================
  // Mount/unmount
  // ==========================================================================
  useEffect(() => {
    debugLog("MOUNT: hiding chrome");
    toggleGlobalChrome(true);
    return () => {
      debugLog("UNMOUNT: restoring chrome");
      toggleGlobalChrome(false);
    };
  }, []);

  useEffect(() => {
    try {
      sessionStorage.removeItem("turnstile-verified");
    } catch {}
  }, []);

  useEffect(() => {
    if (!rayId) {
      const id = generateRayId();
      debugLog("Generated Ray ID:", id);
      setRayId(id);
    }
  }, [rayId]);

  const resetWidget = useCallback(() => {
    debugLog("Resetting Turnstile widget");
    boundRef.current?.reset?.();
    boundRef.current = null;
    setWidgetKey((prev) => prev + 1);
    setWidgetLoaded(false);
  }, []);

  const downgradeToManual = useCallback(
    (msg?: string) => {
      debugLog("Downgrading to manual mode:", msg);
      setStatus("error");
      setErrorMessage(msg ?? "Verification failed. Please try again.");
      setMode("manual");
      resetWidget();
    },
    [resetWidget]
  );

  const handleRetry = useCallback(() => {
    debugLog("Manual retry clicked");
    setStatus("idle");
    setErrorMessage(null);
    setMode("manual");
    resetWidget();
  }, [resetWidget]);

  // ==========================================================================
  // Turnstile verification
  // ==========================================================================
  const handleVerify = useCallback(
    async (token: string) => {
      if (!token) return;
      setStatus("verifying");
      debugLog("Verification started → token:", token.slice(0, 12) + "...");
      try {
        const response = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const payload = await response.json().catch(() => ({ ok: false }));
        if (!response.ok || !payload.ok)
          throw new Error(payload.error || "Verification failed");

        sessionStorage.setItem("turnstile-verified", "1");
        debugLog("Verification success ✅");
        setStatus("success");
      } catch (e) {
        debugLog("Verification error ❌", e);
        downgradeToManual(
          e instanceof Error ? e.message : "Verification failed"
        );
      }
    },
    [downgradeToManual]
  );

  // ==========================================================================
  // Redirect + restore sequence (production-observable)
  // ==========================================================================
  useEffect(() => {
    if (status !== "success") return;

    const restoreAfterNewDOM = () => {
      const attempt = (label: string) => {
        debugLog(`Restore attempt: ${label}`);
        toggleGlobalChrome(false);
      };

      requestAnimationFrame(() => attempt("rAF"));
      setTimeout(() => attempt("t+300ms"), 300);
      setTimeout(() => attempt("t+1s"), 1000);
      setTimeout(() => attempt("t+2s"), 2000);
      setTimeout(() => attempt("t+4s"), 4000);
    };

    debugLog("STATUS=success → scheduling redirect to:", redirectTarget);
    const timer = setTimeout(() => {
      debugLog("→ Redirecting now...");
      router.replace(redirectTarget);
      restoreAfterNewDOM();
    }, 600);

    return () => clearTimeout(timer);
  }, [status, router, redirectTarget]);

  // ==========================================================================
  // UI
  // ==========================================================================
  const headline = "Verifying you are human. This may take a few seconds.";
  const subline = `${SITE_NAME.toLowerCase()} needs to review the security of your connection before proceeding.`;

  const helper = useMemo(() => {
    if (status === "success") return "Success! Redirecting…";
    if (errorMessage) return errorMessage;
    if (mode === "manual")
      return "Please complete the Turnstile challenge to continue.";
    if (status === "verifying") return "Verifying your connection…";
    return "Checking your connection before granting access...";
  }, [status, errorMessage, mode]);

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen flex-col items-center justify-center bg-white text-gray-900">
      <div className="flex flex-col items-center px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold text-gray-800">
          {SITE_NAME.toLowerCase()}
        </h1>

        <p className="mt-4 text-lg text-gray-800">{headline}</p>

        <div className="mt-8">
          {siteKey ? (
            <div className="flex flex-col items-center">
              {!widgetLoaded && (
                <div className="flex items-center justify-center mb-4">
                  <span className="h-6 w-6 animate-spin rounded-full border-4 border-gray-300 border-t-green-600" />
                </div>
              )}
              <Turnstile
                key={widgetKey}
                sitekey={siteKey}
                appearance="always"
                execution="render"
                onVerify={handleVerify}
                onLoad={() => {
                  debugLog("Turnstile loaded");
                  setWidgetLoaded(true);
                }}
                onError={() => {
                  debugLog("Turnstile error");
                  downgradeToManual("Verification failed.");
                }}
                refreshExpired="auto"
                retry="auto"
              />
              <p className="mt-3 text-xs text-gray-500 text-center">{helper}</p>
            </div>
          ) : (
            <div className="mt-6 text-center text-sm font-medium text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded">
              Cloudflare Turnstile site key missing. Contact {SUPPORT_EMAIL}.
            </div>
          )}
        </div>

        {status === "error" && (
          <div className="mt-6 text-sm text-gray-700 bg-gray-50 border border-gray-200 p-3 rounded-md max-w-sm">
            Verification failed. Retry or contact{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-blue-600 underline"
            >
              {SUPPORT_EMAIL}
            </a>
            .
            <button
              onClick={handleRetry}
              className="mt-3 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        )}

        <p className="mt-10 text-base text-gray-800">{subline}</p>
      </div>

      <div className="mt-16 border-t border-gray-200 w-full text-center py-4 text-xs text-gray-500">
        Ray ID: {rayId ?? "—"} <br />
        Performance &amp; security by{" "}
        <span className="text-blue-500">Cloudflare</span>
      </div>
    </div>
  );
}
