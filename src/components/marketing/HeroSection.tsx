"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/CopyButton";
import { useToast } from "@/components/Toast";
import { TAndCModal } from "@/components/TAndCModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { validateUsername } from "@/lib/moderation";
import { usePreferredBaseUrl } from "@/hooks/usePreferredBaseUrl";
import { buildProfileUrl } from "@/lib/publicUrl";
import { useLoadingOverlay } from "@/components/LoadingOverlayProvider";
import { motion, AnimatePresence } from "framer-motion";

type SessionProfile = {
  username: string | null;
  uid: string;
  email: string;
  linkSlug: string | null;
  linkUrl: string | null;
};

export function HeroSection() {
  const { user, loading, signIn, getToken } = useAuth();
  const [usernameInput, setUsernameInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [openTerms, setOpenTerms] = useState(false);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const { push } = useToast();
  const baseUrl = usePreferredBaseUrl();
  const { showLoading, hideLoading } = useLoadingOverlay();

  const usernameHint = useMemo(() => {
    if (!usernameInput) return null;
    try {
      validateUsername(usernameInput);
      return null;
    } catch (error) {
      if (error instanceof Error) return error.message;
      return "Invalid username.";
    }
  }, [usernameInput]);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setProfile(null);
      setPublicUrl(null);
      return;
    }

    async function fetchSession() {
      const token = await getToken();
      if (!token || cancelled) return;
      const response = await fetch("/api/auth/session", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const json = await response.json();
      if (cancelled) return;

      if (json.user) {
        setProfile({
          uid: json.user.uid,
          email: json.user.email,
          username: json.user.username,
          linkSlug: json.user.linkSlug ?? null,
          linkUrl: json.user.linkUrl ? json.user.linkUrl : null,
        });
        if (json.user.linkUrl) {
          setPublicUrl(json.user.linkUrl);
        }
      } else {
        setProfile(null);
        setPublicUrl(null);
      }
    }

    fetchSession();
    return () => {
      cancelled = true;
    };
  }, [user, getToken]);

  const claimedUsername = profile?.username ?? null;
  const storedProfileUrl = profile?.linkUrl ? profile.linkUrl : null;

  useEffect(() => {
    if (!claimedUsername) {
      setPublicUrl(null);
      return;
    }
    if (storedProfileUrl) {
      setPublicUrl((current) =>
        current === storedProfileUrl ? current : storedProfileUrl
      );
      return;
    }
    const derived = buildProfileUrl(baseUrl, claimedUsername);
    setPublicUrl((current) => (current === derived ? current : derived));
  }, [baseUrl, claimedUsername, storedProfileUrl]);

  const handlePrepareLink = () => {
    if (!user) {
      signIn();
      return;
    }
    if (profile?.username) {
      push({
        title: "Link already active",
        description: "You already have a link. Share it below!",
        type: "info",
      });
      return;
    }
    try {
      validateUsername(usernameInput);
      setOpenTerms(true);
    } catch (error) {
      push({
        title: "Invalid username",
        description:
          error instanceof Error ? error.message : "Choose another username.",
        type: "error",
      });
    }
  };

  const createLink = async () => {
    const token = await getToken(true);
    if (!token) {
      push({
        title: "Sign in required",
        description: "Please sign in to claim your Send2me link.",
        type: "warning",
      });
      return;
    }

    setSubmitting(true);
    showLoading("Claiming your Send2me link...");
    try {
      const response = await fetch("/api/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: usernameInput, agree: true }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error ?? "Unable to create link");
      }

      const claimedLink =
        json.publicUrl ?? buildProfileUrl(baseUrl, usernameInput);
      setPublicUrl(claimedLink);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              username: usernameInput,
              linkSlug: prev.linkSlug ?? usernameInput,
              linkUrl: claimedLink,
            }
          : {
              uid: user?.uid ?? "",
              email: user?.email ?? "",
              username: usernameInput,
              linkSlug: usernameInput,
              linkUrl: claimedLink,
            }
      );
      push({
        title: "You're live!",
        description: "Copy your link and share it anywhere.",
        type: "success",
      });
    } catch (error) {
      push({
        title: "Something went wrong",
        description:
          error instanceof Error ? error.message : "Please try again.",
        type: "error",
      });
    } finally {
      setOpenTerms(false);
      setSubmitting(false);
      hideLoading();
    }
  };

  return (
    <section className="relative overflow-hidden pb-24 pt-8">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/50 to-white" />

      <div className="container mx-auto grid gap-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        {/* LEFT */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1 text-sm font-medium text-brand-600 shadow-soft">
            ✨ Create & share your feedback link anywhere
          </div>

          <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Create a <span className="text-brand-600">Send2me</span> link you
            can paste anywhere.
          </h1>

          <p className="max-w-xl text-lg text-slate-600">
            Build your personal link, share it on Instagram, Twitter, or
            anywhere else, and start getting honest feedback — instantly.
          </p>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft backdrop-blur-sm transition hover:shadow-md">
            <h2 className="text-lg font-semibold text-slate-900">
              Claim your link now
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign in, pick your username, and get your custom Send2me link to
              share.
            </p>

            {publicUrl ? (
              <div className="mt-6 flex flex-col gap-3">
                <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-mono text-brand-800 overflow-hidden text-ellipsis">
                  {publicUrl}
                </div>
                <CopyButton value={publicUrl} />
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Input
                  placeholder="your-username"
                  value={usernameInput}
                  onChange={(e) =>
                    setUsernameInput(e.target.value.toLowerCase())
                  }
                  disabled={!user || !!profile?.username}
                  className={`flex-1 rounded-2xl px-4 py-2 text-sm transition focus:outline-none focus:ring-2 ${
                    usernameHint
                      ? "border border-red-500 focus:ring-red-200"
                      : !user
                      ? "border border-red-400 bg-red-50 text-red-700 placeholder:text-red-400 cursor-not-allowed"
                      : "border border-slate-300 focus:ring-brand-200 focus:border-brand-400 placeholder:text-slate-400"
                  }`}
                />
                <Button
                  onClick={handlePrepareLink}
                  loading={submitting}
                  disabled={loading || (!!profile?.username && !!publicUrl)}
                  className="whitespace-nowrap px-6 text-sm font-semibold shadow-sm"
                >
                  {user ? "Create your link" : "Sign in to start"}
                </Button>
              </div>
            )}

            <p
              className={`mt-2 text-xs ${
                usernameHint ? "text-red-500" : "text-slate-400"
              } transition`}
            >
              {usernameHint ??
                "3–20 characters. Letters, numbers, dots, or underscores."}
            </p>
          </div>
        </div>

        {/* RIGHT: Dynamic Instagram-style card */}
        {/* RIGHT: Instagram-style card — single-line link, responsive, horizontal scroll if needed */}
        <div className="hidden lg:flex lg:justify-center px-4">
          <motion.div
            layout
            className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-md overflow-hidden select-none"
          >
            <div className="flex items-center gap-3 p-4 border-b border-slate-100">
              <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden">
                <Image
                  src="/dummy-user.png"
                  alt="User"
                  width={40}
                  height={40}
                  className="object-cover pointer-events-none"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 truncate max-w-[12rem]">
                  @{profile?.username || "yourname"}
                </p>
                <p className="text-xs text-slate-500">
                  Just posted a new link 👇
                </p>
              </div>
            </div>

            <div className="p-6 text-center space-y-3">
              <AnimatePresence mode="wait">
                {!user && (
                  <motion.div
                    key="guest"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-sm text-slate-500">
                      Sign in to create your own Send2me link.
                    </p>
                    <span
                      className="inline-block rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-mono text-brand-800 opacity-70 cursor-not-allowed select-none"
                      title="Demo link disabled"
                    >
                      send2me.site/u/username
                    </span>
                    <Button
                      onClick={() => signIn()}
                      className="mt-3 w-full text-sm font-medium"
                    >
                      Sign in to Create Link
                    </Button>
                  </motion.div>
                )}

                {user && !publicUrl && (
                  <motion.div
                    key="signedIn"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-sm text-slate-500">
                      Welcome! Choose a username below to activate your link.
                    </p>
                    <span
                      className="inline-block rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-mono text-brand-800 opacity-70 cursor-not-allowed select-none"
                      title="No link yet"
                    >
                      send2me.site/u/yourname
                    </span>
                    <p className="text-xs text-slate-400">
                      (Your link will appear here once created)
                    </p>
                  </motion.div>
                )}

                {publicUrl && (
                  <motion.div
                    key="liveLink"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    <p className="text-sm text-slate-500">
                      Your feedback link is live! Share or visit it below.
                    </p>

                    {/* Single-line link with smooth horizontal scroll if it overflows */}
                    <div className="flex justify-center">
                      <div
                        className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-mono text-brand-800 whitespace-nowrap overflow-x-auto no-scrollbar"
                        title={publicUrl}
                      >
                        {publicUrl}
                      </div>
                    </div>

                    <CopyButton value={publicUrl} />
                    <p className="text-xs text-slate-400">
                      (Scroll ↔ if needed, or click/copy to share your feedback
                      page)
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Hide scrollbar but keep horizontal scrolling */}
          <style jsx global>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
        </div>
      </div>

      <TAndCModal
        open={openTerms}
        onClose={() => setOpenTerms(false)}
        onAccept={createLink}
      />
    </section>
  );
}
