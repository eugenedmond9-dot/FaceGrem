"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LandingPage() {
  const router = useRouter();

  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupFullName, setSignupFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

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

  const handleSignup = async () => {
    if (
      !signupFullName.trim() ||
      !signupEmail.trim() ||
      !signupPassword.trim() ||
      !signupConfirmPassword.trim()
    ) {
      alert("Please fill in all fields.");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (signupPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setLoadingSignup(true);

    const { error } = await supabase.auth.signUp({
      email: signupEmail.trim(),
      password: signupPassword,
      options: {
        data: {
          full_name: signupFullName.trim(),
        },
      },
    });

    setLoadingSignup(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Account created successfully. Check your email if confirmation is enabled.");
    setIsSignupOpen(false);
    setSignupFullName("");
    setSignupEmail("");
    setSignupPassword("");
    setSignupConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10 bg-[#07111f]/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-5 mx-auto max-w-7xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center text-2xl font-bold shadow-lg h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/20">
              F
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">FaceGrem</h1>
              <p className="text-sm text-slate-400">Connect. Share. Belong.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const loginCard = document.getElementById("login-card");
                loginCard?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="px-6 py-3 text-sm font-medium transition border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Login
            </button>

            <button
              onClick={() => setIsSignupOpen(true)}
              className="px-6 py-3 text-sm font-semibold transition bg-white rounded-2xl text-slate-900 hover:opacity-95"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section>
          <div className="inline-flex px-4 py-2 text-sm border rounded-full border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
            Welcome to FaceGrem
          </div>

          <h2 className="max-w-4xl mt-8 text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Your new social space to connect, share, and grow.
          </h2>

          <p className="max-w-3xl mt-8 text-xl leading-9 text-slate-300">
            FaceGrem is where people meet, post, follow, message, discover creators,
            and build real community in one place.
          </p>

          <div className="flex flex-wrap gap-4 mt-10">
            <button
              onClick={() => setIsSignupOpen(true)}
              className="px-8 py-4 text-lg font-semibold transition bg-white rounded-2xl text-slate-900 hover:opacity-95"
            >
              Join FaceGrem
            </button>

            <button
              onClick={() => {
                const loginCard = document.getElementById("login-card");
                loginCard?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="px-8 py-4 text-lg font-medium transition border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Log in
            </button>
          </div>

          <div className="grid gap-4 mt-12 sm:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-sm text-slate-400">Profiles</p>
              <p className="mt-3 text-4xl font-bold">Real</p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-sm text-slate-400">Messaging</p>
              <p className="mt-3 text-4xl font-bold">Live</p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-sm text-slate-400">Community</p>
              <p className="mt-3 text-4xl font-bold">Active</p>
            </div>
          </div>
        </section>

        <section
          id="login-card"
          className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
        >
          <h3 className="text-3xl font-bold tracking-tight">Log in to FaceGrem</h3>
          <p className="mt-3 text-sm text-slate-400">
            Access your account and continue where you left off.
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <label className="block mb-2 text-sm text-slate-300">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-4 text-white transition border outline-none rounded-2xl border-white/10 bg-white/10 placeholder:text-slate-400 focus:border-cyan-400/60"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm text-slate-300">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-4 text-white transition border outline-none rounded-2xl border-white/10 bg-white/10 placeholder:text-slate-400 focus:border-cyan-400/60"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loadingLogin}
              className="w-full py-4 text-lg font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
            >
              {loadingLogin ? "Logging in..." : "Log In"}
            </button>

            <button
              type="button"
              className="w-full text-sm transition text-cyan-300 hover:text-cyan-200"
              onClick={() => alert("Forgot password flow can be added next.")}
            >
              Forgot password?
            </button>

            <div className="pt-5 border-t border-white/10">
              <button
                onClick={() => setIsSignupOpen(true)}
                className="block px-6 py-3 mx-auto text-sm font-semibold transition bg-white rounded-2xl text-slate-900 hover:opacity-95"
              >
                Create new account
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#07111f] px-6 py-8 text-sm text-slate-400">
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
                className="transition hover:text-cyan-300"
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
                className="transition hover:text-cyan-300"
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          <p className="mt-6 text-xs text-slate-500">FaceGrem © 2026</p>
        </div>
      </footer>

      {isSignupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#101a2b] p-6 shadow-2xl">
            <button
              onClick={() => setIsSignupOpen(false)}
              className="absolute flex items-center justify-center w-10 h-10 text-xl rounded-full right-5 top-5 bg-white/10 text-slate-300 hover:bg-white/20"
            >
              ×
            </button>

            <h3 className="text-3xl font-bold tracking-tight">Create your FaceGrem account</h3>
            <p className="mt-2 text-sm text-slate-400">
              Join the conversation and start building your community.
            </p>

            <div className="mt-8 space-y-5">
              <div>
                <label className="block mb-2 text-sm text-slate-300">Full name</label>
                <input
                  type="text"
                  value={signupFullName}
                  onChange={(e) => setSignupFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-4 text-white transition border outline-none rounded-2xl border-white/10 bg-white/10 placeholder:text-slate-400 focus:border-cyan-400/60"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm text-slate-300">Email</label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-4 text-white transition border outline-none rounded-2xl border-white/10 bg-white/10 placeholder:text-slate-400 focus:border-cyan-400/60"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm text-slate-300">Password</label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-4 text-white transition border outline-none rounded-2xl border-white/10 bg-white/10 placeholder:text-slate-400 focus:border-cyan-400/60"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm text-slate-300">Confirm password</label>
                <input
                  type="password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-4 text-white transition border outline-none rounded-2xl border-white/10 bg-white/10 placeholder:text-slate-400 focus:border-cyan-400/60"
                />
              </div>

              <button
                onClick={handleSignup}
                disabled={loadingSignup}
                className="w-full py-4 text-lg font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
              >
                {loadingSignup ? "Creating account..." : "Create Account"}
              </button>

              <p className="text-sm text-center text-slate-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignupOpen(false)}
                  className="font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Login
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}