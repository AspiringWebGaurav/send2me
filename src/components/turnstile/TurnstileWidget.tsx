"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTurnstileVerification } from "@/hooks/useTurnstileVerification";

const ClientTurnstile = dynamic(
  () =>
    import("react-turnstile").then((mod) => {
      if ("Turnstile" in mod) {
        return mod.Turnstile;
      }
      return mod.default;
    }),
  { ssr: false },
);

export interface TurnstileWidgetProps {
  className?: string;
  refreshKey?: string | number;
}

/**
 * Lightweight wrapper around the Cloudflare Turnstile widget that wires the
 * lifecycle events to the shared verification store.
 */
export const TurnstileWidget = memo(function TurnstileWidget({
  className,
  refreshKey,
}: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const {
    verifyToken,
    markExpired,
    markFailed,
    markWidgetReady,
    markWidgetLoading,
    isLoading,
    isWidgetReady,
  } = useTurnstileVerification();

  useEffect(() => {
    if (!siteKey) {
      markFailed("Cloudflare Turnstile site key not configured.");
      return;
    }
    markWidgetLoading();
  }, [siteKey, refreshKey, markFailed, markWidgetLoading]);

  const widgetKey = useMemo(
    () => `turnstile-${refreshKey ?? 0}`,
    [refreshKey],
  );

  const handleVerify = useCallback(
    async (token: string) => {
      await verifyToken(token);
    },
    [verifyToken],
  );

  const handleExpire = useCallback(() => {
    markExpired();
  }, [markExpired]);

  const handleError = useCallback(
    (errorCode?: string) => {
      const message = errorCode
        ? `Verification error (${errorCode}). Please refresh the widget.`
        : "Verification failed. Please refresh the widget.";
      markFailed(message);
    },
    [markFailed],
  );

  const showOverlay = useMemo(
    () => Boolean(siteKey) && (!isWidgetReady || isLoading),
    [isLoading, isWidgetReady, siteKey],
  );

  const overlayLabel = !isWidgetReady ? "Loading verification..." : "Verifying...";

  const turnstileUnavailableMessage =
    "Verification unavailable. Please configure NEXT_PUBLIC_TURNSTILE_SITE_KEY.";

  const overlay = (
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
      <span className="mt-2 text-xs font-medium text-slate-600">{overlayLabel}</span>
    </div>
  );

  return (
    <div className={cn("relative flex min-h-[65px] w-full items-center justify-center", className)}>
      {!siteKey ? (
        <div className="flex w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600 shadow-sm">
          {turnstileUnavailableMessage}
        </div>
      ) : (
        <ClientTurnstile
          key={widgetKey}
          sitekey={siteKey}
          onVerify={handleVerify}
          onExpire={handleExpire}
          onError={handleError}
          onLoad={markWidgetReady}
          refreshExpired="auto"
        />
      )}
      {showOverlay && overlay}
    </div>
  );
});

TurnstileWidget.displayName = "TurnstileWidget";
