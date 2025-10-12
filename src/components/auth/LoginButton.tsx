"use client";

import { Button } from "@/components/ui/Button";
import { useAuth } from "./AuthProvider";

export function LoginButton() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) {
    return <Button variant="secondary" loading>Loading</Button>;
  }

  if (user) {
    return (
      <Button variant="secondary" onClick={signOut}>
        Sign out
      </Button>
    );
  }

  return (
    <Button onClick={signIn} className="px-5">
      Sign in with Google
    </Button>
  );
}
