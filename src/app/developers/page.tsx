"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import FaceGremLogo from "../../components/FaceGremLogo";
import FaceGremHamburgerMenu from "../../components/FaceGremHamburgerMenu";
import LanguageMenu from "../../components/LanguageMenu";

const developerAreas = [
  {
    title: "Platform foundation",
    icon: "▦",
    description:
      "FaceGrem is built around a modern Next.js interface, Supabase data layer, realtime updates, and Vercel deployment.",
    items: ["Next.js", "TypeScript", "Supabase", "Vercel"],
  },
  {
    title: "Realtime experience",
    icon: "◉",
    description:
      "Messages, notifications, calls, comments, likes, and social activity should feel alive without forcing people to refresh.",
    items: ["Realtime messages", "Notifications", "Presence", "Live activity"],
  },
  {
    title: "Security first",
    icon: "◇",
    description:
      "FaceGrem development should protect user data with RLS, storage policies, secure headers, validation, and abuse prevention.",
    items: ["RLS", "Storage policies", "Security headers", "Rate limiting"],
  },
  {
    title: "User experience",
    icon: "✦",
    description:
      "Every feature should feel clean, fast, responsive, and consistent across phone and desktop.",
    items: ["Mobile layout", "Desktop layout", "Accessibility", "Performance"],
  },
];

const roadmap = [
  {
    stage: "Current",
    title: "Core social platform",
    body:
      "Feed, profile, friends, groups, communities, saved posts, videos, messages, notifications, settings, help, privacy, and cookies.",
  },
  {
    stage: "Next",
    title: "Developer-ready architecture",
    body:
      "Clean reusable components, stronger shared layouts, centralized security helpers, better validation, and easier feature expansion.",
  },
  {
    stage: "Future",
    title: "Public developer ecosystem",
    body:
      "API documentation, integrations, webhooks, creator tools, moderation tools, and partner features can be introduced when the platform is ready.",
  },
];

const principles = [
  "Build features that work on phone and desktop together.",
  "Never expose service role keys or private secrets in the browser.",
  "Use Supabase RLS as the real database defense.",
  "Validate user input before saving data.",
  "Keep UI components reusable across pages.",
  "Test login, posts, messages, uploads, and notifications after every security change.",
];

const resources = [
  { label: "Security Center", href: "/privacy", icon: "🔒" },
  { label: "Cookie Controls", href: "/cookies", icon: "🍪" },
  { label: "Help Center", href: "/help", icon: "?" },
  { label: "Settings", href: "/settings", icon: "⚙" },
  { label: "Terms", href: "/terms", icon: "📄" },
  { label: "Back to Feed", href: "/feed", icon: "⌂" },
];

const stackCards = [
  {
    title: "Frontend",
    body: "Next.js, React, TypeScript, Tailwind-style utility classes, responsive layouts, and shared components.",
  },
  {
    title: "Backend & data",
    body: "Supabase Auth, Postgres, Realtime, Storage, RLS policies, and secure table relationships.",
  },
  {
    title: "Deployment",
    body: "Vercel hosting, custom domain support, security headers, firewall rules, and production monitoring.",
  },
];

export default function DevelopersPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAreas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return developerAreas;

    return developerAreas.filter((area) => {
      return (
        area.title.toLowerCase().includes(term) ||
        area.description.toLowerCase().includes(term) ||
        area.items.some((item) => item.toLowerCase().includes(term))
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
              <p className="text-xs text-slate-500">Developers</p>
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
          <div className="grid gap-6 border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white sm:p-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">
                FaceGrem Developer Hub
              </p>
              <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
                Build, protect, and scale the FaceGrem experience.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-blue-50/90">
                This developer page gives a professional overview of the platform direction,
                technical foundation, security priorities, and future developer ecosystem for
                FaceGrem.
              </p>

              <div className="mt-6 max-w-2xl rounded-[24px] bg-white/10 p-2 ring-1 ring-white/10">
                <div className="flex items-center gap-3 rounded-[20px] bg-white px-4 py-3">
                  <span className="text-xl">🔎</span>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search developer topics..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            <aside className="rounded-[28px] bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur-xl">
              <p className="text-sm font-semibold text-blue-100">Platform status</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span className="text-sm font-semibold">Frontend</span>
                  <span className="text-xs font-bold text-emerald-200">Active</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span className="text-sm font-semibold">Database security</span>
                  <span className="text-xs font-bold text-emerald-200">RLS enabled</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span className="text-sm font-semibold">Cookie controls</span>
                  <span className="text-xs font-bold text-emerald-200">Ready</span>
                </div>
              </div>
            </aside>
          </div>

          <div className="grid gap-4 p-5 sm:p-8 md:grid-cols-2 lg:grid-cols-4">
            {filteredAreas.map((area) => (
              <article
                key={area.title}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl font-black text-blue-700">
                  {area.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-950">{area.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{area.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {area.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      {item}
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
              Development roadmap
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              A clean path from product to platform
            </h3>

            <div className="mt-5 space-y-4">
              {roadmap.map((item) => (
                <article
                  key={item.stage}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                      {item.stage}
                    </span>
                    <h4 className="font-bold text-slate-950">{item.title}</h4>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
                Resources
              </p>
              <div className="mt-4 grid gap-2">
                {resources.map((resource) => (
                  <Link
                    key={resource.href}
                    href={resource.href}
                    className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-base shadow-sm">
                      {resource.icon}
                    </span>
                    {resource.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] bg-blue-600 p-5 text-white shadow-sm">
              <p className="text-sm font-semibold text-blue-100">Developer principle</p>
              <h3 className="mt-2 text-2xl font-bold">Ship carefully. Protect users first.</h3>
              <p className="mt-3 text-sm leading-7 text-blue-50">
                Every technical decision should keep the platform stable, secure, fast, and easy
                to understand.
              </p>
            </div>
          </aside>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {stackCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <h3 className="text-lg font-bold text-slate-950">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{card.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
            Engineering rules
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Standards every FaceGrem update should follow
          </h3>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {principles.map((principle) => (
              <div
                key={principle}
                className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                  ✓
                </span>
                {principle}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
