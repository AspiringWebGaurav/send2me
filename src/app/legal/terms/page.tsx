const sections = [
  { id: "account", label: "Accounts & Eligibility" },
  { id: "acceptable-use", label: "Acceptable Use" },
  { id: "content", label: "Content & Licensing" },
  { id: "moderation", label: "Messaging & Moderation" },
  { id: "privacy", label: "Privacy & Security" },
  { id: "third-party", label: "Third-Party Services" },
  { id: "termination", label: "Termination" },
  { id: "governing-law", label: "Governing Law" },
  { id: "contact", label: "Contact" },
];

export default function TermsPage() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50/40 via-white to-white py-20 sm:py-24">
      <div
        className="pointer-events-none absolute left-[-12rem] top-[-6rem] h-64 w-64 rounded-full bg-brand-200/35 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[-14rem] bottom-[-10rem] h-80 w-80 rounded-full bg-brand-400/25 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-slate-200 bg-white/85 p-8 shadow-soft backdrop-blur-md sm:p-12">
          <div className="flex flex-col gap-4 text-center sm:text-left">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200/70 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
              Terms of Service
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Send2me Service Terms
            </h1>
            <p className="text-sm text-slate-500 sm:text-base">
              Effective 10 October 2025. These terms describe your rights and responsibilities when
              using Send2me and its related services operated by Send2me Labs.
            </p>
          </div>

          <nav className="mt-8 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 font-medium text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
              >
                {section.label}
              </a>
            ))}
          </nav>
        </header>

        <article className="prose prose-slate mx-auto w-full max-w-none rounded-3xl border border-slate-200 bg-white/90 p-8 text-sm shadow-soft backdrop-blur-sm sm:p-12">
          <p className="text-slate-500">
            Send2me is a messaging platform that allows people to receive anonymous notes while
            keeping safety controls firmly in place. By creating an account or accessing our products,
            you agree to these Terms of Service (“Terms”) and to our{" "}
            <a className="text-brand-700 no-underline hover:underline" href="/legal/privacy">
              Privacy Policy
            </a>
            .
          </p>

          <h2 id="account">1. Accounts & Eligibility</h2>
          <p>
            You must be at least 16 years old (or the age of digital consent in your jurisdiction) to
            create a Send2me account. When registering, you agree to provide accurate information and
            keep your Google account credentials secure. You are responsible for all activity that
            occurs under your account, including activity by collaborators you invite.
          </p>
          <p>
            If you are using Send2me on behalf of an organization, you represent that you have
            authority to accept these Terms on its behalf and that the entity will indemnify Send2me
            for any violations.
          </p>

          <h2 id="acceptable-use">2. Acceptable Use</h2>
          <p>
            Send2me is built for constructive, human-first conversations. You agree not to upload,
            transmit, or solicit content that:
          </p>
          <ul>
            <li>Promotes harassment, hate speech, self-harm, or violence.</li>
            <li>Contains malware, phishing attempts, or exploits platform vulnerabilities.</li>
            <li>
              Violates any law, infringes intellectual property, or breaches a duty of confidentiality.
            </li>
            <li>
              Attempts to scrape, probe, or reverse engineer Send2me systems beyond public documentation.
            </li>
          </ul>
          <p>
            We follow guidance from the{" "}
            <a
              href="https://www.cybercivilrights.org/online-abuse/"
              target="_blank"
              rel="noreferrer"
              className="text-brand-700 no-underline hover:underline"
            >
              Cyber Civil Rights Initiative
            </a>{" "}
            and{" "}
            <a
              href="https://www.un.org/en/about-us/universal-declaration-of-human-rights"
              target="_blank"
              rel="noreferrer"
              className="text-brand-700 no-underline hover:underline"
            >
              UN Declaration of Human Rights
            </a>{" "}
            to identify and act on abuse. Violations may result in message deletion, feature limits, or
            account suspension.
          </p>

          <h2 id="content">3. Content & Licensing</h2>
          <p>
            You retain ownership of the content you receive or publish through Send2me. By using the
            service, you grant us a worldwide, royalty-free license to host, store, and process that
            content solely to operate and improve the platform. We do not sell or publicly display your
            inbox without permission.
          </p>
          <p>
            We respect intellectual property rights. If you believe content on Send2me infringes your
            rights, submit a notice under the{" "}
            <a
              href="https://www.copyright.gov/dmca/"
              target="_blank"
              rel="noreferrer"
              className="text-brand-700 no-underline hover:underline"
            >
              Digital Millennium Copyright Act (DMCA)
            </a>{" "}
            to{" "}
            <a
              href="mailto:dmca@send2me.app"
              className="text-brand-700 no-underline hover:underline"
            >
              dmca@send2me.app
            </a>
            .
          </p>

          <h2 id="moderation">4. Messaging & Moderation</h2>
          <p>
            Send2me includes automated filters, rate limiting, and manual review capabilities to help
            creators stay safe. We may block or quarantine messages that trigger safety rules. Repeat
            attempts to bypass moderation can lead to account enforcement.
          </p>
          <p>
            Users can flag abusive submissions from their dashboard. Flags are reviewed by our trust &
            safety team in accordance with the{" "}
            <a
              href="https://trustandsafetyprofessionalassociation.org/codeofconduct/"
              target="_blank"
              rel="noreferrer"
              className="text-brand-700 no-underline hover:underline"
            >
              Trust & Safety Professional Association Code of Conduct
            </a>
            .
          </p>

          <h2 id="privacy">5. Privacy & Security</h2>
          <p>
            We collect only the data needed to deliver the Send2me experience, as described in our{" "}
            <a className="text-brand-700 no-underline hover:underline" href="/legal/privacy">
              Privacy Policy
            </a>
            . This includes your Google ID, username, and anonymized metadata for spam prevention.
          </p>
          <p>
            We follow industry practices outlined in the{" "}
            <a
              href="https://firebase.google.com/support/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-brand-700 no-underline hover:underline"
            >
              Firebase Privacy & Security documentation
            </a>{" "}
            and{" "}
            <a
              href="https://vercel.com/docs/security"
              target="_blank"
              rel="noreferrer"
              className="text-brand-700 no-underline hover:underline"
            >
              Vercel Security Overview
            </a>
            . You are responsible for safeguarding your own devices and network access.
          </p>

          <h2 id="third-party">6. Third-Party Services</h2>
          <p>
            Send2me integrates with third-party providers such as Google (authentication), Firebase
            (database), and Vercel (hosting). Your use of these integrations is subject to the{" "}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noreferrer"
              className="text-brand-700 no-underline hover:underline"
            >
              Google Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="https://vercel.com/legal/terms"
              target="_blank"
              rel="noreferrer"
              className="text-brand-700 no-underline hover:underline"
            >
              Vercel Terms of Service
            </a>
            . We are not responsible for downtime or data loss caused by third-party vendors, but we
            work closely with them to minimize disruption.
          </p>

          <h2 id="termination">7. Suspension & Termination</h2>
          <p>
            We may suspend or terminate accounts that breach these Terms, create legal risk, or disrupt
            the community. When feasible, we will notify you via email before taking irreversible
            action. You may delete your Send2me account at any time by contacting support; deletion may
            require identity verification for security reasons.
          </p>

          <h2 id="governing-law">8. Governing Law & Disputes</h2>
          <p>
            These Terms are governed by the laws of the State of Maharashtra, India, without regard to
            conflict-of-law principles. Disputes will be resolved through good-faith negotiation. If a
            dispute cannot be resolved within 30 days, parties agree to binding arbitration in Pune,
            conducted under the{" "}
            <a
              href="https://www.icaindia.co.in/"
              target="_blank"
              rel="noreferrer"
              className="text-brand-700 no-underline hover:underline"
            >
              Indian Council of Arbitration
            </a>{" "}
            rules. Nothing prevents either party from seeking injunctive relief for misuse of the
            service or intellectual property.
          </p>

          <h2 id="contact">9. Contact & Updates</h2>
          <p>
            We may update these Terms as Send2me evolves. Material changes will be announced through
            in-app notifications or email at least 14 days before they take effect. Continued use of
            Send2me after the effective date constitutes acceptance.
          </p>
          <p>
            Questions or requests? Email{" "}
            <a
              href="mailto:legal@send2me.app"
              className="text-brand-700 no-underline hover:underline"
            >
              legal@send2me.app
            </a>{" "}
            or write to Send2me Labs, 91 Springboard, Baner, Pune 411045, India.
          </p>
        </article>
      </div>
    </section>
  );
}
