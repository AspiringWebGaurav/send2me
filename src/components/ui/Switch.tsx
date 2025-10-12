import * as React from "react";
import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
};

export function Switch({ checked, onCheckedChange, label, disabled, id }: SwitchProps) {
  const handleClick = () => {
    if (disabled) return;
    onCheckedChange?.(!checked);
  };

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-3 rounded-full border border-slate-200 px-3 py-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:ring-offset-2",
        disabled ? "cursor-not-allowed opacity-60" : "hover:border-brand-300",
      )}
    >
      <span
        className={cn(
          "relative flex h-6 w-10 items-center rounded-full bg-slate-300 transition-colors",
          checked && "bg-brand-500",
        )}
      >
        <span
          className={cn(
            "absolute left-1 h-4 w-4 rounded-full bg-white transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
      {label ? <span className="text-sm font-medium text-slate-700">{label}</span> : null}
    </button>
  );
}
