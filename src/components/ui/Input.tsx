import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "block w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:ring-offset-2",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
