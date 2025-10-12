"use client";

import { FormEvent, useMemo, useState } from "react";
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
  const { push } = useToast();
  const { user, signIn, getToken } = useAuth();

  const hint = useMemo(() => messageClientHint(message), [message]);
  const characterCount = message.length;
  const isTooLong = characterCount > 500;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      validateMessage(message);
    } catch (error) {
      push({
        title: "Message invalid",
        description: error instanceof Error ? error.message : "Please adjust your message.",
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
        description: "Thanks for keeping Send2me respectful.",
      });
    } catch (error) {
      push({
        title: "Could not send",
        type: "error",
        description: error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={message}
        placeholder="Leave an encouraging note or helpful feedback..."
        onChange={(event) => setMessage(event.target.value)}
        rows={6}
      />
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className={isTooLong ? "text-red-500" : undefined}>{characterCount}/500</span>
        {hint ? <span className="text-red-500">{hint}</span> : <span>Be kind. Be specific.</span>}
      </div>
      <Switch
        checked={!anon}
        onCheckedChange={(checked) => {
          if (checked && !user) {
            signIn();
          }
          setAnon(!checked);
        }}
        label={anon ? "Send anonymously" : "Send with identity"}
      />
      <Button type="submit" loading={submitting} disabled={message.trim().length === 0 || isTooLong}>
        Send message
      </Button>
    </form>
  );
}
