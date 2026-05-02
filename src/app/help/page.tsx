"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import FaceGremLogo from "../../components/FaceGremLogo";
import FaceGremHamburgerMenu from "../../components/FaceGremHamburgerMenu";
import LanguageMenu from "../../components/LanguageMenu";

const helpCategories = [
  {
    title: "Account & login",
    icon: "🔐",
    description: "Get help with signing in, profile setup, password recovery, and account access.",
    topics: ["Login problems", "Profile setup", "Account safety", "Password help"],
  },
  {
    title: "Posts, stories & videos",
    icon: "✨",
    description: "Learn how to share updates, upload media, manage posts, and improve your feed.",
    topics: ["Create posts", "Upload videos", "Stories", "Saved content"],
  },
  {
    title: "Messages & calls",
    icon: "💬",
    description: "Support for direct messages, conversations, voice notes, audio calls, and video calls.",
    topics: ["Send messages", "Voice recordings", "Audio calls", "Video calls"],
  },
  {
    title: "Friends, groups & communities",
    icon: "🤝",
    description: "Find people, connect with friends, join groups, and build meaningful communities.",
    topics: ["Friends", "Groups", "Communities", "Members"],
  },
  {
    title: "Privacy & security",
    icon: "🛡️",
    description: "Understand privacy controls, cookies, account protection, and safe platform behavior.",
    topics: ["Privacy", "Cookies", "Security", "Reporting"],
  },
  {
    title: "Settings & preferences",
    icon: "⚙️",
    description: "Manage language, notifications, appearance, profile information, and account options.",
    topics: ["Language", "Notifications", "Settings", "Preferences"],
  },
];

const popularQuestions = [
  {
    question: "I cannot log in. What should I check first?",
    answer:
      "Confirm that your email and password are correct, refresh the page, and try again. If the issue continues, check the browser console or Supabase auth settings for the exact error.",
  },
  {
    question: "Why is my upload not working?",
    answer:
      "Uploads depend on Supabase Storage policies and bucket names. Make sure the file path starts with your user ID and that the bucket allows authenticated users to upload to their own folder.",
  },
  {
    question: "Why are messages not showing in real time?",
    answer:
      "Realtime depends on Supabase Realtime being enabled for the correct tables and your page subscribing to the right conversation or message channel.",
  },
  {
    question: "How do I control cookies?",
    answer:
      "Open the Cookies page from the hamburger menu. You can accept all, choose essential only, or manage optional categories like performance and personalization.",
  },
  {
    question: "How do I report a problem?",
    answer:
      "For now, collect the page name, the action you tried, the error message, and a screenshot. A dedicated reporting form can be added as the platform grows.",
  },
];

const quickActions = [
  { label: "Open Feed", href: "/feed", icon: "⌂" },
  { label: "Messages", href: "/messages", icon: "▣" },
  { label: "Settings", href: "/settings", icon: "⚙" },
  { label: "Privacy", href: "/privacy", icon: "🔒" },
  { label: "Cookies", href: "/cookies", icon: "🍪" },
  { label: "Terms", href: "/terms", icon: "📄" },
];

const contactOptions = [
  {
    title: "Technical issue",
    body:
      "Send the exact error, the page name, what you clicked, and whether it happened on phone or desktop.",
  },
  {
    title: "Account or safety concern",
    body:
      "Include your username, the profile or post involved, and a short explanation of what happened.",
  },
  {
    title: "Feature request",
    body:
      "Describe what you want FaceGrem to do, why it matters, and where it should appear in the app.",
  },
];

export default function HelpPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openQuestion, setOpenQuestion] = useState(popularQuestions[0].question);

  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return helpCategories;

    return helpCategories.filter((category) => {
      return (
        category.title.toLowerCase().includes(term) ||
        category.description.toLowerCase().includes(term) ||
        category.topics.some((topic) => topic.toLowerCase().includes(term))
      );
    });
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-[#050505]">
      <FaceGremHamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-700 shadow-sm transition hover:bg-slate-200"
              aria-label="Open menu"
            >
              ≡
            </button>

            <FaceGremLogo
              href="/feed"
              showWordmark={false}
              markClassName="h-10 w-10 rounded-2xl ring-0 shadow-sm"
            />

            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-950">FaceGrem</h1>
              <p className="text-xs text-slate-500">Help Center</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageMenu compact />
            <Link
              href="/feed"
              className="hidden rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:inline-flex"
            >
              Back to Feed
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/feed"
          className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
          aria-label="Back to feed"
        >
          ‹
        </Link>

        <section className="overflow-hidden rounded-[34px] bg-white shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-6 border-b border-slate-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                FaceGrem Support
              </p>
              <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                How can we help you today?
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
                Find quick answers, troubleshoot common problems, learn how FaceGrem works, and
                get clear guidance for account, privacy, messaging, communities, videos, and settings.
              </p>

              <div className="mt-6 max-w-2xl rounded-[24px] bg-white p-2 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center gap-3 rounded-[20px] bg-slate-50 px-4 py-3">
                  <span className="text-xl">🔎</span>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search help topics..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            <aside className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-950">Support status</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
                  <span className="text-sm font-semibold text-emerald-700">Website</span>
                  <span className="text-xs font-bold text-emerald-700">Online</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-3">
                  <span className="text-sm font-semibold text-blue-700">Security</span>
                  <span className="text-xs font-bold text-blue-700">Protected</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-700">Help topics</span>
                  <span className="text-xs font-bold text-slate-600">{helpCategories.length}</span>
                </div>
              </div>
            </aside>
          </div>

          <div className="grid gap-4 p-5 sm:p-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <article
                key={category.title}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                  {category.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-950">{category.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{category.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {category.topics.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
              Popular questions
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Quick answers for common issues
            </h3>

            <div className="mt-5 space-y-3">
              {popularQuestions.map((item) => {
                const isOpen = openQuestion === item.question;

                return (
                  <article
                    key={item.question}
                    className="overflow-hidden rounded-[22px] border border-slate-200 bg-white"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenQuestion(isOpen ? "" : item.question)
                      }
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="font-semibold text-slate-950">{item.question}</span>
                      <span className="text-xl text-slate-500">{isOpen ? "−" : "+"}</span>
                    </button>

                    {isOpen ? (
                      <p className="border-t border-slate-100 px-5 py-4 text-sm leading-7 text-slate-600">
                        {item.answer}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
                Quick actions
              </p>
              <div className="mt-4 grid gap-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-base shadow-sm">
                      {action.icon}
                    </span>
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] bg-blue-600 p-5 text-white shadow-sm">
              <p className="text-sm font-semibold text-blue-100">Need direct support?</p>
              <h3 className="mt-2 text-2xl font-bold">Prepare a clear report</h3>
              <p className="mt-3 text-sm leading-7 text-blue-50">
                The best report includes the page name, what you clicked, what you expected, what
                happened, and a screenshot or exact error message.
              </p>
            </div>
          </aside>
        </section>

        <section className="mt-6 rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
            Contact guidance
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            What to include when asking for help
          </h3>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {contactOptions.map((option) => (
              <article
                key={option.title}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
              >
                <h4 className="font-bold text-slate-950">{option.title}</h4>
                <p className="mt-3 text-sm leading-7 text-slate-600">{option.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
