"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../components/LanguageProvider";
import { supabase } from "../../lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_28%),linear-gradient(to_bottom,#020817,#07111f_45%,#020817)]" />
        <div className="absolute left-0 top-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#020817]/55 backdrop-blur-3xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/feed" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/10 bg-[linear-gradient(145deg,rgba(10,18,34,0.95),rgba(8,15,28,0.75))] font-bold text-cyan-100 shadow-[0_10px_30px_rgba(34,211,238,0.08)]">
              F
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">FaceGrem</h1>
              <p className="text-xs text-slate-400">{t.settings}</p>
            </div>
          </Link>

          <Link
            href="/feed"
            className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
          >
            {t.homeFeed}
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="overflow-hidden rounded-[34px] border border-white/[0.07] bg-white/[0.035] shadow-[0_25px_90px_rgba(2,8,23,0.35)] backdrop-blur-2xl">
          <div className="border-b border-white/[0.07] bg-[linear-gradient(135deg,rgba(8,47,73,0.80),rgba(15,23,42,0.90)_55%,rgba(30,41,59,0.90))] p-6 sm:p-8">
            <Link
              href="/feed"
              className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-2xl text-slate-200 transition hover:bg-white/[0.06]"
              aria-label={t.homeFeed}
            >
              ‹
            </Link>

            <p className="text-sm font-semibold text-cyan-200">FaceGrem</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-5xl">
              {t.settings}
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">
              Manage your FaceGrem account, privacy, language, notifications, and quick links.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:p-8 lg:grid-cols-2">
            <Link
              href="/profile"
              className="rounded-[28px] border border-white/[0.07] bg-white/[0.035] p-5 transition hover:bg-white/[0.05]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-xl">👤</div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{t.profile}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Update your public profile, photo, name, username, and bio.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/privacy-centre"
              className="rounded-[28px] border border-white/[0.07] bg-white/[0.035] p-5 transition hover:bg-white/[0.05]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-xl">🔒</div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{t.privacy}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Review privacy information and user controls.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/notifications"
              className="rounded-[28px] border border-white/[0.07] bg-white/[0.035] p-5 transition hover:bg-white/[0.05]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-xl">🔔</div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{t.notifications}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Open your notification centre.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/saved"
              className="rounded-[28px] border border-white/[0.07] bg-white/[0.035] p-5 transition hover:bg-white/[0.05]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-xl">🔖</div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{t.savedPosts}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    View your saved posts and collection.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/terms"
              className="rounded-[28px] border border-white/[0.07] bg-white/[0.035] p-5 transition hover:bg-white/[0.05]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-xl">📄</div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Terms</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Read FaceGrem terms and platform rules.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/cookies"
              className="rounded-[28px] border border-white/[0.07] bg-white/[0.035] p-5 transition hover:bg-white/[0.05]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-xl">🍪</div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Cookies</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Learn how cookies may be used on FaceGrem.
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div className="border-t border-white/[0.07] p-5 sm:p-8">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-2xl border border-red-300/10 bg-red-400/[0.07] px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-400/[0.11]"
            >
              ↩️ {t.logout}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
