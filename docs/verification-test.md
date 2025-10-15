# Manual Test Plan for Verification Flow

## Setup

1. Clear browser cookies and session storage
2. Ensure Cloudflare Turnstile keys are configured

## Test Cases

### 1. Cold Load Tests

a) Direct to Protected Route

- Steps:
  1. Open /dashboard directly in a new tab
  2. Observe immediate rewrite to /verify without content flash
  3. Complete verification
  4. Verify redirect to /dashboard
- Expected: No site content visible before verification

b) Public Route Access

- Steps:
  1. Visit /verify directly
  2. Observe verification UI loads immediately
  3. Visit static assets (images, robots.txt)
- Expected: Access allowed without verification

### 2. SPA Navigation Tests

a) Protected Route After Cookie Expiry

- Steps:
  1. Login and verify
  2. Clear "verified" cookie (keep session storage)
  3. Navigate to another protected route via link
  4. Observe immediate redirect to /verify
- Expected: No protected content flash

b) Verification Persistence

- Steps:
  1. Complete verification
  2. Navigate between protected routes
  3. Refresh page
- Expected: No re-verification needed within TTL

### 3. Return Path Tests

a) Valid Return Paths

- Steps:
  1. Visit /dashboard (unverified)
  2. Get redirected to /verify
  3. Check URL has ?returnTo=/dashboard
  4. Complete verification
- Expected: Return to original path

b) Invalid Return Paths

- Steps:
  1. Manually craft /verify?returnTo=//evil.com
  2. Complete verification
- Expected: Redirect to "/" (safe default)

### 4. Edge Cases

a) API Route Protection

- Steps:
  1. Clear verification
  2. Try accessing protected API routes
- Expected: API calls blocked without verification

b) Static Asset Access

- Steps:
  1. Clear verification
  2. Access \_next/static/_ and images/_
- Expected: Static assets load without verification

### 5. Security Tests

a) Cookie Security

- Steps:
  1. Complete verification
  2. Inspect "verified" cookie
- Expected:
  - HttpOnly flag set
  - Secure flag in production
  - SameSite=Lax
  - Appropriate TTL

b) Return Path Safety

- Steps:
  1. Try various malformed returnTo values
  - /verify?returnTo=//external.com
  - /verify?returnTo=javascript:alert(1)
  - /verify?returnTo=%2F%2Fevil.com
  - /verify?returnTo=../path
- Expected: All malformed paths redirect to "/"
