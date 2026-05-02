"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FaceGremLogo from "../components/FaceGremLogo";
import LanguageMenu from "../components/LanguageMenu";
import { supabase } from "../lib/supabase";

const featureCards = [
  {
    title: "Live social feed",
    body: "Share posts, stories, videos, thoughts, and everyday moments in a clean modern feed.",
    icon: "⌂",
  },
  {
    title: "Messages and calls",
    body: "Stay close with direct conversations, voice notes, audio calls, and video call features.",
    icon: "▣",
  },
  {
    title: "Groups and communities",
    body: "Discover people, join groups, create communities, and build spaces that feel meaningful.",
    icon: "◉",
  },
  {
    title: "Privacy-first foundation",
    body: "FaceGrem is designed with account protection, storage rules, security headers, and RLS policies.",
    icon: "◇",
  },
];

const trustItems = [
  "Protected account sessions",
  "Supabase RLS data security",
  "Professional privacy and cookie controls",
  "Vercel firewall abuse protection",
];

const showcaseItems = [
  {
    label: "Feed",
    value: "Live",
    detail: "Posts, likes, comments, stories",
  },
  {
    label: "Chat",
    value: "Real-time",
    detail: "Messages, voice, calls",
  },
  {
    label: "Community",
    value: "Connected",
    detail: "Groups, creators, members",
  },
];

export default function LandingPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.push("/feed");
        return;
      }

      setIsCheckingSession(false);
    };

    void checkSession();
  }, [router]);

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    const trimmedEmail = email.trim();
    const trimmedFullName = fullName.trim();

    if (!trimmedEmail || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    if (mode === "signup" && !trimmedFullName) {
      setMessage("Please enter your name to create your account.");
      return;
    }

    setIsSubmitting(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        setMessage(error.message);
        setIsSubmitting(false);
        return;
      }

      router.push("/feed");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          full_name: trimmedFullName,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    const createdUser = data.user;

    if (createdUser) {
      await supabase.from("profiles").upsert({
        id: createdUser.id,
        full_name: trimmedFullName,
        username: trimmedEmail.split("@")[0],
        bio: "",
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          trimmedFullName
        )}&background=2563eb&color=ffffff&bold=true`,
      });
    }

    setMessage("Account created. You can now continue to your feed.");
    router.push("/feed");
  };

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5] text-slate-700">
        <div className="rounded-[28px] bg-white px-6 py-5 text-center shadow-sm ring-1 ring-slate-200">
          <FaceGremLogo
            href="/"
            showWordmark={false}
            markClassName="mx-auto h-12 w-12 rounded-2xl ring-0 shadow-sm"
          />
          <p className="mt-3 text-sm font-semibold">Opening FaceGrem...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f0f2f5] text-[#050505]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-200/45 blur-3xl" />
        <div className="absolute -right-24 top-24 h-[30rem] w-[30rem] rounded-full bg-sky-200/45 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-indigo-100/55 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <FaceGremLogo
              href="/"
              showWordmark={false}
              markClassName="h-11 w-11 rounded-2xl ring-0 shadow-sm"
            />
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-950">FaceGrem</h1>
              <p className="text-xs font-medium text-slate-500">Your social world, live now</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageMenu compact />
            <Link
              href="/help"
              className="hidden rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 sm:inline-flex"
            >
              Help
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_430px] lg:items-center lg:py-14">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm ring-1 ring-blue-100">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            Secure, social, and built for connection
          </div>

          <h2 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            Connect, share, message, and grow your world on FaceGrem.
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-9 text-slate-600">
            FaceGrem brings your feed, friends, videos, groups, communities, messages, privacy,
            and settings into one clean professional social experience.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href="#auth-card"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
            >
              Get started
            </a>
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              Learn more
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {showcaseItems.map((item) => (
              <article
                key={item.label}
                className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-slate-200"
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">{item.value}</p>
                <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <aside id="auth-card" className="rounded-[34px] bg-white p-5 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 sm:p-6">
          <div className="rounded-[28px] bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 p-5 text-white">
            <p className="text-sm font-semibold text-blue-50">Welcome to FaceGrem</p>
            <h3 className="mt-2 text-3xl font-black tracking-tight">
              {mode === "login" ? "Log in to continue" : "Create your account"}
            </h3>
            <p className="mt-3 text-sm leading-6 text-blue-50">
              Join your feed, messages, groups, videos, and communities from one beautiful place.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                mode === "login"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:bg-white/70"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setMessage("");
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                mode === "signup"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:bg-white/70"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleAuth} className="mt-5 space-y-4">
            {mode === "signup" ? (
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Full name
                </span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your name"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white"
              />
            </label>

            {message ? (
              <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? mode === "login"
                  ? "Logging in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Log in"
                  : "Create account"}
            </button>
          </form>

          <div className="mt-5 rounded-[24px] bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-950">Protected experience</p>
            <div className="mt-3 grid gap-2">
              {trustItems.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                    ✓
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:pb-14">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[30px] bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl font-black text-blue-700">
                {feature.icon}
              </div>
              <h3 className="mt-5 text-xl font-black text-slate-950">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{feature.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[34px] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
              Built for real people
            </p>
            <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              A modern social platform with a cleaner, brighter, more professional feel.
            </h3>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600">
              FaceGrem is being shaped into a place where people can post, discover, message,
              join groups, watch videos, manage privacy, and personalize their experience without
              feeling lost in a heavy or confusing layout.
            </p>
          </section>

          <aside className="rounded-[34px] bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-sm font-semibold text-blue-200">Creator-ready</p>
            <h3 className="mt-3 text-3xl font-black">Start your world.</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Share your ideas, grow your circle, join meaningful communities, and build your
              digital presence with FaceGrem.
            </p>
            <a
              href="#auth-card"
              className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100"
            >
              Join now
            </a>
          </aside>
        </div>
      </section>

      <footer className="relative z-10 border-t border-slate-200 bg-white/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>© 2026 FaceGrem. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="font-semibold hover:text-blue-600">
              Privacy
            </Link>
            <Link href="/cookies" className="font-semibold hover:text-blue-600">
              Cookies
            </Link>
            <Link href="/terms" className="font-semibold hover:text-blue-600">
              Terms
            </Link>
            <Link href="/help" className="font-semibold hover:text-blue-600">
              Help
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
