import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "block w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:ring-offset-2",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
