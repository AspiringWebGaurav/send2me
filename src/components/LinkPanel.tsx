"use client";

// File: /components/LinkPanel.tsx
import { CopyButton } from "@/components/CopyButton";
import { usePreferredBaseUrl } from "@/hooks/usePreferredBaseUrl";
import { buildProfileUrl } from "@/lib/publicUrl";

type LinkPanelProps = {
  username: string;
};

export function LinkPanel({ username }: LinkPanelProps) {
  const baseUrl = usePreferredBaseUrl();
  const publicUrl = buildProfileUrl(baseUrl, username);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <h2 className="text-lg font-semibold text-slate-900">Your link</h2>
      <p className="mt-1 text-sm text-slate-600">
        Share this link to collect messages. You can swap to a custom domain
        later.
      </p>

      <div className="mt-4">
        {/* unified rounded container so the code + button share the same border radius */}
        <div className="flex items-center gap-3">
          <div className="flex-1 overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 px-3 py-2">
            <code className="block truncate text-sm text-slate-800">
              {publicUrl}
            </code>
          </div>
          <div className="shrink-0">
            <CopyButton value={publicUrl} label="Copy link" />
          </div>
        </div>
      </div>
    </div>
  );
}
