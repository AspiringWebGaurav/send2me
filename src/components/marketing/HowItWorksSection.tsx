const steps = [
  {
    title: "Sign in with Google",
    description: "Secure Firebase Auth keeps spam away while making onboarding frictionless.",
    number: "01",
  },
  {
    title: "Claim your username",
    description: "Reserve a unique slug and share it instantly. Send2me prevents collisions.",
    number: "02",
  },
  {
    title: "Share and collect",
    description: "Drop your link anywhere. Messages flow into your dashboard with filters.",
    number: "03",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-slate-50 py-16">
      <div className="container grid gap-8 lg:grid-cols-[1fr_2fr]">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Three steps to launch</h2>
          <p className="mt-3 text-base text-slate-600">
            No forms, no spreadsheets. Just a clean profile page and a private inbox powered by
            Firebase.
          </p>
        </div>
        <div className="space-y-6">
          {steps.map((step) => (
            <div
              key={step.title}
              className="flex gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="text-2xl font-semibold text-brand-500">{step.number}</div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
