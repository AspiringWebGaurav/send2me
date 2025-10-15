# Verification Flow

## Overview

This document describes the server-first verification flow implemented to prevent content flashing and ensure robust bot prevention.

## Current Implementation

The existing system uses:

- Cloudflare Turnstile for CAPTCHA verification
- A verified=1 cookie for session tracking
- Client-side components (TurnstileProvider, TurnstileWidget)
- Server utilities for token verification

## Enhanced Flow

The enhanced system maintains all existing functionality while adding:

1. **Edge-Level Protection (Middleware)**

   - Intercepts all non-public routes
   - Checks for a signed HttpOnly cookie (verified=1)
   - Rewrites to /verify if verification needed
   - Prevents any content flash by blocking at edge

2. **Verification Page**

   - Server Component: Handles returnTo logic
   - Client Component: Reuses existing TurnstileWidget
   - Success redirects to original destination

3. **Cookie Management**

   - Name: verified
   - Flags: HttpOnly, Secure, SameSite=Lax
   - Path: /
   - TTL: Maintained from original implementation

4. **Protected Routes**
   - All non-public routes require verification
   - No protected content ever renders before verification
   - SPA navigation triggers re-verification when needed

## Protected vs Public Routes

Public (bypass verification):

- /verify and /api/verify/\*
- /\_next/\* (Next.js internals)
- /api/turnstile/\*
- Static files (images, robots.txt, etc.)

Protected (require verification):

- / (homepage)
- /dashboard
- User-specific routes (/u/[username])
- All other routes not explicitly public

## Implementation Details

Files changed:

1. src/middleware.ts - Enhanced edge verification
2. src/app/verify/page.tsx - New server component
3. src/app/verify/VerifyClient.tsx - Enhanced client component
4. src/lib/turnstile.ts - Reused existing verification
5. src/types/index.ts - Added verification types

## Testing Flow

1. Cold Navigation:

   - Direct URL → Middleware → /verify → Success → Original URL
   - No content flash during process

2. SPA Navigation:

   - Check cookie status before navigation
   - Push to /verify if needed
   - Maintain verification state

3. Public Routes:
   - Bypass verification
   - Direct access allowed

## Security Considerations

1. Cookie Security

   - HttpOnly prevents XSS cookie theft
   - Secure flag for HTTPS only
   - SameSite=Lax prevents CSRF

2. Redirect Safety

   - returnTo only allows same-origin paths
   - Path validation prevents open redirects

3. Rate Limiting
   - Maintained from existing implementation
   - Applied at API endpoints

## Development Notes

1. Local Development

   - Turnstile test keys for development
   - Environment variables required

2. Production
   - Secure cookie settings enforced
   - Rate limiting active
