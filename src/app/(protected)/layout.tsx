import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Server-side verification guard
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Double-check verification status server-side
  const cookieStore = cookies();
  const verified = cookieStore.get("verified")?.value === "1";

  if (!verified) {
    const returnTo =
      "/" + (typeof window !== "undefined" ? window.location.pathname : "");
    redirect(`/verify?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return <>{children}</>;
}
