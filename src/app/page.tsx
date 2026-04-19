"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Page() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      router.push("/feed");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim() || "FaceGrem User",
        },
      },
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    alert("Account created successfully. Welcome to FaceGrem.");
    router.push("/feed");
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10 bg-[#07111f]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center font-bold shadow-lg h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/20">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FaceGrem</h1>
              <p className="text-xs text-slate-400">Connect. Share. Belong.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsLogin(true)}
              className="px-4 py-2 text-sm text-white transition border rounded-xl border-white/10 hover:bg-white/5"
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className="px-4 py-2 text-sm font-semibold text-black transition bg-white rounded-xl hover:opacity-90"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <main className="grid gap-12 px-6 py-20 mx-auto max-w-7xl lg:grid-cols-2">
        <section className="flex flex-col justify-center">
          <p className="inline-flex px-4 py-2 text-sm font-medium border rounded-full w-fit border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
            Welcome to FaceGrem
          </p>

          <h2 className="mt-6 text-5xl font-bold leading-tight tracking-tight">
            Your new social space to connect, share, and grow.
          </h2>

          <p className="max-w-xl mt-6 text-lg leading-8 text-slate-300">
            FaceGrem is where people meet, post, follow, message, discover
            creators, and build real community in one place.
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <button
              onClick={() => setIsLogin(false)}
              className="px-6 py-3 font-semibold text-black transition bg-white rounded-2xl hover:opacity-90"
            >
              Join FaceGrem
            </button>

            <button
              onClick={() => setIsLogin(true)}
              className="px-6 py-3 text-white transition border rounded-2xl border-white/10 hover:bg-white/5"
            >
              Log in
            </button>
          </div>

          <div className="grid max-w-xl grid-cols-3 gap-4 mt-10">
            <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
              <p className="text-xs text-slate-400">Profiles</p>
              <p className="mt-2 text-2xl font-bold">Real</p>
            </div>
            <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
              <p className="text-xs text-slate-400">Messaging</p>
              <p className="mt-2 text-2xl font-bold">Live</p>
            </div>
            <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
              <p className="text-xs text-slate-400">Community</p>
              <p className="mt-2 text-2xl font-bold">Active</p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <h3 className="mb-4 text-2xl font-bold">
            {isLogin ? "Login to FaceGrem" : "Create your FaceGrem account"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block mb-2 text-sm text-slate-300">
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 text-white transition border outline-none rounded-2xl border-white/10 bg-white/10 placeholder:text-slate-400 focus:border-cyan-400/60"
                />
              </div>
            )}

            <div>
              <label className="block mb-2 text-sm text-slate-300">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-white transition border outline-none rounded-2xl border-white/10 bg-white/10 placeholder:text-slate-400 focus:border-cyan-400/60"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm text-slate-300">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-white transition border outline-none rounded-2xl border-white/10 bg-white/10 placeholder:text-slate-400 focus:border-cyan-400/60"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-semibold text-white transition shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 hover:opacity-95 disabled:opacity-70"
            >
              {loading
                ? "Please wait..."
                : isLogin
                ? "Login"
                : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-sm text-center text-slate-300">
            {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin((prev) => !prev)}
              className="font-medium text-cyan-300 underline-offset-4 hover:underline"
            >
              {isLogin ? "Sign up" : "Login"}
            </button>
          </p>
        </section>
      </main>

      <footer className="py-6 text-sm text-center border-t border-white/10 text-slate-400">
        © {new Date().getFullYear()} FaceGrem. All rights reserved.
      </footer>
    </div>
  );
}