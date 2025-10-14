"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { BoundTurnstileObject } from "react-turnstile";

const Turnstile = dynamic(
  () =>
    import("react-turnstile").then((mod) => {
      if ("Turnstile" in mod) {
        return mod.Turnstile;
      }
      return mod.default;
    }),
  { ssr: false },
);

type VerificationMode = "auto" | "manual";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Send2me";
const AUTO_TRIGGER_DELAY_MS = 2000;

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

async function collectUserAgentData(): Promise<Record<string, unknown> | null> {
  if (typeof navigator === "undefined" || !(navigator as Navigator & { userAgentData?: unknown }).userAgentData) {
    return null;
  }

  try {
    const uaData = (navigator as Navigator & {
      userAgentData: {
        brands?: Array<{ brand: string; version: string }>;
        mobile?: boolean;
        platform?: string;
        getHighEntropyValues?: (
          hints: Array<
            "architecture" | "model" | "platform" | "platformVersion" | "uaFullVersion" | "bitness"
          >,
        ) => Promise<Record<string, string>>;
      };
    }).userAgentData;

    const highEntropy =
      uaData.getHighEntropyValues &&
      (await uaData.getHighEntropyValues([
        "architecture",
        "model",
        "platform",
        "platformVersion",
        "uaFullVersion",
        "bitness",
      ]));

    return {
      brands: uaData.brands ?? null,
      mobile: uaData.mobile ?? null,
      platform: highEntropy?.platform ?? uaData.platform ?? null,
      platformVersion: highEntropy?.platformVersion ?? null,
      architecture: highEntropy?.architecture ?? null,
      model: highEntropy?.model ?? null,
      uaFullVersion: highEntropy?.uaFullVersion ?? null,
      bitness: highEntropy?.bitness ?? null,
    };
  } catch {
    return null;
  }
}

export function VerifyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get("redirectTo") ?? null;
  const redirectTarget = useMemo(() => sanitizeRedirectTarget(redirectParam), [redirectParam]);

  const [rayId, setRayId] = useState<string | null>(null);
  const [mode, setMode] = useState<VerificationMode>("auto");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoTriggerArmed, setAutoTriggerArmed] = useState(false);
  const [widgetKey, setWidgetKey] = useState(0);

  const boundRef = useRef<BoundTurnstileObject | null>(null);
  const autoTriggerTimeoutRef = useRef<number | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    document.body.classList.add("chrome-hidden");
    return () => {
      document.body.classList.remove("chrome-hidden");
    };
  }, []);

  const downgradeToManual = useCallback((message?: string) => {
    setStatus("error");
    setErrorMessage(
      message ?? "Automatic verification failed. Please complete the challenge below.",
    );
    setMode("manual");
    setAutoTriggerArmed(false);
    if (autoTriggerTimeoutRef.current) {
      window.clearTimeout(autoTriggerTimeoutRef.current);
      autoTriggerTimeoutRef.current = null;
    }
    boundRef.current?.reset();
    boundRef.current = null;
    setWidgetKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!rayId) {
      setRayId(generateRayId());
    }
  }, [rayId]);

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
    const timeout = window.setTimeout(() => {
      router.replace(redirectTarget);
    }, 600);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [status, router, redirectTarget]);

  const handleVerify = useCallback(
    async (token: string) => {
      if (!token) return;
      setStatus("verifying");
      setErrorMessage(null);

      try {
        const userAgentData = await collectUserAgentData();
        const response = await fetch("/api/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            rayId: rayId ?? "pending-ray",
            userAgentData: userAgentData ?? undefined,
          }),
          cache: "no-store",
          credentials: "same-origin",
        });

        const payload: unknown = await response
          .json()
          .catch(() => ({ ok: false, error: "Verification failed. Please try again." }));

        const ok = Boolean((payload as { ok?: unknown })?.ok);
        if (!response.ok || !ok) {
          const message =
            typeof (payload as { error?: unknown })?.error === "string"
              ? ((payload as { error?: unknown }).error as string)
              : "Verification failed. Please try again.";
          throw new Error(message);
        }

        setStatus("success");
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Verification failed. Please try again.";
        downgradeToManual(message);
      }
    },
    [rayId, downgradeToManual],
  );

  const handleLoad = useCallback(
    (_widgetId: string, bound: BoundTurnstileObject) => {
      boundRef.current = bound;
      if (mode === "auto" && autoTriggerArmed) {
        bound.execute();
      }
    },
    [mode, autoTriggerArmed],
  );

  const handleError = useCallback(
    (_error?: unknown) => {
      downgradeToManual("Automatic verification failed. Please complete the challenge below.");
    },
    [downgradeToManual],
  );

  const handleTimeout = useCallback(() => {
    downgradeToManual("Verification timed out. Please complete the challenge below.");
  }, [downgradeToManual]);

  const handleExpire = useCallback(
    () => downgradeToManual("Verification expired. Please refresh the challenge."),
    [downgradeToManual],
  );

  const handleUnsupported = useCallback(
    () => downgradeToManual("Your browser requires manual verification. Please check the box below."),
    [downgradeToManual],
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
    <div className="fixed inset-0 flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="space-y-4">
          <h1 className="text-xl font-medium text-slate-800">
            Verifying your browser before accessing {SITE_NAME}...
          </h1>
          <p className="text-sm text-slate-500">
            This process is automatic. Your browser will redirect to your requested content in a moment.
          </p>
          <div className="flex justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          </div>
          <p className={`text-sm ${supportingToneClass}`}>
            {supportingMessage}
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center space-y-3">
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
            <div className="w-full rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              Cloudflare Turnstile site key missing. Please contact the site owner.
            </div>
          )}
        </div>

        {rayId ? (
          <div className="mt-8 border-t border-gray-200 pt-4">
            <p className="text-xs text-slate-400">Ray ID: {rayId}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
