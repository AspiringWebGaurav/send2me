import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/theme.css";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Providers } from "./providers";
import { resolvePublicBaseUrl } from "@/lib/publicUrl";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-white text-slate-900 antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
