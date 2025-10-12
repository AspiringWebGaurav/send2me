export default function PrivacyPage() {
  return (
    <section className="bg-white py-16">
      <div className="container prose prose-slate max-w-3xl">
        <h1>Privacy Policy</h1>
        <p>
          Send2me is designed to respect the privacy of both message senders and receivers. We store
          the minimum information required to run the service.
        </p>
        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Account basics:</strong> Your Google email and chosen username.
          </li>
          <li>
            <strong>Messages:</strong> The text you receive and optional sender identity when
            attached.
          </li>
          <li>
            <strong>Metadata:</strong> Hashed IP and device fingerprints for rate limiting and
            security.
          </li>
        </ul>
        <h2>How we use data</h2>
        <p>
          We use your data to provide the messaging experience, detect abuse, and improve the
          product. We never sell personal information or expose raw IPs.
        </p>
        <h2>Your controls</h2>
        <ul>
          <li>Delete messages from your dashboard.</li>
          <li>Request account deletion by contacting support.</li>
          <li>Report abusive content directly from the dashboard.</li>
        </ul>
      </div>
    </section>
  );
}
