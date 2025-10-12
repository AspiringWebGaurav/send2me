"use client";

import { cn, timeAgo } from "@/lib/utils";
import type { MessageRecord } from "@/types";

type MessageCardProps = {
  message: MessageRecord & {
    fromEmail?: string | null;
    fromGivenName?: string | null;
    fromFamilyName?: string | null;
    country?: string | null;
    device?: string | null;
  };
  highlight?: boolean;
};

export function MessageCard({ message, highlight }: MessageCardProps) {
  const senderName =
    !message.anon && (message.fromGivenName || message.fromFamilyName)
      ? `${message.fromGivenName ?? ""}${
          message.fromGivenName && message.fromFamilyName ? " " : ""
        }${message.fromFamilyName ?? ""}`.trim()
      : null;

  const sentAt = new Date(message.createdAt);
  const fullDate = sentAt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article
      className={cn(
        "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md",
        highlight && "border-brand-300 shadow-soft"
      )}
    >
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {message.anon
            ? "Anonymous"
            : senderName ?? message.fromUsername ?? "With identity"}
        </span>
        <span className="text-xs text-slate-400">
          {timeAgo(message.createdAt)}
        </span>
      </header>

      {/* Message body */}
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
        {message.text}
      </p>

      {/* Identity details */}
      {!message.anon && (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
          <div className="flex flex-col gap-1.5">
            {message.fromEmail && (
              <div className="flex items-center gap-2">
                <strong className="text-slate-700">Email:</strong>
                <span>{message.fromEmail}</span>
              </div>
            )}
            {senderName && (
              <div className="flex items-center gap-2">
                <strong className="text-slate-700">Name:</strong>
                <span>{senderName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <strong className="text-slate-700">Sent:</strong>
              <span>{fullDate}</span>
            </div>
            {message.country && (
              <div className="flex items-center gap-2">
                <strong className="text-slate-700">Location:</strong>
                <span>{message.country}</span>
              </div>
            )}
            {message.device && (
              <div className="flex items-center gap-2">
                <strong className="text-slate-700">Device:</strong>
                <span>{message.device}</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Shown because sender opted to send <strong>with identity</strong>.
          </p>
        </div>
      )}
    </article>
  );
}
