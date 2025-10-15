import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyClient } from "./VerifyClient";

export const metadata: Metadata = {
  title: "Browser Verification | Send2me",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default function VerifyPage({
  searchParams,
}: {
  searchParams: { returnTo?: string };
}) {
  // Note: VerifyClient handles returnTo through searchParams internally
  return (
    <Suspense fallback={null}>
      <VerifyClient />
    </Suspense>
  );
}
