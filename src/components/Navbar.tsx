"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoginButton } from "@/components/auth/LoginButton";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/legal/terms", label: "Terms" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, getToken } = useAuth();
  const [loadingStats, setLoadingStats] = useState(false);
  const [messageCount, setMessageCount] = useState<number | null>(null);
  const [badgePulse, setBadgePulse] = useState(false);
  const previousCountRef = useRef<number | null>(null);
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function loadStats(silent = false) {
      if (!user) return;
      try {
        if (!silent) setLoadingStats(true);
        const token = await getToken();
        if (!token || cancelled) return;

        const response = await fetch("/api/messages/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to load inbox stats");

        const data: { ok: boolean; stats?: { total: number } } = await response.json();
        if (cancelled || !data.ok || !data.stats) return;

        setMessageCount(data.stats.total);
        if (previousCountRef.current !== null && data.stats.total > previousCountRef.current) {
          setBadgePulse(true);
          if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
          pulseTimeoutRef.current = setTimeout(() => setBadgePulse(false), 2000);
        }
        previousCountRef.current = data.stats.total;
      } catch (error) {
        if (!silent && !cancelled) console.error("[Navbar] Failed to fetch message stats", error);
      } finally {
        if (!silent && !cancelled) setLoadingStats(false);
      }
    }

    if (!user) {
      setMessageCount(null);
      setLoadingStats(false);
      previousCountRef.current = null;
      if (intervalId) clearInterval(intervalId);
      return;
    }

    loadStats(false);
    intervalId = setInterval(() => loadStats(true), 15000);

    return () => {
      cancelled = true;
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = null;
      }
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, getToken]);

  return (
    <header
      className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md"
      data-app-chrome="navbar"
    >
      <div className="flex w-full items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Left: Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-slate-900"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-600 text-white">
            S2
          </span>
          <span>Send2me</span>
        </Link>

        {/* Middle: Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition hover:text-slate-900",
                pathname === link.href && "text-slate-900 font-semibold"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: Inbox + Login */}
        <div className="flex items-center gap-3">
          <ProfileInfo />
          {user && (
            <Link
              href="/dashboard"
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700",
                badgePulse && "ring-2 ring-brand-200 ring-offset-2 ring-offset-white"
              )}
            >
              <span>Inbox</span>
              <span
                className={cn(
                  "flex h-5 min-w-[1.75rem] items-center justify-center rounded-full bg-brand-600 px-2 text-xs font-semibold text-white transition",
                  badgePulse && "animate-pulse"
                )}
              >
                {loadingStats ? "…" : messageCount ?? 0}
              </span>
            </Link>
          )}
          <LoginButton />
        </div>
      </div>
    </header>
  );
}
