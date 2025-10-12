# Security Overview

## Data Handling

- Messages are stored in Firestore under the `messages` collection.
- Metadata like IP and user agent are hashed with HMAC-SHA256 using `HASH_SALT`.
- Optional sender identity (Firebase UID) is stored only when the sender opts in.

## Firestore Rules (MVP)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }

    match /users/{uid} {
      allow read, write: if isSignedIn() && request.auth.uid == uid;
    }

    match /usernames/{username} {
      allow read: if true;
      allow write: if false;
    }

    match /messages/{messageId} {
      allow read: if isSignedIn() && resource.data.toUid == request.auth.uid;
      allow write: if false;
    }
  }
}
```

## Application Safeguards

- CSP headers configured in `next.config.js`.
- Rate limiting for `/api/send` combining per-target and global buckets.
- Profanity and link detection both client-side and server-side.
- All writes occur through API routes (no client direct writes).
- Logging redacts sensitive identifiers.
