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
    <div className="min-h-screen overflow-hidden bg-[#f0f2f5] text-[#050505]">
      <FaceGremHamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-[#f0f2f5]/55 backdrop-blur-xl">
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
              <h1 className="text-lg font-bold tracking-tight text-slate-900">FaceGrem</h1>
              <p className="text-xs text-slate-500">About our social world</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/feed"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Home Feed
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/feed"
          className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl text-slate-700 transition hover:bg-slate-100"
          aria-label="Back to feed"
        >
          ‹
        </Link>

        <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm backdrop-blur-xl">
          <div className="border-b border-slate-200 bg-white p-6 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <p className="text-sm font-semibold text-blue-600">About FaceGrem</p>
                <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
                  A place where people feel close, even when they are far away.
                </h2>
                <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                  FaceGrem is a modern social platform made for real connection. It brings people, stories,
                  friendships, communities, videos, and conversations into one beautiful space where every
                  person can share, discover, and belong.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Our promise
                </p>
                <p className="mt-4 text-2xl font-bold leading-tight text-[#050505]">
                  Built to make connection feel simple, human, and alive.
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
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
                className="rounded-[28px] border border-slate-200 bg-white p-5"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl">
                  ✦
                </div>
                <h3 className="text-xl font-bold text-[#050505]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-6 border-t border-slate-200 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <p className="text-sm font-semibold text-blue-600">What FaceGrem helps you do</p>
              <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                Share your world. Find your people. Build your space.
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                From everyday updates to deeper community conversations, FaceGrem is being shaped as a
                platform where people can express themselves without losing the warmth of real human
                connection.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700"
                  >
                    <span className="mr-2 text-blue-600">✓</span>
                    {feature}
                  </div>
                ))}
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-[30px] border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold text-blue-600">Why we exist</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  People need more than a feed. They need a place that feels personal. A place where their
                  friendships, memories, interests, beliefs, creativity, and communities can grow together.
                </p>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold text-blue-600">The feeling we want</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  When someone opens FaceGrem, we want them to feel: “This is my space. These are my people.
                  I belong here.”
                </p>
              </div>
            </aside>
          </div>

          <div className="border-t border-slate-200 p-5 sm:p-8">
            <div className="rounded-[30px] border border-cyan-300/10 bg-blue-50 p-6 text-center sm:p-8">
              <h3 className="text-2xl font-bold text-[#050505] sm:text-3xl">
                FaceGrem is still growing — and every great community starts with people.
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                Thank you for being part of the journey. The goal is to build something that feels beautiful,
                useful, welcoming, and powerful enough to bring people closer every day.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/feed"
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Open FaceGrem
                </Link>
                <Link
                  href="/help"
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
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
