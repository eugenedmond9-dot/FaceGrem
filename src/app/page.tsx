"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import {
  Language,
  getLandingTranslations,
  getSavedLanguage,
  saveLanguage,
} from "../lib/i18n";
import AuthBackground from "../components/AuthBackground";
import AuthFooter from "../components/AuthFooter";

export default function LandingPage() {
  const router = useRouter();

  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [selectedLanguage, setSelectedLanguage] =
    useState<Language>("English (UK)");

  useEffect(() => {
    setSelectedLanguage(getSavedLanguage());
  }, []);

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

  const t = useMemo(
    () => getLandingTranslations(selectedLanguage),
    [selectedLanguage]
  );

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    saveLanguage(language);
    alert(getLandingTranslations(language).languageChanged);
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      alert(t.loginValidation);
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
      <AuthBackground />

      <main className="relative z-10 flex-1 px-5 py-8 sm:px-6">
        <div className="mx-auto grid min-h-[78vh] max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <section className="flex items-center">
            <div className="max-w-[560px]">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#1877f2] text-4xl font-bold text-white shadow-lg shadow-blue-500/20">
                F
              </div>

              <div className="inline-flex px-4 py-2 text-sm font-medium border rounded-full border-cyan-400/30 bg-white/50 text-cyan-700 backdrop-blur-md">
                {t.welcome}
              </div>

              <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight text-[#111827] sm:text-5xl lg:text-6xl">
                {t.hero}
              </h1>
            </div>
          </section>

          <section className="flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-[560px]">
              <div className="rounded-[28px] border border-white/60 bg-white/55 p-6 shadow-[0_20px_80px_rgba(24,119,242,0.08)] backdrop-blur-xl sm:p-8">
                <h2 className="mb-8 text-3xl font-bold tracking-tight text-[#111827]">
                  {t.loginTitle}
                </h2>

                <div className="space-y-5">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="w-full rounded-2xl border border-black/10 bg-white/90 px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
                  />

                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full rounded-2xl border border-black/10 bg-white/90 px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
                  />

                  <button
                    onClick={handleLogin}
                    disabled={loadingLogin}
                    className="w-full rounded-2xl bg-[#1877f2] py-4 text-lg font-semibold text-white transition hover:bg-[#166fe5] disabled:opacity-70"
                  >
                    {loadingLogin ? t.loggingIn : t.loginButton}
                  </button>

                  <button
                    type="button"
                    onClick={() => alert(t.forgotPasswordAlert)}
                    className="block w-full text-center text-lg font-medium text-[#111827] transition hover:text-[#1877f2]"
                  >
                    {t.forgotPassword}
                  </button>

                  <div className="pt-8">
                    <Link
                      href="/signup"
                      className="block w-full rounded-2xl border border-[#1877f2] bg-transparent py-4 text-center text-lg font-semibold text-[#1877f2] transition hover:bg-[#1877f2]/5"
                    >
                      {t.createAccount}
                    </Link>
                  </div>

                  <p className="pt-3 text-center text-xl font-semibold text-[#111827]">
                    {t.brandName}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <AuthFooter
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
        text={t}
      />
    </div>
  );
}