"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import {
  Language,
  getSavedLanguage,
  getSignupTranslations,
  saveLanguage,
} from "../../lib/i18n";
import AuthBackground from "../../components/AuthBackground";
import AuthFooter from "../../components/AuthFooter";

const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

export default function SignupPage() {
  const router = useRouter();

  const [loadingSignup, setLoadingSignup] = useState(false);
  const [selectedLanguage, setSelectedLanguage] =
    useState<Language>("English (UK)");

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

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
    () => getSignupTranslations(selectedLanguage),
    [selectedLanguage]
  );

  const fullName = useMemo(() => {
    return `${firstName.trim()} ${surname.trim()}`.trim();
  }, [firstName, surname]);

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    saveLanguage(language);
    alert(getSignupTranslations(language).languageChanged);
  };

  const handleSignup = async () => {
    if (
      !firstName.trim() ||
      !surname.trim() ||
      !birthDay ||
      !birthMonth ||
      !birthYear ||
      !gender ||
      !emailOrPhone.trim() ||
      !password.trim()
    ) {
      alert(t.fillAllFields);
      return;
    }

    if (password.length < 6) {
      alert(t.passwordTooShort);
      return;
    }

    const looksLikeEmail = emailOrPhone.includes("@");

    if (!looksLikeEmail) {
      alert(t.emailOnly);
      return;
    }

    setLoadingSignup(true);

    const { error } = await supabase.auth.signUp({
      email: emailOrPhone.trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: firstName.trim(),
          surname: surname.trim(),
          birth_day: birthDay,
          birth_month: birthMonth,
          birth_year: birthYear,
          gender,
        },
      },
    });

    setLoadingSignup(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(t.signupSuccess);
    router.push("/");
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f2f4f7] text-[#101828]">
      <AuthBackground />

      <main className="relative z-10 flex-1 px-5 py-8 sm:px-6">
        <div className="mx-auto max-w-[560px]">
          <div className="mb-5">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-10 h-10 text-3xl transition rounded-full text-slate-500 hover:bg-black/5"
            >
              {t.back}
            </Link>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877f2] text-sm font-bold text-white shadow-md shadow-blue-500/20">
                F
              </div>
              <span className="text-xl font-semibold text-[#111827]">
                {t.brandName}
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
              {t.pageTitle}
            </h1>
            <p className="mt-2 text-base leading-7 text-slate-700 sm:text-lg">
              {t.pageSubtitle}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/60 bg-white/55 p-5 shadow-[0_20px_80px_rgba(24,119,242,0.08)] backdrop-blur-xl sm:p-6">
            <div className="space-y-5">
              <div>
                <label className="mb-3 block text-xl font-semibold text-[#111827]">
                  {t.name}
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t.firstName}
                    className="w-full rounded-2xl border border-black/10 bg-white/90 px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
                  />
                  <input
                    type="text"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder={t.surname}
                    className="w-full rounded-2xl border border-black/10 bg-white/90 px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-xl font-semibold text-[#111827]">
                  {t.dateOfBirth}
                </label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-white/90 px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
                  >
                    <option value="">{t.day}</option>
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>

                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-white/90 px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
                  >
                    <option value="">{t.month}</option>
                    {months.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>

                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-white/90 px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
                  >
                    <option value="">{t.year}</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-xl font-semibold text-[#111827]">
                  {t.gender}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white/90 px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
                >
                  <option value="">{t.selectGender}</option>
                  <option value="Female">{t.female}</option>
                  <option value="Male">{t.male}</option>
                  <option value="Custom">{t.custom}</option>
                  <option value="Prefer not to say">{t.preferNotToSay}</option>
                </select>
              </div>

              <div>
                <label className="mb-3 block text-xl font-semibold text-[#111827]">
                  {t.emailOrPhone}
                </label>
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder={t.emailOrPhonePlaceholder}
                  className="w-full rounded-2xl border border-black/10 bg-white/90 px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
                />
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {t.contactInfoHelp}
                </p>
              </div>

              <div>
                <label className="mb-3 block text-xl font-semibold text-[#111827]">
                  {t.password}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full rounded-2xl border border-black/10 bg-white/90 px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
                />
              </div>

              <div className="space-y-3 text-sm leading-6 text-slate-700">
                <p>{t.termsTextOne}</p>
                <p>{t.termsTextTwo}</p>
              </div>

              <button
                onClick={handleSignup}
                disabled={loadingSignup}
                className="w-full rounded-2xl bg-[#1877f2] py-4 text-lg font-semibold text-white transition hover:bg-[#166fe5] disabled:opacity-70"
              >
                {loadingSignup ? t.creatingAccount : t.submit}
              </button>

              <Link
                href="/"
                className="block w-full rounded-2xl border border-black/10 bg-transparent py-4 text-center text-lg font-semibold text-[#111827] transition hover:bg-black/5"
              >
                {t.alreadyHaveAccount}
              </Link>
            </div>
          </div>
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