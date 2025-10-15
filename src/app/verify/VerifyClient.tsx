"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BoundTurnstileObject } from "react-turnstile";

const Turnstile = dynamic<React.ComponentType<any>>(
  async () => {
    const mod: any = await import("react-turnstile");
    return (mod?.Turnstile ?? mod?.default) as React.ComponentType<any>;
  },
  { ssr: false }
);

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Send2me";
const SUPPORT_EMAIL = "support@send2me.app";
const IS_PROD = process.env.NODE_ENV === "production";

function log(...args: any[]) {
  console.log(`[VerifyClient ${IS_PROD ? "PROD" : "DEV"} @ ${new Date().toISOString()}]`, ...args);
}

let hiddenElements: HTMLElement[] = [];

function hideGlobalChrome() {
  const tags = ["header", "nav", "footer"];
  hiddenElements = [];
  tags.forEach((tag) => {
    document.querySelectorAll<HTMLElement>(tag).forEach((el) => {
      if (el.style.display !== "none") {
        el.dataset.prevDisplay = el.style.display;
        el.style.display = "none";
        hiddenElements.push(el);
      }
    });
  });
  document.body.style.overflow = "hidden";
  log("→ Hiding chrome", hiddenElements.length);
}

function restoreGlobalChrome() {
  if (hiddenElements.length === 0) {
    // fallback scan if we lost the references
    document.querySelectorAll<HTMLElement>("header, nav, footer").forEach((el) => (el.style.display = ""));
    document.body.style.overflow = "";
    log("→ Fallback restore scan");
    return;
  }
  hiddenElements.forEach((el) => {
    el.style.display = el.dataset.prevDisplay || "";
    delete el.dataset.prevDisplay;
  });
  document.body.style.overflow = "";
  log("→ Restored chrome", hiddenElements.length);
  hiddenElements = [];
}

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

export function VerifyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = useMemo(
    () => sanitizeRedirectTarget(searchParams?.get("redirectTo") ?? null),
    [searchParams]
  );

  const [rayId, setRayId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [widgetKey, setWidgetKey] = useState(0);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const boundRef = useRef<BoundTurnstileObject | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    log("MOUNT: hiding chrome");
    hideGlobalChrome();
    return () => {
      log("UNMOUNT: restoring chrome");
      restoreGlobalChrome();
    };
  }, []);

  useEffect(() => {
    if (!rayId) {
      const id = generateRayId();
      setRayId(id);
      log("Generated Ray ID:", id);
    }
  }, [rayId]);

  const resetWidget = useCallback(() => {
    boundRef.current?.reset?.();
    boundRef.current = null;
    setWidgetKey((x) => x + 1);
    setWidgetLoaded(false);
  }, []);

  const downgradeToManual = useCallback(
    (msg?: string) => {
      log("Downgrade to manual:", msg);
      setStatus("error");
      setErrorMessage(msg ?? "Verification failed. Please try again.");
      setMode("manual");
      resetWidget();
    },
    [resetWidget]
  );

  const handleVerify = useCallback(
    async (token: string) => {
      if (!token) return;
      setStatus("verifying");
      log("Verification started", token.slice(0, 12) + "...");
      try {
        const r = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await r.json().catch(() => ({ ok: false }));
        if (!r.ok || !data.ok) throw new Error(data.error || "Verification failed");
        sessionStorage.setItem("turnstile-verified", "1");
        log("Verification success ✅");
        setStatus("success");
      } catch (e) {
        log("Verification error ❌", e);
        downgradeToManual(e instanceof Error ? e.message : "Verification failed");
      }
    },
    [downgradeToManual]
  );

  useEffect(() => {
    if (status !== "success") return;
    log("STATUS=success → scheduling redirect to:", redirectTarget);

    const t = setTimeout(() => {
      log("→ Redirecting now...");
      router.replace(redirectTarget);
      // run restore repeatedly because layout may be persistent
      const tries = [300, 800, 1500, 3000, 5000];
      tries.forEach((ms) =>
        setTimeout(() => {
          log(`Restore attempt after ${ms}ms`);
          restoreGlobalChrome();
        }, ms)
      );
    }, 500);
    return () => clearTimeout(t);
  }, [status, router, redirectTarget]);

  const headline = "Verifying you are human. This may take a few seconds.";
  const subline = `${SITE_NAME.toLowerCase()} needs to review the security of your connection before proceeding.`;
  const helper =
    status === "success"
      ? "Success! Redirecting…"
      : errorMessage
      ? errorMessage
      : mode === "manual"
      ? "Please complete the Turnstile challenge to continue."
      : status === "verifying"
      ? "Verifying your connection…"
      : "Checking your connection before granting access...";

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen flex-col items-center justify-center bg-white text-gray-900">
      <div className="flex flex-col items-center px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold text-gray-800">{SITE_NAME.toLowerCase()}</h1>
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
                  log("Turnstile loaded");
                  setWidgetLoaded(true);
                }}
                onError={() => {
                  log("Turnstile error");
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
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 underline">
              {SUPPORT_EMAIL}
            </a>
            .
            <button
              onClick={() => {
                setStatus("idle");
                setErrorMessage(null);
                setMode("manual");
                resetWidget();
              }}
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