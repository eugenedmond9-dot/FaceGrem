"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { TranslateLanguageIcon } from "./FaceGremCustomIcons";

type TranslationLanguage = "en" | "sw" | "fr" | "rw";

type LanguageMenuProps = {
  compact?: boolean;
  className?: string;
};

const languageLabels: Record<TranslationLanguage, string> = {
  en: "English",
  sw: "Swahili",
  fr: "French",
  rw: "Kinyarwanda",
};

export default function LanguageMenu({ compact = false, className = "" }: LanguageMenuProps) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={compact
          ? "inline-flex h-10 items-center gap-2 rounded-full bg-slate-100 px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-200 hover:text-slate-900"
          : "inline-flex h-10 items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
        }
        aria-label={t.language || "Language"}
        title={t.language || "Language"}
      >
        <TranslateLanguageIcon className="h-4 w-4" />
        <span className={compact ? "hidden sm:inline" : "inline"}>{languageLabels[language as TranslationLanguage]}</span>
      </button>

      {open && (
        <div className={compact
          ? "absolute right-0 top-12 z-[90] w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
          : "absolute right-0 top-12 z-[90] w-44 rounded-2xl border border-white/[0.08] bg-[#07111f]/95 p-2 shadow-2xl backdrop-blur-2xl"
        }>
          {(["en", "sw", "fr", "rw"] as TranslationLanguage[]).map((nextLanguage) => (
            <button
              key={nextLanguage}
              type="button"
              onClick={() => {
                setLanguage(nextLanguage);
                setOpen(false);
              }}
              className={compact
                ? `flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${language === nextLanguage ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"}`
                : `flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${language === nextLanguage ? "bg-cyan-400/[0.14] text-cyan-100" : "text-white hover:bg-white/[0.06]"}`
              }
            >
              <span>{languageLabels[nextLanguage]}</span>
              {language === nextLanguage ? <span>✓</span> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
