"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FaceGremLogo from "../../components/FaceGremLogo";
import FaceGremHamburgerMenu from "../../components/FaceGremHamburgerMenu";
import LanguageMenu from "../../components/LanguageMenu";

type CookiePreferenceKey = "essential" | "performance" | "personalization" | "marketing";

type CookiePreference = {
  key: CookiePreferenceKey;
  title: string;
  description: string;
  required?: boolean;
};

const cookiePreferences: CookiePreference[] = [
  {
    key: "essential",
    title: "Essential cookies",
    description:
      "Required for sign-in, account security, session protection, page navigation, and basic FaceGrem features. These cannot be turned off.",
    required: true,
  },
  {
    key: "performance",
    title: "Performance cookies",
    description:
      "Help us understand which pages load well, where errors happen, and how to improve speed and reliability.",
  },
  {
    key: "personalization",
    title: "Personalization cookies",
    description:
      "Help remember choices like language, display preferences, and other settings that make FaceGrem feel more personal.",
  },
  {
    key: "marketing",
    title: "Marketing and measurement cookies",
    description:
      "May help measure campaigns, understand discovery, and improve how FaceGrem reaches people. These are optional.",
  },
];

const cookieUses = [
  {
    title: "Keeping you signed in",
    body:
      "Cookies can help FaceGrem remember that you are logged in securely, so you do not have to sign in again on every page.",
  },
  {
    title: "Protecting your account",
    body:
      "Some cookies and similar technologies help detect suspicious activity, protect sessions, and keep your account safer.",
  },
  {
    title: "Remembering preferences",
    body:
      "FaceGrem may remember settings such as language, layout choices, and saved preferences to make the site easier to use.",
  },
  {
    title: "Improving performance",
    body:
      "We may use privacy-respecting analytics to understand loading speed, errors, and how to improve the product experience.",
  },
];

const preferenceStorageKey = "facegrem_cookie_preferences";

function defaultPreferences() {
  return {
    essential: true,
    performance: false,
    personalization: true,
    marketing: false,
  };
}

export default function CookiesPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [preferences, setPreferences] = useState<Record<CookiePreferenceKey, boolean>>(
    defaultPreferences
  );
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    try {
      const savedPreferences = window.localStorage.getItem(preferenceStorageKey);

      if (savedPreferences) {
        setPreferences({
          ...defaultPreferences(),
          ...JSON.parse(savedPreferences),
          essential: true,
        });
      }
    } catch {
      setPreferences(defaultPreferences());
    }
  }, []);

  const optionalEnabledCount = useMemo(() => {
    return Object.entries(preferences).filter(([key, value]) => {
      return key !== "essential" && value;
    }).length;
  }, [preferences]);

  const handleToggle = (key: CookiePreferenceKey) => {
    if (key === "essential") return;

    setPreferences((current) => ({
      ...current,
      [key]: !current[key],
      essential: true,
    }));
    setSaveMessage("");
  };

  const savePreferences = (nextPreferences = preferences) => {
    const safePreferences = {
      ...nextPreferences,
      essential: true,
    };

    window.localStorage.setItem(preferenceStorageKey, JSON.stringify(safePreferences));
    setPreferences(safePreferences);
    setSaveMessage("Your cookie preferences have been saved.");
  };

  const acceptAll = () => {
    savePreferences({
      essential: true,
      performance: true,
      personalization: true,
      marketing: true,
    });
  };

  const rejectOptional = () => {
    savePreferences({
      essential: true,
      performance: false,
      personalization: false,
      marketing: false,
    });
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-[#050505]">
      <FaceGremHamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
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
              <h1 className="text-lg font-bold tracking-tight text-slate-950">FaceGrem</h1>
              <p className="text-xs text-slate-500">Cookie preferences</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageMenu compact />
            <Link
              href="/feed"
              className="hidden rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:inline-flex"
            >
              Back to Feed
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/feed"
          className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
          aria-label="Back to feed"
        >
          ‹
        </Link>

        <section className="overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-6 border-b border-slate-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                Privacy & Cookies
              </p>
              <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Your cookie choices should be clear, simple, and easy to control.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
                FaceGrem uses cookies and similar technologies to keep the website secure, remember
                your preferences, improve performance, and support a smoother social experience.
                This page gives you a clear view of what cookies may be used and lets you manage
                optional choices.
              </p>
              <p className="mt-4 text-sm text-slate-500">Last updated: 2026</p>
            </div>

            <aside className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-950">Current preference summary</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Essential cookies are always active. You currently have{" "}
                <span className="font-bold text-blue-600">{optionalEnabledCount}</span> optional
                cookie category{optionalEnabledCount === 1 ? "" : "ies"} enabled.
              </p>
              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={acceptAll}
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Accept all cookies
                </button>
                <button
                  type="button"
                  onClick={rejectOptional}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Reject optional cookies
                </button>
              </div>
              {saveMessage ? (
                <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {saveMessage}
                </p>
              ) : null}
            </aside>
          </div>

          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="space-y-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
                  Manage cookies
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  Choose how FaceGrem can use optional cookies.
                </h3>
              </div>

              {cookiePreferences.map((item) => (
                <article
                  key={item.key}
                  className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-950">{item.title}</h4>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {item.description}
                      </p>
                      {item.required ? (
                        <p className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          Always active
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggle(item.key)}
                      disabled={item.required}
                      className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                        preferences[item.key]
                          ? "bg-blue-600"
                          : "bg-slate-300"
                      } ${item.required ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                      aria-label={`Toggle ${item.title}`}
                    >
                      <span
                        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${
                          preferences[item.key] ? "left-7" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </article>
              ))}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => savePreferences()}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Save my choices
                </button>
                <Link
                  href="/privacy"
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Read Privacy Policy
                </Link>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-[28px] bg-slate-50 p-5 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-950">Important note</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  These controls store your preference locally in your browser. Essential cookies
                  remain active because they are needed for account access, safety, and basic site
                  functionality.
                </p>
              </div>

              <div className="rounded-[28px] bg-blue-50 p-5 ring-1 ring-blue-100">
                <p className="text-sm font-semibold text-blue-700">Need help?</p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  You can also manage or delete cookies in your browser settings. If you block all
                  cookies, sign-in and some FaceGrem features may stop working correctly.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cookieUses.map((item) => (
            <article
              key={item.title}
              className="rounded-[26px] bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                ✓
              </div>
              <h3 className="font-bold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h3 className="text-2xl font-bold tracking-tight text-slate-950">
            More about similar technologies
          </h3>
          <div className="mt-4 grid gap-4 text-sm leading-7 text-slate-600 lg:grid-cols-2">
            <p>
              Cookies are not the only technology websites may use. FaceGrem may also use local
              storage, session storage, device identifiers, pixels, or server logs for similar
              purposes such as keeping sessions active, remembering preferences, and improving
              reliability.
            </p>
            <p>
              We aim to keep these technologies understandable and respectful. As FaceGrem grows,
              this page can be updated to include more detailed controls for analytics, advertising,
              and personalization choices.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
