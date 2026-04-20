"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(24,119,242,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.14),transparent_30%),linear-gradient(to_bottom_right,#f2f4f7,#edf4ff)]" />

      <div className="absolute -left-16 top-16 h-72 w-72 animate-[floatOne_14s_ease-in-out_infinite] rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="absolute right-0 top-28 h-80 w-80 animate-[floatTwo_18s_ease-in-out_infinite] rounded-full bg-blue-400/25 blur-3xl" />
      <div className="absolute bottom-10 left-1/3 h-72 w-72 animate-[floatThree_16s_ease-in-out_infinite] rounded-full bg-violet-400/20 blur-3xl" />
      <div className="absolute bottom-0 right-20 h-64 w-64 animate-[floatOne_20s_ease-in-out_infinite] rounded-full bg-sky-300/20 blur-3xl" />

      <style jsx global>{`
        @keyframes floatOne {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(30px, -20px, 0) scale(1.08); }
        }
        @keyframes floatTwo {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-35px, 25px, 0) scale(1.06); }
        }
        @keyframes floatThree {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(15px, -30px, 0) scale(1.1); }
        }
      `}</style>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();

  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.push("/feed");
      }
    };

    void checkSession();
  }, [router]);

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      alert("Enter your email and password.");
      return;
    }

    setLoadingLogin(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    setLoadingLogin(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/feed");
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f2f4f7] text-[#101828]">
      <AnimatedBackground />

      <main className="relative z-10 flex-1 px-5 py-8 sm:px-6">
        <div className="mx-auto grid min-h-[78vh] max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <section className="flex items-center">
            <div className="max-w-[560px]">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#1877f2] text-4xl font-bold text-white shadow-lg shadow-blue-500/20">
                F
              </div>

              <div className="inline-flex px-4 py-2 text-sm font-medium border rounded-full border-cyan-400/30 bg-white/50 text-cyan-700 backdrop-blur-md">
                Welcome to FaceGrem
              </div>

              <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight text-[#111827] sm:text-5xl lg:text-6xl">
                Your new social space to connect, share, and grow.
              </h1>
            </div>
          </section>

          <section className="flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-[560px]">
              <div className="rounded-[28px] border border-white/60 bg-white/55 p-6 shadow-[0_20px_80px_rgba(24,119,242,0.08)] backdrop-blur-xl sm:p-8">
                <h2 className="mb-8 text-3xl font-bold tracking-tight text-[#111827]">
                  Log in to FaceGrem
                </h2>

                <div className="space-y-5">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Email address or mobile number"
                    className="w-full rounded-2xl border border-black/10 bg-white/90 px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
                  />

                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-2xl border border-black/10 bg-white/90 px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
                  />

                  <button
                    onClick={handleLogin}
                    disabled={loadingLogin}
                    className="w-full rounded-2xl bg-[#1877f2] py-4 text-lg font-semibold text-white transition hover:bg-[#166fe5] disabled:opacity-70"
                  >
                    {loadingLogin ? "Logging in..." : "Log in"}
                  </button>

                  <button
                    type="button"
                    onClick={() => alert("Forgot password flow can be added next.")}
                    className="block w-full text-center text-lg font-medium text-[#111827] transition hover:text-[#1877f2]"
                  >
                    Forgotten password?
                  </button>

                  <div className="pt-8">
                    <Link
                      href="/signup"
                      className="block w-full rounded-2xl border border-[#1877f2] bg-transparent py-4 text-center text-lg font-semibold text-[#1877f2] transition hover:bg-[#1877f2]/5"
                    >
                      Create new account
                    </Link>
                  </div>

                  <p className="pt-3 text-center text-xl font-semibold text-[#111827]">
                    FaceGrem
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="relative z-10 px-6 py-8 text-sm border-t border-black/10 bg-white/35 text-slate-500 backdrop-blur-md">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {[
              "English (UK)",
              "Kiswahili",
              "Français (France)",
              "Español",
              "Português (Brasil)",
              "العربية",
              "Deutsch",
              "More languages…",
            ].map((item) => (
              <button
                key={item}
                className="transition hover:text-[#1877f2]"
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap mt-6 gap-x-4 gap-y-2">
            {[
              "Sign up",
              "Log in",
              "Video",
              "Threads",
              "Privacy Policy",
              "Privacy Centre",
              "About",
              "Create ad",
              "Create Page",
              "Developers",
              "Careers",
              "Cookies",
              "AdChoices",
              "Terms",
              "Help",
              "Contact uploading and non-users",
            ].map((item) => (
              <button
                key={item}
                className="transition hover:text-[#1877f2]"
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          <p className="mt-6 text-xs text-slate-500">FaceGrem © 2026</p>
        </div>
      </footer>
    </div>
  );
}