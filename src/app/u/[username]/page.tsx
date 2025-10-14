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
    <section className="bg-slate-50 py-12 sm:py-16">
      <div
        className="
          container 
          mx-auto 
          grid 
          grid-cols-1 
          gap-8 
          px-4 
          sm:px-6 
          lg:px-8 
          lg:grid-cols-[1.1fr_0.9fr]
          max-w-6xl
        "
      >
        {/* Left Column - Message Section */}
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            Message {user.username}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Share your thoughts, encouragement, or feedback. Be respectful — Send2me protects everyone
            with moderation and rate limits.
          </p>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-soft">
            <MessageForm toUsername={user.username} />
          </div>
        </div>

        {/* Right Column - Tips Section */}
        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
              Tips for great feedback
            </h2>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm sm:text-base text-slate-600">
              <li>Be specific about what you appreciate or what could improve.</li>
              <li>Write in a kind and constructive tone — empathy goes a long way.</li>
              <li>Avoid personal attacks, harsh criticism, or hate speech.</li>
              <li>Short and clear feedback often has the most impact.</li>
              <li>Encourage growth — highlight what worked well first.</li>
              <li>Stay anonymous responsibly: honesty ≠ negativity.</li>
              <li>We automatically filter profanity, spam, and harmful language.</li>
              <li>Think before you send — would you say it face to face?</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}