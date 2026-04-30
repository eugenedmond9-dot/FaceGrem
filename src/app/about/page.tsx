"use client";

import { useState } from "react";
import Link from "next/link";
import FaceGremLogo from "../../components/FaceGremLogo";
import FaceGremHamburgerMenu from "../../components/FaceGremHamburgerMenu";

const values = [
  {
    title: "Connection with meaning",
    body:
      "FaceGrem is built for more than scrolling. It is a place to be seen, to be heard, and to stay close to the people, stories, and communities that matter.",
  },
  {
    title: "A home for every voice",
    body:
      "Whether you are sharing a simple thought, a life moment, a video, a group update, or a message to a friend, FaceGrem gives your voice a place to live.",
  },
  {
    title: "Community first",
    body:
      "People grow better together. FaceGrem is designed around friendships, groups, communities, conversations, and the kind of support that makes people feel they belong.",
  },
];

const features = [
  "Share posts, stories, photos, and videos",
  "Build friendships and follow people you care about",
  "Join groups and communities around shared interests",
  "Message people directly with a cleaner, more personal experience",
  "Save important posts and return to them later",
  "Discover creators, ideas, conversations, and moments",
];

export default function AboutPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden bg-[#020817] text-white">
      
      
      <FaceGremHamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onLogout={undefined}
      />

<button
        type="button"
        onClick={() => setIsMenuOpen(true)}
        className="fixed right-4 top-4 z-[75] flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl text-slate-800 shadow-lg ring-1 ring-black/10 transition hover:bg-slate-100"
        aria-label="Open menu"
      >
        ≡
      </button>

<div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.13),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.10),transparent_25%),linear-gradient(to_bottom,#020817,#07111f_46%,#020817)]" />
        <div className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -right-24 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#020817]/55 backdrop-blur-3xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <FaceGremLogo
              href="/feed"
              showWordmark={false}
              markClassName="h-10 w-10 rounded-2xl ring-0 shadow-sm"
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">FaceGrem</h1>
              <p className="text-xs text-slate-400">About our social world</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/feed"
              className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
            >
              Home Feed
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/feed"
          className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-2xl text-slate-200 transition hover:bg-white/[0.06]"
          aria-label="Back to feed"
        >
          ‹
        </Link>

        <section className="overflow-hidden rounded-[34px] border border-white/[0.07] bg-white/[0.035] shadow-[0_25px_90px_rgba(2,8,23,0.35)] backdrop-blur-2xl">
          <div className="border-b border-white/[0.07] bg-[linear-gradient(135deg,rgba(8,47,73,0.85),rgba(15,23,42,0.92)_55%,rgba(30,41,59,0.92))] p-6 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <p className="text-sm font-semibold text-cyan-200">About FaceGrem</p>
                <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl">
                  A place where people feel close, even when they are far away.
                </h2>
                <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                  FaceGrem is a modern social platform made for real connection. It brings people, stories,
                  friendships, communities, videos, and conversations into one beautiful space where every
                  person can share, discover, and belong.
                </p>
              </div>

              <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.045] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Our promise
                </p>
                <p className="mt-4 text-2xl font-bold leading-tight text-white">
                  Built to make connection feel simple, human, and alive.
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  We believe a social platform should not only keep people online. It should help them feel
                  remembered, valued, inspired, and connected.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-3">
            {values.map((item) => (
              <article
                key={item.title}
                className="rounded-[28px] border border-white/[0.07] bg-white/[0.03] p-5"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-xl">
                  ✦
                </div>
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.body}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-6 border-t border-white/[0.07] p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded-[30px] border border-white/[0.07] bg-white/[0.025] p-6">
              <p className="text-sm font-semibold text-cyan-200">What FaceGrem helps you do</p>
              <h3 className="mt-3 text-3xl font-bold tracking-tight text-white">
                Share your world. Find your people. Build your space.
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                From everyday updates to deeper community conversations, FaceGrem is being shaped as a
                platform where people can express themselves without losing the warmth of real human
                connection.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.035] p-4 text-sm leading-6 text-slate-200"
                  >
                    <span className="mr-2 text-cyan-200">✓</span>
                    {feature}
                  </div>
                ))}
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-[30px] border border-white/[0.07] bg-white/[0.035] p-6">
                <p className="text-sm font-semibold text-cyan-200">Why we exist</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  People need more than a feed. They need a place that feels personal. A place where their
                  friendships, memories, interests, beliefs, creativity, and communities can grow together.
                </p>
              </div>

              <div className="rounded-[30px] border border-white/[0.07] bg-white/[0.035] p-6">
                <p className="text-sm font-semibold text-cyan-200">The feeling we want</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  When someone opens FaceGrem, we want them to feel: “This is my space. These are my people.
                  I belong here.”
                </p>
              </div>
            </aside>
          </div>

          <div className="border-t border-white/[0.07] p-5 sm:p-8">
            <div className="rounded-[30px] border border-cyan-300/10 bg-cyan-400/[0.06] p-6 text-center sm:p-8">
              <h3 className="text-2xl font-bold text-white sm:text-3xl">
                FaceGrem is still growing — and every great community starts with people.
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                Thank you for being part of the journey. The goal is to build something that feels beautiful,
                useful, welcoming, and powerful enough to bring people closer every day.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/feed"
                  className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                >
                  Open FaceGrem
                </Link>
                <Link
                  href="/help"
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                >
                  Visit Help
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
