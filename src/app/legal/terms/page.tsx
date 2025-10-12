export default function TermsPage() {
  return (
    <section className="bg-white py-16">
      <div className="container prose prose-slate max-w-3xl">
        <h1>Send2me Terms</h1>
        <p>Welcome to Send2me. These terms outline your responsibilities.</p>
        <h2>Key principles</h2>
        <ul>
          <li>Be respectful. No harassment or hate speech.</li>
          <li>Only use Send2me for personal, non-commercial messaging.</li>
          <li>Do not attempt to reverse engineer or abuse the service.</li>
        </ul>
        <h2>User obligations</h2>
        <p>
          You agree to keep your account secure and report any abuse. We reserve the right to remove
          content or suspend accounts that violate these policies.
        </p>
        <h2>Data usage</h2>
        <p>
          We store minimal metadata to keep the platform healthy. Review our privacy policy for
          details on what we collect.
        </p>
        <p>
          These terms will evolve as the product grows. We will notify you of any material changes.
        </p>
      </div>
    </section>
  );
}
