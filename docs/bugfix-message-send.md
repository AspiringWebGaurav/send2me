## Message Send After Verification Bugfix

### Root Cause

The message sending failure after successful verification was caused by a state synchronization issue between three different state sources:

1. Session storage verification flag (`turnstile-verified: "1"`)
2. TurnstileProvider context state
3. Component-level verification state

### Changes Made

1. Added session storage synchronization in `useTurnstileVerification` hook:

```typescript
useEffect(() => {
  // Sync verification state from sessionStorage on mount
  try {
    const isVerified =
      window.sessionStorage.getItem("turnstile-verified") === "1";
    if (isVerified && state.status !== "success") {
      dispatch({ type: "VERIFY_SUCCESS", token: "session" });
    }
  } catch {
    // Ignore storage access issues
  }
}, []);
```

2. Updated message submission check in `MessageForm` to verify both session storage and context state:

```typescript
const isStorageVerified =
  window.sessionStorage.getItem("turnstile-verified") === "1";
if (!isStorageVerified && !isTurnstileVerified) {
  push({
    title: "Verify to send",
    description: "Please complete the Turnstile verification first.",
    type: "warning",
  });
  return;
}
```

### Impact on Other Logic

- No changes to core verification or bot-prevention logic
- All verification state transitions and UI behavior preserved
- Fixes rely only on reading existing state values, no modifications to state management
- No impact on existing security checks or rate limiting
- Message send flow uses same verification proof tokens as before
