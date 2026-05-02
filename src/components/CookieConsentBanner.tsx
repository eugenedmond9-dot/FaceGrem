"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const preferenceStorageKey = "facegrem_cookie_preferences";

type CookiePreferences = {
  essential: boolean;
  performance: boolean;
  personalization: boolean;
  marketing: boolean;
};

function saveCookiePreferences(nextPreferences: CookiePreferences) {
  try {
    window.localStorage.setItem(
      preferenceStorageKey,
      JSON.stringify({
        ...nextPreferences,
        essential: true,
        savedAt: new Date().toISOString(),
      })
    );
  } catch {
    // localStorage may be blocked in some browsers. The banner should still work visually.
  }
}

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // FaceGrem requested this banner to show every time someone opens the website.
    // So we intentionally show it on every fresh page load instead of hiding it forever.
    setIsVisible(true);
  }, []);

  const acceptAll = () => {
    saveCookiePreferences({
      essential: true,
      performance: true,
      personalization: true,
      marketing: true,
    });
    setMessage("Cookie preferences saved.");
    setIsVisible(false);
  };

  const essentialOnly = () => {
    saveCookiePreferences({
      essential: true,
      performance: false,
      personalization: false,
      marketing: false,
    });
    setMessage("Essential cookies only saved.");
    setIsVisible(false);
  };

  const closeForNow = () => {
    // Closes only for the current page view. It will show again next time the site is opened.
    setIsVisible(false);
  };

  if (!isVisible) {
    return message ? (
      <div className="fixed bottom-4 left-1/2 z-[120] -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-2xl">
        {message}
      </div>
    ) : null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[120] px-3 pb-3 sm:px-5 sm:pb-5">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.22)]">
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl">
              🍪
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-950">
                FaceGrem uses cookies
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                We use essential cookies to keep you signed in and protect your account. Optional
                cookies can help improve performance, remember preferences, and make FaceGrem better.
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">Essential</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">Performance</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">Personalization</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">Marketing</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Accept all
            </button>

            <button
              type="button"
              onClick={essentialOnly}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Essential only
            </button>

            <Link
              href="/cookies"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Manage
            </Link>

            <button
              type="button"
              onClick={closeForNow}
              className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
              aria-label="Close cookie notice for now"
            >
              Later
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
