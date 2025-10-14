"use client";

import { memo, useCallback, useMemo, useState } from "react";
import {
  type UserContextValue,
  useUserProfileSelector,
} from "@/components/auth/UserContext";
import { cn } from "@/lib/utils";

export interface ProfileInfoProps {
  className?: string;
}

const getInitials = (displayName: string | null, email: string | null) => {
  const source = displayName?.trim() || email?.trim() || "";
  if (!source) {
    return "U";
  }
  const parts = source.split(" ").filter(Boolean);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Renders the authenticated user's profile summary inside the navigation bar.
 * The component relies on user context selectors to avoid unnecessary renders
 * when unrelated authentication state changes occur.
 */
export const ProfileInfo = memo(function ProfileInfo({ className }: ProfileInfoProps) {
  const selectProfile = useCallback(
    (state: UserContextValue) => state.profile,
    [],
  );
  const selectLoading = useCallback(
    (state: UserContextValue) => state.loading,
    [],
  );

  const profile = useUserProfileSelector(selectProfile);
  const loading = useUserProfileSelector(selectLoading);
  const [open, setOpen] = useState(false);

  const initials = useMemo(
    () => getInitials(profile?.displayName ?? null, profile?.email ?? null),
    [profile?.displayName, profile?.email],
  );

  const handleToggle = useCallback(() => {
    setOpen((previous) => !previous);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  if (loading || !profile) {
    return null;
  }

  const { displayName, email, photoURL } = profile;

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <button
        type="button"
        className="relative inline-flex h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        onClick={handleToggle}
        onFocus={handleOpen}
        onBlur={handleClose}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoURL}
            alt={displayName ? `${displayName}'s avatar` : "User avatar"}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-600">
            {initials}
          </span>
        )}
      </button>

      <div
        className={cn(
          "pointer-events-none absolute right-0 mt-3 w-60 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-lg transition-all duration-150 sm:w-64",
          open ? "pointer-events-auto translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoURL}
                alt={displayName ? `${displayName}'s avatar` : "User avatar"}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-600">
                {initials}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {displayName ?? "Send2me user"}
            </p>
            <p className="truncate text-xs text-slate-500">{email ?? "No email available"}</p>
            {profile.providerId && (
              <p className="mt-2 text-xs text-slate-400">
                Signed in with <span className="font-medium text-slate-500">{profile.providerId}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ProfileInfo.displayName = "ProfileInfo";
