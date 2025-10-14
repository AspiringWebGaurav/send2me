import Link from "next/link";

const footerLinks = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/about", label: "About" },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/70" data-app-chrome="footer">
      <div className="flex w-full flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        {/* Left: Brand */}
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold text-slate-900">Send2me</p>
          <p className="text-xs text-slate-500">
            Anonymous, respectful messaging with safety-first controls.
          </p>
        </div>

        {/* Right: Footer Links */}
        <nav className="flex items-center gap-4 text-xs text-slate-500">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-slate-800"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-slate-200/70 px-4 py-4 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        Made with pure heart and love by{" "}
        <a
          href="https://www.gauravpatil.online"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-brand-700 underline-offset-2 hover:underline"
        >
          Gaurav Patil
        </a>
        .
      </div>
    </footer>
  );
}
