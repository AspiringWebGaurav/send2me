"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

export type Toast = {
  id: string;
  title: string;
  type?: ToastType;
  description?: string;
  duration?: number;
};

type ToastContextValue = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const colors: Record<ToastType, string> = {
  success: "bg-green-50 border-green-500 text-green-700",
  error: "bg-red-50 border-red-500 text-red-700",
  info: "bg-blue-50 border-blue-500 text-blue-700",
  warning: "bg-amber-50 border-amber-500 text-amber-700",
};

const icons: Record<ToastType, string> = {
  success: "[ok]",
  error: "[!]",
  info: "[i]",
  warning: "[!]",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    ({ type = "info", duration = 4000, ...toast }: Omit<Toast, "id">) => {
      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2, 10);
      const toastWithDefaults: Toast = { id, type, duration, ...toast };
      setToasts((prev) => [...prev, toastWithDefaults]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-soft transition-all",
              colors[toast.type ?? "info"],
            )}
          >
            <div className="text-xl">{icons[toast.type ?? "info"]}</div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 text-xs text-slate-600">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
