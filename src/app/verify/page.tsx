// src/app/verify/page.tsx

export const runtime = "edge";
export const dynamic = "force-static";
export const revalidate = false;

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

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyClient />
    </Suspense>
  );
}