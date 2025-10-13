export default function AboutPage() {
  return (
    <section className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50/60 via-white to-white px-4 py-16 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute left-[-10rem] top-[-6rem] h-60 w-60 rounded-full bg-brand-200/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[-12rem] bottom-[-8rem] h-72 w-72 rounded-full bg-brand-400/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex w-full max-w-4xl flex-col gap-10 rounded-3xl border border-slate-200 bg-white/85 p-10 text-center shadow-soft backdrop-blur-md sm:p-12">
        <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
          About Send2me
        </span>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Honest feedback, delivered with care.
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
            Send2me gives creators and teams a simple link to collect anonymous encouragement and
            insight. Safety-first moderation, instant onboarding, and a polished UI help every reply feel
            constructive.
          </p>
        </div>

        <div className="grid gap-4 text-left sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Safety-first</h2>
            <p className="mt-2 text-xs text-slate-600">
              Rate limits, moderation queues, and alerts protect each inbox without slowing the
              conversation.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Fast onboarding</h2>
            <p className="mt-2 text-xs text-slate-600">
              Sign in, claim a username, and share your link in minutes—no configuration required.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Modern stack</h2>
            <p className="mt-2 text-xs text-slate-600">
              Powered by Next.js, Firebase, and Tailwind CSS to stay fast, responsive, and reliable.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-slate-600 sm:text-base">
            Crafted with pure heart and love by{" "}
            <a
              href="https://www.gauravpatil.online"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-brand-700 underline-offset-4 hover:underline"
            >
              Gaurav Patil
            </a>
            . We’re building a welcoming space for honest messages—one link at a time.
          </p>
          <p className="text-xs text-slate-500 sm:text-sm">
            Need a hand? Reach us at{" "}
            <a
              href="mailto:support@send2me.app"
              className="font-medium text-brand-700 underline-offset-4 hover:underline"
            >
              support@send2me.app
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
