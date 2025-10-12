// File: /components/dashboard/DashboardPageClient.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { LinkPanel } from "@/components/LinkPanel";
import { MessageFilterTabs } from "@/components/MessageFilterTabs";
import { MessageCard } from "@/components/MessageCard";

type FilterValue = "all" | "anon" | "identified";

type DashboardMessage = {
  id: string;
  text: string;
  createdAt: string; // ISO string
  anon: boolean;
  fromUsername: string | null;
  fromEmail?: string | null;
  fromGivenName?: string | null;
  fromFamilyName?: string | null;
  country?: string | null;
  device?: string | null;
};

type SessionResponse = {
  user:
    | {
        uid: string;
        email: string;
        username: string | null;
        linkSlug: string | null;
        linkUrl: string | null;
      }
    | null;
};

export function DashboardPageClient() {
  const { user, loading, signIn, signOut, getToken } = useAuth();
  const { push } = useToast();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [newMessageIds, setNewMessageIds] = useState<string[]>([]);
  const previousMessageIdsRef = useRef<string[]>([]);
  const initialLoadRef = useRef(true);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const fetchSession = async (token: string, isCancelled?: () => boolean) => {
    const response = await fetch("/api/auth/session", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) return;
    const data: SessionResponse = await response.json();
    if (isCancelled?.()) return;
    if (data.user?.username) {
      setUsername(data.user.username);
    } else if (!isCancelled?.()) {
      setUsername(null);
    }
  };

  const fetchMessages = useCallback(
    async (
      token: string,
      selectedFilter: FilterValue,
      options: {
        silent?: boolean;
        isCancelled?: () => boolean;
        suppressToast?: boolean;
      } = {}
    ) => {
      const { silent = false, isCancelled, suppressToast = silent } = options;
      if (!silent) {
        setLoadingMessages(true);
      }
      try {
        const response = await fetch(`/api/messages?filter=${selectedFilter}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? "Unable to fetch messages");
        }
        if (isCancelled?.()) return;
        // Expect server to include identity fields for non-anonymous messages.
        setMessages(
          (data.messages as any[]).map((m) => ({
            id: m.id,
            text: m.text,
            anon: !!m.anon,
            fromUsername: m.fromUsername ?? null,
            fromEmail: m.fromEmail ?? null,
            fromGivenName: m.fromGivenName ?? null,
            fromFamilyName: m.fromFamilyName ?? null,
            country: m.country ?? null,
            device: m.device ?? null,
            createdAt: m.createdAt,
          }))
        );
      } catch (error) {
        if (!suppressToast) {
          push({
            title: "Failed to load messages",
            type: "error",
            description:
              error instanceof Error ? error.message : "Try again in a bit.",
          });
        } else {
          console.warn("[Dashboard] Failed to fetch messages silently", error);
        }
      } finally {
        if (!silent && !isCancelled?.()) {
          setLoadingMessages(false);
        }
      }
    },
    [push]
  );

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setMessages([]);
      setUsername(null);
      setNewMessageIds([]);
      previousMessageIdsRef.current = [];
      initialLoadRef.current = true;
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }
      return;
    }

    getToken()
      .then((token) => {
        if (!token || cancelled) return;
        fetchSession(token, () => cancelled);
      })
      .catch(() => {
        if (!cancelled) {
          push({
            title: "Session error",
            type: "error",
            description: "Unable to verify your session. Please sign in again.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, getToken]);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let pending = false;

    if (!user) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    initialLoadRef.current = true;
    previousMessageIdsRef.current = [];
    setNewMessageIds([]);
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }

    const load = async (silent: boolean) => {
      if (pending) return;
      pending = true;
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        await fetchMessages(token, filter, {
          silent,
          isCancelled: () => cancelled,
        });
      } catch (error) {
        if (cancelled) return;
        if (!silent) {
          push({
            title: "Session error",
            type: "error",
            description: "Please sign in again to load messages.",
          });
        } else {
          console.warn(
            "[Dashboard] Unable to refresh messages silently",
            error
          );
        }
      } finally {
        pending = false;
      }
    };

    load(false);
    intervalId = setInterval(() => {
      load(true);
    }, 15000);

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, filter, getToken, fetchMessages, push]);

  useEffect(() => {
    if (!messages.length) {
      previousMessageIdsRef.current = [];
      setNewMessageIds([]);
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }
      initialLoadRef.current = false;
      return;
    }

    if (initialLoadRef.current) {
      previousMessageIdsRef.current = messages.map((message) => message.id);
      initialLoadRef.current = false;
      return;
    }

    const previousIds = new Set(previousMessageIdsRef.current);
    const newlyAdded = messages
      .filter((message) => !previousIds.has(message.id))
      .map((message) => message.id);

    if (newlyAdded.length) {
      setNewMessageIds((current) =>
        Array.from(new Set([...current, ...newlyAdded]))
      );
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = setTimeout(() => {
        setNewMessageIds([]);
        highlightTimeoutRef.current = null;
      }, 10000);
      push({
        title:
          newlyAdded.length > 1
            ? `${newlyAdded.length} new messages`
            : "New message received",
        type: "success",
        description: "They're highlighted in your inbox.",
      });
    }

    previousMessageIdsRef.current = messages.map((message) => message.id);
  }, [messages, push]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <section className="py-16">
        <div className="container">
          <p className="text-sm text-slate-500">Loading your dashboard...</p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="py-16">
        <div className="container grid gap-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-soft">
          <h1 className="text-2xl font-semibold text-slate-900">
            Sign in to view your inbox
          </h1>
          <p className="text-sm text-slate-600">
            Send2me keeps your messages private. Sign in with Google to see
            them.
          </p>
          <div className="mx-auto flex gap-3">
            <Button onClick={signIn}>Sign in with Google</Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-slate-50 py-16">
      <div className="container grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">
                Your inbox
              </h1>
              <span className="inline-flex items-center justify-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {messages.length}
              </span>
            </div>
            <MessageFilterTabs value={filter} onChange={setFilter} />
          </div>

          <div className="space-y-4">
            {newMessageIds.length ? (
              <div className="rounded-3xl border border-brand-200 bg-brand-50 px-5 py-4 text-sm text-brand-700 shadow-soft">
                <span className="font-semibold">
                  {newMessageIds.length} new message
                  {newMessageIds.length > 1 ? "s" : ""}
                </span>{" "}
                just arrived. They&apos;re highlighted below.
              </div>
            ) : null}

            {loadingMessages ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Fetching messages...</p>
              </div>
            ) : messages.length ? (
              messages.map((message) => (
                <MessageCard
                  key={message.id}
                  message={{
                    id: message.id,
                    text: message.text,
                    anon: message.anon,
                    toUid: "",
                    toUsername: username ?? "",
                    createdAt: new Date(message.createdAt),
                    fromUid: null,
                    fromUsername: message.fromUsername,
                    // Newly passed fields
                    fromEmail: message.fromEmail ?? null,
                    fromGivenName: message.fromGivenName ?? null,
                    fromFamilyName: message.fromFamilyName ?? null,
                    country: message.country ?? null,
                    device: message.device ?? null,
                    fromDisplayName:
                      message.fromGivenName && message.fromFamilyName
                        ? `${message.fromGivenName} ${message.fromFamilyName}`
                        : message.fromUsername ?? message.fromEmail ?? "",
                    meta: {
                      ipHash: null,
                      uaHash: null,
                      country: message.country ?? null,
                      device: null
                    },
                  }}
                  highlight={newMessageIds.includes(message.id)}
                />
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
                <p className="text-sm text-slate-500">
                  No messages yet. Share your link to start the conversation.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          {username ? (
            <LinkPanel username={username} />
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-sm text-slate-500">
                Claim your username from the homepage to activate your link.
              </p>
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Need a break?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Sign out when you're done reviewing messages. You can sign back in
              anytime.
            </p>
            <Button variant="ghost" className="mt-4" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </aside>
      </div>
    </section>
  );
}
