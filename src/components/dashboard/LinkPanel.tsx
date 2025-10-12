"use client";

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
        Share this link to collect messages. You can swap to a custom domain later.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <code className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-800">
          {publicUrl}
        </code>
        <CopyButton value={publicUrl} />
      </div>
    </div>
  );
}
