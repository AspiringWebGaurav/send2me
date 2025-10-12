"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type TAndCModalProps = {
  open: boolean;
  onAccept: () => void;
  onClose: () => void;
};

export function TAndCModal({ open, onAccept, onClose }: TAndCModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-heading"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 id="terms-heading" className="text-xl font-semibold text-slate-900">
              Terms & Community Guidelines
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              We keep Send2me safe by moderating content and respecting privacy.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close terms window"
          >
            x
          </button>
        </div>

        <div className="space-y-3 text-sm text-slate-600">
          <p>
            By creating your link you agree that you will not encourage harassment, share illegal
            content, or collect data in violation of local laws. Messages are moderated with
            automated filters and rate limits.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>No hate speech, threats, or harassment.</li>
            <li>No sharing private information without consent.</li>
            <li>Use the dashboard tools to report or delete abusive messages.</li>
            <li>We hash IP and device data to keep Send2me healthy for everyone.</li>
          </ul>
          <p>
            You can review the full{" "}
            <a className="text-brand-600 underline" href="/legal/terms">
              Terms of Service
            </a>{" "}
            and{" "}
            <a className="text-brand-600 underline" href="/legal/privacy">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "rounded-2xl px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700",
            )}
          >
            Cancel
          </button>
          <Button onClick={onAccept} className="px-6">
            I agree
          </Button>
        </div>
      </div>
    </div>
  );
}
