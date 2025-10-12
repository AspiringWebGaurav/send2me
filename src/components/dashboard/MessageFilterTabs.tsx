import { cn } from "@/lib/utils";

type FilterValue = "all" | "anon" | "identified";

const filters: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "anon", label: "Anonymous" },
  { value: "identified", label: "With identity" },
];

type Props = {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
};

export function MessageFilterTabs({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm transition",
            value === filter.value
              ? "bg-brand-600 text-white shadow-soft"
              : "text-slate-500 hover:bg-slate-100",
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
