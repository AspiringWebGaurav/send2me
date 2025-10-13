"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const primaryActionClass =
  "inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const secondaryActionClass =
  "inline-flex items-center justify-center rounded-2xl border border-brand-200 bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const quickLinks = [
  {
    href: "/#features",
    label: "Explore features",
    description: "See how Send2me keeps anonymous messages safe and respectful.",
  },
  {
    href: "/#how-it-works",
    label: "How it works",
    description: "Follow the flow from sharing your link to moderating replies.",
  },
  {
    href: "/about",
    label: "Meet Send2me",
    description: "Learn the story behind Send2me and our safety-first mission.",
  },
];

export default function NotFound() {
  const pathname = usePathname();

  const { headline, supportingTitle, supportingCopy } = useMemo(() => {
    const decoded = pathname ? decodeURIComponent(pathname) : "/";
    const segments = decoded.split("/").filter(Boolean);
    const lastSegment = segments.at(-1) ?? "";
    const hasSymbols = /[^a-zA-Z0-9-_]/.test(lastSegment);
    const looksEmpty = decoded === "/" || decoded === "";
    const isLikelyInvalidEntry = (hasSymbols && lastSegment.length > 0) || looksEmpty;

    if (isLikelyInvalidEntry) {
      return {
        headline: "Opps! Invalid entry",
        supportingTitle: "That entry doesn’t look right.",
        supportingCopy:
          "Double-check your link or pick one of the quick links below to get back into Send2me.",
      };
    }

    return {
      headline: "404",
      supportingTitle: "This page missed your Send2me inbox.",
      supportingCopy:
        "The link you followed is no longer live or never existed. Let's guide you back where things happen.",
    };
  }, [pathname]);

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="absolute inset-0 bg-gradient-to-br from-white via-brand-50/40 to-white"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-[-10rem] top-[-8rem] h-64 w-64 rounded-full bg-brand-200/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[-8rem] bottom-[-6rem] h-80 w-80 rounded-full bg-brand-400/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex w-full max-w-5xl flex-col gap-8 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft backdrop-blur-md sm:p-10">
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            Not found
          </span>
          <div className="flex flex-col gap-3">
            <span className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
              {headline}
            </span>
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              {supportingTitle}
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
              {supportingCopy}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link href="/" className={primaryActionClass}>
            Go to homepage
          </Link>
          <Link href="/dashboard" className={secondaryActionClass}>
            Open my inbox
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/90 p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft"
            >
              <span className="text-sm font-semibold text-slate-900">{item.label}</span>
              <span className="text-xs text-slate-500 sm:text-sm">{item.description}</span>
              <span className="mt-1 inline-flex items-center text-xs font-semibold text-brand-600">
                Continue →
              </span>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-slate-500 sm:text-sm">
          Need a hand? Reach Send2me support at{" "}
          <a
            href="mailto:support@send2me.app"
            className="font-medium text-brand-700 underline-offset-2 transition hover:underline"
          >
            support@send2me.app
          </a>
          .
        </p>
      </div>
    </div>
  );
}
