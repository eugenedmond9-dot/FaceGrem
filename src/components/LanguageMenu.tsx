"use client";

import { useRef, useState } from "react";
import {
  languageLabels,
  supportedLanguages,
  TranslationLanguage,
} from "../lib/language";
import { useLanguage } from "./LanguageProvider";

type LanguageMenuProps = {
  compact?: boolean;
  className?: string;
};

export default function LanguageMenu({
  compact = false,
  className = "",
}: LanguageMenuProps) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleSelect = (nextLanguage: TranslationLanguage) => {
    setLanguage(nextLanguage);
    setOpen(false);
  };

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={
          compact
            ? "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-sm text-slate-200 transition hover:bg-white/[0.06]"
            : "inline-flex h-10 items-center rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
        }
        aria-label={t.language}
        title={t.language}
      >
        🌐 {!compact && <span className="ml-2">{languageLabels[language]}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[90] w-44 rounded-2xl border border-white/[0.08] bg-[#07111f]/95 p-2 shadow-2xl backdrop-blur-2xl">
          {supportedLanguages.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleSelect(item)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                language === item
                  ? "bg-cyan-400/[0.14] text-cyan-100"
                  : "text-white hover:bg-white/[0.06]"
              }`}
            >
              <span>{languageLabels[item]}</span>
              {language === item && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
