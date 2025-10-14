"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { TurnstileWidget } from "@/components/turnstile/TurnstileWidget";
import { useTurnstileVerification } from "@/hooks/useTurnstileVerification";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { messageClientHint, validateMessage } from "@/lib/moderation";
import { cn } from "@/lib/utils";

const MIN_MESSAGE_LENGTH = 2;
const MAX_MESSAGE_LENGTH = 500;
const COOLDOWN_SECONDS = 100;

export interface MessageFormProps {
  toUsername: string;
}

/**
 * Collects feedback for the specified recipient with Turnstile protection.
 */
export function MessageForm({ toUsername }: MessageFormProps) {
  const [message, setMessage] = useState("");
  const [anon, setAnon] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [widgetRefreshKey, setWidgetRefreshKey] = useState(0);

  const { push } = useToast();
  const { user, signIn, getToken } = useAuth();
  const {
    status: turnstileStatus,
    token: turnstileToken,
    isSuccessful: isTurnstileVerified,
    isLoading: isTurnstileLoading,
    isWidgetReady,
    hasFailed: hasTurnstileFailed,
    error: turnstileError,
    reset: resetTurnstile,
  } = useTurnstileVerification();

  const hint = useMemo(() => messageClientHint(message), [message]);
  const characterCount = message.length;
  const isTooLong = characterCount > MAX_MESSAGE_LENGTH;
  const meetsLengthRequirement = message.trim().length >= MIN_MESSAGE_LENGTH;
  const isInteractiveDisabled = submitting || cooldown > 0;
  const turnstileConfigured = Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  );

  const verificationLabel = useMemo(() => {
    if (!turnstileConfigured) {
      return "Verification unavailable. Contact support.";
    }
    if (!isWidgetReady) {
      return "Preparing verification...";
    }
    if (hasTurnstileFailed || turnstileStatus === "expired") {
      return "Verification failed, retry below.";
    }
    if (isTurnstileLoading) {
      return "Verifying...";
    }
    if (isTurnstileVerified) {
      return "Verification complete.";
    }
    return "Complete verification to enable sending.";
  }, [
    hasTurnstileFailed,
    isTurnstileLoading,
    isTurnstileVerified,
    isWidgetReady,
    turnstileConfigured,
    turnstileStatus,
  ]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleTurnstileReset = useCallback(() => {
    resetTurnstile();
    setWidgetRefreshKey((prev) => prev + 1);
  }, [resetTurnstile]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      try {
        validateMessage(message);
      } catch (error) {
        push({
          title: "Message invalid",
          description:
            error instanceof Error
              ? error.message
              : "Please adjust your message.",
          type: "error",
        });
        return;
      }

      if (!isTurnstileVerified) {
        push({
          title: "Verify to send",
          description: "Please complete the Turnstile verification first.",
          type: "warning",
        });
        return;
      }

      if (!anon && !user) {
        push({
          title: "Sign in required",
          description: "You need to sign in before sending with identity.",
          type: "warning",
        });
        await signIn();
        return;
      }

      if (!turnstileToken) {
        push({
          title: "Verification required",
          description: "Please complete the verification challenge.",
          type: "warning",
        });
        return;
      }

      setSubmitting(true);
      try {
        let token: string | null = null;
        if (!anon) {
          token = await getToken(true);
          if (!token) {
            push({
              title: "Missing session",
              description: "Please try signing in again before sending.",
              type: "error",
            });
            setSubmitting(false);
            return;
          }
        }

        const response = await fetch("/api/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(anon
              ? {}
              : {
                  Authorization: `Bearer ${token}`,
                }),
          },
          body: JSON.stringify({
            to: toUsername,
            text: message,
            anon,
            turnstileToken,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Unable to send message");
        }

        setMessage("");
        setAnon(true);
        push({
          title: "Message sent",
          type: "success",
          description:
            "Thanks for keeping Send2me respectful. You can send another message soon.",
        });
        setCooldown(COOLDOWN_SECONDS);
        handleTurnstileReset();
      } catch (error) {
        push({
          title: "Could not send",
          type: "error",
          description:
            error instanceof Error ? error.message : "Please try again later.",
        });
        handleTurnstileReset();
      } finally {
        setSubmitting(false);
      }
    },
    [
      anon,
      getToken,
      handleTurnstileReset,
      isTurnstileVerified,
      message,
      push,
      signIn,
      toUsername,
      user,
      turnstileToken,
    ]
  );

  const isSendDisabled =
    submitting ||
    cooldown > 0 ||
    isTooLong ||
    !meetsLengthRequirement ||
    !turnstileConfigured ||
    !isWidgetReady ||
    !isTurnstileVerified ||
    !turnstileToken ||
    isTurnstileLoading;

  const sendButtonClasses = isSendDisabled
    ? "!bg-slate-200 !text-slate-400 !shadow-none"
    : "!bg-blue-500 !text-white hover:!bg-blue-600";

  const showVerificationHint =
    hasTurnstileFailed || turnstileStatus === "expired";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 transition-opacity duration-300"
    >
      <div className="relative">
        <Textarea
          value={message}
          placeholder="Leave an encouraging note or helpful feedback..."
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
          disabled={isInteractiveDisabled}
          className={cn(
            isInteractiveDisabled ? "cursor-not-allowed opacity-60" : "",
            "rounded-2xl border-slate-200 shadow-sm focus:border-brand-400 focus:ring-brand-200"
          )}
        />

        {cooldown > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
            <span className="text-sm font-medium text-gray-600">
              Heads up: you can send your next message in{" "}
              <span className="font-semibold text-blue-600">{cooldown}s</span>
            </span>
            <span className="mt-1 text-xs text-gray-400">
              (Send2me policy: Please wait between messages)
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className={isTooLong ? "text-red-500" : undefined}>
          {characterCount}/{MAX_MESSAGE_LENGTH}
        </span>
        {hint ? (
          <span className="text-red-500">{hint}</span>
        ) : (
          <span>Be kind. Be specific.</span>
        )}
      </div>

           {/* Bottom section: Switch → Turnstile → Send button */}
      <div className="flex flex-col items-center gap-4">
        {/* Send anonymously switch */}
        <div className="flex justify-center w-full">
          <Switch
            checked={!anon}
            onCheckedChange={(checked) => {
              if (checked && !user) signIn();
              setAnon(!checked);
            }}
            disabled={isInteractiveDisabled}
            label={anon ? "Send anonymously" : "Send with identity"}
          />
        </div>

        {/* Turnstile verification */}
        <div className="flex flex-col items-center gap-2 w-full">
          <TurnstileWidget refreshKey={widgetRefreshKey} />
          <p className="text-xs text-slate-500">{verificationLabel}</p>
          {showVerificationHint && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 shadow-sm">
              <span>{turnstileError ?? "Verification failed. Try again."}</span>
              <button
                type="button"
                className="font-semibold underline decoration-red-400 underline-offset-2 transition hover:text-red-700"
                onClick={handleTurnstileReset}
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Send button */}
        <div className="flex justify-center w-full">
          <Button
            type="submit"
            variant="primary"
            className={cn(
              "min-w-[150px] rounded-2xl font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none",
              sendButtonClasses,
            )}
            loading={submitting}
            disabled={isSendDisabled}
          >
            {cooldown > 0 ? "Wait..." : "Send message"}
          </Button>
        </div>
      </div>

    </form>
  );
}
