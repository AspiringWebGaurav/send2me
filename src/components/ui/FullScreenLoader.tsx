"use client";

type FullScreenLoaderProps = {
  label?: string;
};

export function FullScreenLoader({ label = "Loading Send2me..." }: FullScreenLoaderProps) {
  return (
    <div
      role="status"
      aria-live="assertive"
      aria-busy="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/75 backdrop-blur-md"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border border-brand-100 bg-white/95 px-10 py-8 text-center shadow-soft">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <span className="absolute h-14 w-14 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin" />
            <span className="relative text-base font-semibold text-brand-700">S2</span>
          </div>
          <div className="text-left">
            <p className="text-lg font-semibold text-slate-900">Send2me</p>
            <p className="text-xs text-slate-500">Anonymous messages, safely delivered</p>
          </div>
        </div>
        <p className="max-w-xs text-xs text-slate-500 sm:text-sm">{label}</p>
      </div>
    </div>
  );
}
