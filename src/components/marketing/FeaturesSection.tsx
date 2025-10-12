const features = [
  {
    title: "Google sign-in",
    description: "Authenticate with Firebase and keep your inbox gated behind trusted accounts.",
  },
  {
    title: "Safe by default",
    description: "Client + server moderation, hashed metadata, and sensible rate limits.",
  },
  {
    title: "Shareable profile link",
    description: "Each username gets a clean public page at /u/username with copy-to-clipboard.",
  },
  {
    title: "Inbox with filters",
    description: "Review anonymous or identified messages separately and stay organised.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-16">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-slate-900">Built for honest conversations</h2>
          <p className="mt-2 text-base text-slate-600">
            Launch fast, stay safe, and enjoy a zero-maintenance Firebase + Vercel stack.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft"
            >
              <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
