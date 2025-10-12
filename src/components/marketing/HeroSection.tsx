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
        if (!json.user.username) {
          setPublicUrl(null);
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
    }
  };

  return (
    <section
      className="relative overflow-hidden pb-24 pt-4 sm:pt-8"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <style jsx global>{`
        ::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/40 to-white" />

      <div className="container mx-auto grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        {/* LEFT */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1 text-sm font-medium text-brand-600 shadow-soft animate-fade-in">
            🚀 Fast launch, zero setup
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl animate-fade-in-up">
            Collect honest feedback without the chaos.
          </h1>

          <p className="max-w-xl text-lg text-slate-600 animate-fade-in-up delay-100">
            Create your personal Send2me link to collect anonymous feedback,
            ideas, or encouragement. Built with safety, moderation, and
            simplicity in mind.
          </p>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft backdrop-blur-sm transition hover:shadow-md animate-fade-in-up delay-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Claim your link
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign in with Google, choose your username, and start collecting
              messages instantly.
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
                  placeholder="choose-username"
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

        {/* RIGHT: polished minimal logo */}
        <div className="relative hidden w-full lg:flex lg:justify-center lg:items-center">
          <div className="relative aspect-[5/3] w-3/5 max-w-sm overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-semibold text-brand-600 tracking-tight select-none">
                Send<span className="text-slate-700">2me</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">safe & simple feedback</p>
            </div>
          </div>
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
