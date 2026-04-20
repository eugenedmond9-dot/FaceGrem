"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

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

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

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

  const fullName = useMemo(() => {
    return `${firstName.trim()} ${surname.trim()}`.trim();
  }, [firstName, surname]);

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
      alert("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    const looksLikeEmail = emailOrPhone.includes("@");

    if (!looksLikeEmail) {
      alert("For now, FaceGrem signup supports email. Please enter an email address.");
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

    alert("Account created successfully. Check your email if confirmation is enabled.");
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f2f4f7] text-[#101828]">
      <main className="flex-1 px-5 py-8 sm:px-6">
        <div className="mx-auto max-w-[560px]">
          <div className="mb-5">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-10 h-10 text-3xl transition rounded-full text-slate-500 hover:bg-black/5"
            >
              ‹
            </Link>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877f2] text-sm font-bold text-white">
                F
              </div>
              <span className="text-xl font-semibold text-[#111827]">FaceGrem</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
              Get started on FaceGrem
            </h1>
            <p className="mt-2 text-base leading-7 text-slate-700 sm:text-lg">
              Create an account to connect with friends, family and communities of
              people who share your interests.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-3 block text-xl font-semibold text-[#111827]">
                Name
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full rounded-2xl border border-black/15 bg-white px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
                />
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Surname"
                  className="w-full rounded-2xl border border-black/15 bg-white px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
                />
              </div>
            </div>

            <div>
              <label className="mb-3 block text-xl font-semibold text-[#111827]">
                Date of birth
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <select
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value)}
                  className="w-full rounded-2xl border border-black/15 bg-white px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
                >
                  <option value="">Day</option>
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>

                <select
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value)}
                  className="w-full rounded-2xl border border-black/15 bg-white px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
                >
                  <option value="">Month</option>
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>

                <select
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="w-full rounded-2xl border border-black/15 bg-white px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
                >
                  <option value="">Year</option>
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
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-2xl border border-black/15 bg-white px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
              >
                <option value="">Select your gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Custom">Custom</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="mb-3 block text-xl font-semibold text-[#111827]">
                Mobile number or email address
              </label>
              <input
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="Mobile number or email address"
                className="w-full rounded-2xl border border-black/15 bg-white px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
              />
              <p className="mt-3 text-sm leading-6 text-slate-600">
                You may receive notifications from us. Learn why we ask for your contact
                information.
              </p>
            </div>

            <div>
              <label className="mb-3 block text-xl font-semibold text-[#111827]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-2xl border border-black/15 bg-white px-5 py-4 text-base text-[#111827] outline-none transition focus:border-[#1877f2]"
              />
            </div>

            <div className="space-y-3 text-sm leading-6 text-slate-700">
              <p>
                By tapping Submit, you agree to create an account and to FaceGrem&apos;s
                Terms, Privacy Policy and Cookies Policy.
              </p>
              <p>
                The Privacy Policy describes the ways we can use the information we
                collect when you create an account.
              </p>
            </div>

            <button
              onClick={handleSignup}
              disabled={loadingSignup}
              className="w-full rounded-2xl bg-[#1877f2] py-4 text-lg font-semibold text-white transition hover:bg-[#166fe5] disabled:opacity-70"
            >
              {loadingSignup ? "Creating account..." : "Submit"}
            </button>

            <Link
              href="/"
              className="block w-full rounded-2xl border border-black/15 bg-transparent py-4 text-center text-lg font-semibold text-[#111827] transition hover:bg-black/5"
            >
              I already have an account
            </Link>
          </div>
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
    </div>
  );
}