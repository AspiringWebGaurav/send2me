# Architecture Decisions

1. **Next.js App Router** – Enables serverless APIs, React Server Components, and future scalability.
2. **Firebase Auth + Firestore** – Handles auth and data with minimal infrastructure; admin SDK powers secure server routes.
3. **Rate limiting in Firestore** – Simple transactional counters avoid external deps and stay within free tier.
4. **Hashed metadata** – Balances abuse prevention with privacy; salt stored in env.
5. **Client-driven dashboard** – Keeps server components simple while Firebase tokens guard API routes.
