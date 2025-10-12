export default function AboutPage() {
  return (
    <section className="bg-slate-50 py-16">
      <div className="container max-w-3xl space-y-4">
        <h1 className="text-3xl font-semibold text-slate-900">About Send2me</h1>
        <p className="text-sm text-slate-600">
          Send2me started as a lightweight tool for creators and teammates to collect honest
          feedback. We focus on zero-config onboarding, strong moderation, and a delightful
          experience on mobile and desktop.
        </p>
        <p className="text-sm text-slate-600">
          The stack is Next.js 14, Firebase, and Tailwind CSS. Everything runs comfortably on the
          free tier so you can validate your idea before scaling.
        </p>
      </div>
    </section>
  );
}
