import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import { Suspense } from "react";
import "@/styles/theme.css";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Providers } from "./providers";
import { resolvePublicBaseUrl } from "@/lib/publicUrl";
import { RouteLoader } from "@/components/RouteLoader";
import { FullScreenLoader } from "@/components/ui/FullScreenLoader";
import { TurnstileVerificationProvider } from "@/components/turnstile/TurnstileProvider";
import { ChromeVisibilityProvider } from "@/components/ChromeVisibilityProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(resolvePublicBaseUrl(undefined, { allowLocal: false })),
  title: {
    default: "Send2me - Anonymous & Safe Messaging Links",
    template: "%s | Send2me",
  },
  description:
    "Claim your Send2me link, collect anonymous feedback, and keep your inbox clean with built-in moderation and rate limiting.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Send2me - Anonymous & Safe Messaging",
    description:
      "Collect honest messages with your personal Send2me link. Modern UI, Firebase Auth, and safety-first moderation.",
    url: "/",
    siteName: "Send2me",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Send2me - Anonymous messaging with moderation",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Send2me - Anonymous & Safe Messaging",
    description:
      "Launch your anonymous messaging inbox in minutes. Firebase-powered auth, moderation, and rate limiting.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1b8aff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = headers();
  const invokedPath =
    headerList.get("x-invoke-path") ??
    headerList.get("x-matched-path") ??
    headerList.get("next-url") ??
    "";
  const shouldHideChrome =
    invokedPath === "/verify" || invokedPath.startsWith("/verify/");

  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-white text-slate-900 antialiased">
        <Script
          id="verification-session-bootstrap"
          strategy="beforeInteractive"
        >
          {`
            (function () {
              var COOKIE_NAME = "verified";
              var SESSION_KEY = "turnstile-verified";
              var VERIFICATION_COMPLETE = "verification-complete";
              
              try {
                // Check if we just completed verification
                var justVerified = false;
                try {
                  justVerified = window.sessionStorage.getItem(VERIFICATION_COMPLETE) === "true";
                  if (justVerified) {
                    window.sessionStorage.removeItem(VERIFICATION_COMPLETE);
                  }
                } catch (verifyError) {
                  // Ignore storage access issues
                }

                // Normal cookie check
                var entries = document.cookie ? document.cookie.split(";") : [];
                var hasCookie = false;
                for (var i = 0; i < entries.length; i += 1) {
                  var entry = entries[i].trim();
                  if (entry.indexOf(COOKIE_NAME + "=") === 0) {
                    hasCookie = true;
                    break;
                  }
                }

                var hasSession = false;
                try {
                  hasSession = window.sessionStorage.getItem(SESSION_KEY) === "1" || justVerified;
                } catch (sessionError) {
                  hasSession = justVerified;
                }

                if (hasCookie && !hasSession) {
                  document.cookie = COOKIE_NAME + "=; Max-Age=0; Path=/";
                  try {
                    window.sessionStorage.removeItem(SESSION_KEY);
                  } catch (removeError) {
                    // ignore
                  }
                  var currentPath = window.location.pathname + window.location.search;
                  if (!currentPath.startsWith("/verify")) {
                    var returnTarget = currentPath || "/";
                    window.location.replace("/verify?returnTo=" + encodeURIComponent(returnTarget));
                  }
                  return;
                }

                if (!hasCookie && hasSession) {
                  try {
                    window.sessionStorage.removeItem(SESSION_KEY);
                  } catch (clearError) {
                    // ignore
                  }
                }
              } catch (error) {
                if (typeof console !== "undefined" && console.error) {
                  console.error("verification bootstrap failed", error);
                }
              }
            })();
          `}
        </Script>
        <ChromeVisibilityProvider>
          <TurnstileVerificationProvider>
            <Providers>
              <RouteLoader />
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <Suspense
                  fallback={
                    <FullScreenLoader label="Preparing your experience..." />
                  }
                >
                  <main className="flex-1">{children}</main>
                </Suspense>
                <Footer />
              </div>
            </Providers>
          </TurnstileVerificationProvider>
        </ChromeVisibilityProvider>
      </body>
    </html>
  );
}
