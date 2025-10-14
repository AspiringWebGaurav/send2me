"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { messageClientHint, validateMessage } from "@/lib/moderation";

type MessageFormProps = {
  toUsername: string;
};

export function MessageForm({ toUsername }: MessageFormProps) {
  const [message, setMessage] = useState("");
  const [anon, setAnon] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0); // seconds left in cooldown

  const { push } = useToast();
  const { user, signIn, getToken } = useAuth();

  const hint = useMemo(() => messageClientHint(message), [message]);
  const characterCount = message.length;
  const isTooLong = characterCount > 500;

  // Countdown timer for cooldown display
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

      setMessage("");
      setAnon(true);
      push({
        title: "Message sent",
        type: "success",
        description:
          "Thanks for keeping Send2me respectful. You can send another message in 100 seconds.",
      });

      // Start cooldown
      setCooldown(100);
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
  };

  const isDisabled = submitting || cooldown > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 transition-opacity duration-300"
    >
      {/* Message box */}
      <div className="relative">
        <Textarea
          value={message}
          placeholder="Leave an encouraging note or helpful feedback..."
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
          disabled={isDisabled}
          className={isDisabled ? "opacity-60 cursor-not-allowed" : ""}
        />

        {/* Cooldown overlay */}
        {cooldown > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-md">
            <span className="text-sm text-gray-600 font-medium">
              ⏳ You can send your next message in{" "}
              <span className="font-semibold text-blue-600">{cooldown}s</span>
            </span>
            <span className="text-xs text-gray-400 mt-1">
              (Send2me policy: Please wait between messages)
            </span>
          </div>
        )}
      </div>

      {/* Character count and hint */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className={isTooLong ? "text-red-500" : undefined}>
          {characterCount}/500
        </span>
        {hint ? (
          <span className="text-red-500">{hint}</span>
        ) : (
          <span>Be kind. Be specific.</span>
        )}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between w-full">
        {/* Left: Send anonymously switch */}
        <div className="flex items-center gap-2">
          <Switch
            checked={!anon}
            onCheckedChange={(checked) => {
              if (checked && !user) {
                signIn();
              }
              setAnon(!checked);
            }}
            disabled={isDisabled}
            label={anon ? "Send anonymously" : "Send with identity"}
          />
        </div>

        {/* Center: Dummy Turnstile placeholder */}
        <div className="flex justify-center">
          <button
            type="button"
            className="px-3 py-1 text-sm bg-gray-200 text-gray-600 rounded-md cursor-default"
            disabled
          >
            Turnstile here
          </button>
        </div>

        {/* Right: Send message button */}
        <div>
          <Button
            type="submit"
            loading={submitting}
            disabled={message.trim().length < 2 || isTooLong || isDisabled}
          >
            {cooldown > 0 ? "Wait..." : "Send message"}
          </Button>
        </div>
      </div>
    </form>
  );
}