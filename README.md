# Send2me

Send2me is an anonymous messaging MVP built with Next.js 14 (App Router), Tailwind CSS, and Firebase. Creators can claim a shareable profile link, collect moderated feedback, and manage their inbox with filters and safety tooling.

## Tech Stack

- Next.js 14 w/ App Router & TypeScript
- Tailwind CSS 3.4
- Firebase Auth & Firestore (client + admin SDK)
- Vercel deployment ready

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill the Firebase values and `HASH_SALT`. Provide ONE of the credential options (base64 JSON, inline JSON, JSON path, or client email + private key).
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`.

## Project Structure

```
src/
  app/              # app router routes, API handlers, marketing pages
  components/       # UI primitives, marketing, dashboard, auth helpers
  lib/              # Firebase, moderation, rate limiting, logging
  styles/           # theme helpers
  types/            # shared TypeScript contracts
public/
  og-image.png
```

## Core Flows

- **Onboarding**: Google sign-in ? choose username ? accept terms ? link generated.
- **Public profile**: `/u/[username]` renders message form with anon toggle.
- **Inbox**: `/dashboard` lists messages with filters and copy-link panel.
- **APIs**: `/api/link`, `/api/send`, `/api/messages`, `/api/auth/session` (token protected).

## Scripts

- `npm run dev` – start development server.
- `npm run build` – build for production.
- `npm run start` – serve build.
- `npm run lint` – ESLint check.

## Deployment Notes

- Configure the Firebase environment variables on Vercel.
- Provide a random 32+ char `HASH_SALT` for hashing IP/UA metadata.
- For production Firestore writes, ensure service account credentials are stored securely via Vercel environment secrets.
- Set `NEXT_PUBLIC_PUBLIC_BASE_URL` to the Vercel domain (update when switching to a custom domain).

## Security

- All writes happen through server API routes where moderation, hashing, and rate limiting are applied.
- Firestore rules (see docs/SECURITY.md) restrict direct writes.
- CSP headers configured in `next.config.js` for basic hardening.

## Documentation

Additional docs live in the `docs/` directory:

- `docs/FEATURES.md`
- `docs/SECURITY.md`
- `docs/ROADMAP.md`
- `docs/DECISIONS.md`


