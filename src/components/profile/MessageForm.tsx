"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { messageClientHint, validateMessage } from "@/lib/moderation";
import { cn } from "@/lib/utils";

const MIN_MESSAGE_LENGTH = 2;
const MAX_MESSAGE_LENGTH = 500;
const COOLDOWN_SECONDS = 100;
const COOLDOWN_STORAGE_KEY = "messageFormCooldownUntil";

export interface MessageFormProps {
  toUsername: string;
}

/**
 * Collects feedback for the specified recipient (no Turnstile).
 * Adds cooldown persistence using localStorage.
 */
export function MessageForm({ toUsername }: MessageFormProps) {
  const [message, setMessage] = useState("");
  const [anon, setAnon] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);

  const { push } = useToast();
  const { user, signIn, getToken } = useAuth();

  // --- Load persisted cooldown on mount ---
  useEffect(() => {
    const stored = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (stored) {
      const expiry = parseInt(stored, 10);
      const now = Date.now();
      if (expiry > now) {
        setCooldown(Math.ceil((expiry - now) / 1000));
      } else {
        localStorage.removeItem(COOLDOWN_STORAGE_KEY);
      }
    }
  }, []);

  // --- Cooldown countdown logic ---
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        const next = prev > 0 ? prev - 1 : 0;
        if (next <= 0) localStorage.removeItem(COOLDOWN_STORAGE_KEY);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const hint = useMemo(() => messageClientHint(message), [message]);
  const characterCount = message.length;
  const isTooLong = characterCount > MAX_MESSAGE_LENGTH;
  const meetsLengthRequirement = message.trim().length >= MIN_MESSAGE_LENGTH;
  const isInteractiveDisabled = submitting || cooldown > 0;

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

      if (!anon && !user) {
        push({
          title: "Sign in required",
          description: "You need to sign in before sending with identity.",
          type: "warning",
        });
        await signIn();
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
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Unable to send message");
        }

        // success
        setMessage("");
        setAnon(true);
        push({
          title: "Message sent",
          type: "success",
          description:
            "Thanks for keeping Send2me respectful. You can send another message soon.",
        });

        // start cooldown & persist to localStorage
        const expiry = Date.now() + COOLDOWN_SECONDS * 1000;
        localStorage.setItem(COOLDOWN_STORAGE_KEY, expiry.toString());
        setCooldown(COOLDOWN_SECONDS);
      } catch (error) {
        push({
          title: "Could not send",
          type: "error",
          description:
            error instanceof Error ? error.message : "Please try again later.",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [anon, getToken, message, push, signIn, toUsername, user]
  );

  const isSendDisabled =
    submitting || cooldown > 0 || isTooLong || !meetsLengthRequirement;

  const sendButtonClasses = isSendDisabled
    ? "!bg-slate-200 !text-slate-400 !shadow-none"
    : "!bg-blue-500 !text-white hover:!bg-blue-600";

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

      {/* Bottom section: Switch → Send button */}
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

        {/* Send button */}
        <div className="flex justify-center w-full">
          <Button
            type="submit"
            variant="primary"
            className={cn(
              "min-w-[150px] rounded-2xl font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none",
              sendButtonClasses
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
