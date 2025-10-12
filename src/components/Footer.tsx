import Link from "next/link";

const footerLinks = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/(marketing)/about", label: "About" },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/70">
      <div className="container flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Send2me</p>
          <p className="text-xs text-slate-500">
            Anonymous, respectful messaging with safety-first controls.
          </p>
        </div>
        <nav className="flex items-center gap-4 text-xs text-slate-500">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-slate-800">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
