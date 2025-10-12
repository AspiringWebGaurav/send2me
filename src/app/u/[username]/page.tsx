
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getUserByUsername } from "@/lib/firestore";
import { MessageForm } from "@/components/profile/MessageForm";

type PageProps = {
  params: { username: string };
};

async function fetchUser(username: string) {
  const user = await getUserByUsername(username);
  if (!user) {
    notFound();
  }
  return user;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = params;
  const user = await getUserByUsername(username);
  if (!user) {
    return {
      title: "Profile not found",
    };
  }
  return {
    title: `${user.username} on Send2me`,
    description: `Send an anonymous message to ${user.username} on Send2me.`,
    openGraph: {
      title: `${user.username} on Send2me`,
      description: `Send an anonymous message to ${user.username}.`,
    },
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = params;
  const user = await fetchUser(username);

  return (
    <section className="bg-slate-50 py-16">
      <div className="container grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-slate-900">Message {user.username}</h1>
          <p className="text-sm text-slate-600">
            Share your thoughts, encouragement, or feedback. Be respectful - Send2me protects everyone
            with moderation and rate limits.
          </p>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <MessageForm toUsername={user.username} />
          </div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Tips for great feedback</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
              <li>Be specific about what you love or what could be better.</li>
              <li>Keep it supportive - no hate speech or personal attacks.</li>
              <li>We filter spam to keep inboxes safe.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
