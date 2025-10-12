// File: /components/MessageFilterTabs.tsx
"use client";

import { cn } from "@/lib/utils";

type FilterValue = "all" | "anon" | "identified";

const filters: { value: FilterValue; label: string; description?: string }[] = [
  { value: "all", label: "All" },
  { value: "anon", label: "Anonymous" },
  { value: "identified", label: "With Identity" },
];

type MessageFilterTabsProps = {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
};

export function MessageFilterTabs({ value, onChange }: MessageFilterTabsProps) {
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white p-1 shadow-inner">
      {filters.map((filter) => {
        const isActive = value === filter.value;
        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            className={cn(
              "relative rounded-full px-4 py-1.5 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              isActive
                ? "bg-brand-600 text-white shadow-soft"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
            )}
            aria-pressed={isActive}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
