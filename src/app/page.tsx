"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LandingPage() {
  const router = useRouter();

  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

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
    <div className="flex min-h-screen flex-col bg-[#f2f4f7] text-[#101828]">
      <main className="flex-1">
        <div className="mx-auto grid min-h-[78vh] max-w-7xl lg:grid-cols-2">
          <section className="flex items-center px-6 py-14 lg:px-10 xl:px-16">
            <div className="max-w-xl">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1877f2] text-4xl font-bold text-white shadow-lg">
                F
              </div>

              <div className="inline-flex px-4 py-2 text-sm font-medium border rounded-full border-cyan-400/30 bg-cyan-400/10 text-cyan-700">
                Welcome to FaceGrem
              </div>

              <h1 className="mt-8 text-5xl font-bold leading-tight tracking-tight text-[#111827] sm:text-6xl">
                Your new social space to connect, share, and grow.
              </h1>
            </div>
          </section>

          <section className="flex items-center px-6 border-l border-black/10 py-14 lg:px-10 xl:px-16">
            <div className="w-full max-w-xl">
              <div className="rounded-[28px] bg-transparent p-0 sm:p-2">
                <h2 className="mb-8 text-3xl font-bold tracking-tight text-[#111827]">
                  Log in to FaceGrem
                </h2>

                <div className="space-y-5">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Email address or mobile number"
                    className="w-full rounded-2xl border border-black/15 bg-white px-5 py-4 text-lg text-[#111827] outline-none transition focus:border-[#1877f2]"
                  />

                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-2xl border border-black/15 bg-white px-5 py-4 text-lg text-[#111827] outline-none transition focus:border-[#1877f2]"
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
                    <button
                      type="button"
                      onClick={() => setIsSignupOpen(true)}
                      className="w-full rounded-2xl border border-[#1877f2] bg-transparent py-4 text-lg font-semibold text-[#1877f2] transition hover:bg-[#1877f2]/5"
                    >
                      Create new account
                    </button>
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

      <footer className="border-t border-black/10 bg-[#f2f4f7] px-6 py-8 text-sm text-slate-500">
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

      {isSignupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/40">
          <div className="relative w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsSignupOpen(false)}
              className="absolute flex items-center justify-center w-10 h-10 text-2xl rounded-full right-4 top-4 bg-black/5 text-slate-500 hover:bg-black/10"
            >
              ×
            </button>

            <h3 className="text-3xl font-bold tracking-tight text-[#111827]">
              Create your FaceGrem account
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Join FaceGrem and start connecting.
            </p>

            <div className="mt-6 space-y-4">
              <input
                type="text"
                value={signupFullName}
                onChange={(e) => setSignupFullName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-2xl border border-black/15 bg-white px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
              />

              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-2xl border border-black/15 bg-white px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
              />

              <input
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-2xl border border-black/15 bg-white px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
              />

              <input
                type="password"
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full rounded-2xl border border-black/15 bg-white px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
              />

              <button
                onClick={handleSignup}
                disabled={loadingSignup}
                className="w-full rounded-2xl bg-[#1877f2] py-4 text-lg font-semibold text-white transition hover:bg-[#166fe5] disabled:opacity-70"
              >
                {loadingSignup ? "Creating account..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}