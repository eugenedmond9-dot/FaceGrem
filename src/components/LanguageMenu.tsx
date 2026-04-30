"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TranslateLanguageIcon } from "./FaceGremCustomIcons";

type LanguageMenuProps = {
  compact?: boolean;
  className?: string;
};

type LanguageOption = {
  code: string;
  name: string;
  nativeName: string;
};

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement?: new (
          options: {
            pageLanguage: string;
            includedLanguages?: string;
            autoDisplay?: boolean;
            layout?: unknown;
          },
          elementId: string
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

const languages: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans" },
  { code: "sq", name: "Albanian", nativeName: "Shqip" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "hy", name: "Armenian", nativeName: "Հայերեն" },
  { code: "az", name: "Azerbaijani", nativeName: "Azərbaycanca" },
  { code: "eu", name: "Basque", nativeName: "Euskara" },
  { code: "be", name: "Belarusian", nativeName: "Беларуская" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "bs", name: "Bosnian", nativeName: "Bosanski" },
  { code: "bg", name: "Bulgarian", nativeName: "Български" },
  { code: "ca", name: "Catalan", nativeName: "Català" },
  { code: "ceb", name: "Cebuano", nativeName: "Cebuano" },
  { code: "zh-CN", name: "Chinese Simplified", nativeName: "简体中文" },
  { code: "zh-TW", name: "Chinese Traditional", nativeName: "繁體中文" },
  { code: "co", name: "Corsican", nativeName: "Corsu" },
  { code: "hr", name: "Croatian", nativeName: "Hrvatski" },
  { code: "cs", name: "Czech", nativeName: "Čeština" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "eo", name: "Esperanto", nativeName: "Esperanto" },
  { code: "et", name: "Estonian", nativeName: "Eesti" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "fy", name: "Frisian", nativeName: "Frysk" },
  { code: "gl", name: "Galician", nativeName: "Galego" },
  { code: "ka", name: "Georgian", nativeName: "ქართული" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "ht", name: "Haitian Creole", nativeName: "Kreyòl ayisyen" },
  { code: "ha", name: "Hausa", nativeName: "Hausa" },
  { code: "haw", name: "Hawaiian", nativeName: "ʻŌlelo Hawaiʻi" },
  { code: "he", name: "Hebrew", nativeName: "עברית" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "hmn", name: "Hmong", nativeName: "Hmong" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar" },
  { code: "is", name: "Icelandic", nativeName: "Íslenska" },
  { code: "ig", name: "Igbo", nativeName: "Igbo" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "ga", name: "Irish", nativeName: "Gaeilge" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "jv", name: "Javanese", nativeName: "Basa Jawa" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "kk", name: "Kazakh", nativeName: "Қазақ" },
  { code: "km", name: "Khmer", nativeName: "ខ្មែរ" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "ku", name: "Kurdish", nativeName: "Kurdî" },
  { code: "ky", name: "Kyrgyz", nativeName: "Кыргызча" },
  { code: "lo", name: "Lao", nativeName: "ລາວ" },
  { code: "la", name: "Latin", nativeName: "Latina" },
  { code: "lv", name: "Latvian", nativeName: "Latviešu" },
  { code: "lt", name: "Lithuanian", nativeName: "Lietuvių" },
  { code: "lb", name: "Luxembourgish", nativeName: "Lëtzebuergesch" },
  { code: "mk", name: "Macedonian", nativeName: "Македонски" },
  { code: "mg", name: "Malagasy", nativeName: "Malagasy" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "mt", name: "Maltese", nativeName: "Malti" },
  { code: "mi", name: "Maori", nativeName: "Māori" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "mn", name: "Mongolian", nativeName: "Монгол" },
  { code: "my", name: "Myanmar", nativeName: "မြန်မာ" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "ny", name: "Nyanja", nativeName: "Chichewa" },
  { code: "ps", name: "Pashto", nativeName: "پښتو" },
  { code: "fa", name: "Persian", nativeName: "فارسی" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "ro", name: "Romanian", nativeName: "Română" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "sm", name: "Samoan", nativeName: "Gagana Samoa" },
  { code: "gd", name: "Scots Gaelic", nativeName: "Gàidhlig" },
  { code: "sr", name: "Serbian", nativeName: "Српски" },
  { code: "st", name: "Sesotho", nativeName: "Sesotho" },
  { code: "sn", name: "Shona", nativeName: "Shona" },
  { code: "sd", name: "Sindhi", nativeName: "سنڌي" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල" },
  { code: "sk", name: "Slovak", nativeName: "Slovenčina" },
  { code: "sl", name: "Slovenian", nativeName: "Slovenščina" },
  { code: "so", name: "Somali", nativeName: "Soomaali" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "su", name: "Sundanese", nativeName: "Basa Sunda" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "tl", name: "Tagalog", nativeName: "Tagalog" },
  { code: "tg", name: "Tajik", nativeName: "Тоҷикӣ" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "uz", name: "Uzbek", nativeName: "O‘zbek" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "cy", name: "Welsh", nativeName: "Cymraeg" },
  { code: "xh", name: "Xhosa", nativeName: "isiXhosa" },
  { code: "yi", name: "Yiddish", nativeName: "ייִדיש" },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá" },
  { code: "zu", name: "Zulu", nativeName: "isiZulu" },
];

const includedLanguages = languages.map((language) => language.code).join(",");

function setGoogleTranslateCookie(languageCode: string) {
  const value = languageCode === "en" ? "" : `/auto/${languageCode}`;
  const maxAge = languageCode === "en" ? "0" : String(60 * 60 * 24 * 365);
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";

  document.cookie = `googtrans=${value}; path=/; max-age=${maxAge}`;
  document.cookie = `googtrans=${value}; path=/; domain=${hostname}; max-age=${maxAge}`;

  if (hostname.includes(".")) {
    const rootDomain = `.${hostname.split(".").slice(-2).join(".")}`;
    document.cookie = `googtrans=${value}; path=/; domain=${rootDomain}; max-age=${maxAge}`;
  }
}

function triggerGoogleTranslate(languageCode: string) {
  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");

  if (select) {
    select.value = languageCode;
    select.dispatchEvent(new Event("change"));
    return true;
  }

  return false;
}

export default function LanguageMenu({ compact = false, className = "" }: LanguageMenuProps) {
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = languages.find((language) => language.code === selectedLanguage) || languages[0];

  const filteredLanguages = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) return languages;

    return languages.filter((language) => {
      return (
        language.name.toLowerCase().includes(term) ||
        language.nativeName.toLowerCase().includes(term) ||
        language.code.toLowerCase().includes(term)
      );
    });
  }, [query]);

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("facegrem_global_language") || "en";
    setSelectedLanguage(savedLanguage);

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;

      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages,
          autoDisplay: false,
        },
        "facegrem-google-translate"
      );

      window.setTimeout(() => {
        if (savedLanguage !== "en") {
          triggerGoogleTranslate(savedLanguage);
        }
      }, 700);
    };

    if (!document.querySelector('script[data-facegrem-google-translate="true"]')) {
      const script = document.createElement("script");
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.setAttribute("data-facegrem-google-translate", "true");
      document.body.appendChild(script);
    } else if (window.googleTranslateElementInit) {
      window.googleTranslateElementInit();
    }
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelectLanguage = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    window.localStorage.setItem("facegrem_global_language", languageCode);
    setGoogleTranslateCookie(languageCode);

    const translatedNow = languageCode === "en" || triggerGoogleTranslate(languageCode);

    setOpen(false);

    if (!translatedNow || languageCode === "en") {
      window.location.reload();
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div id="facegrem-google-translate" className="hidden" />

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={
          compact
            ? "inline-flex h-10 items-center gap-2 rounded-full bg-slate-100 px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-200 hover:text-slate-900"
            : "inline-flex h-10 items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
        }
        aria-label="Translate FaceGrem"
        title="Translate FaceGrem"
      >
        <TranslateLanguageIcon className="h-4 w-4" />
        <span className={compact ? "hidden sm:inline" : "inline"}>
          {selected.nativeName}
        </span>
      </button>

      {open && (
        <div
          className={
            compact
              ? "absolute right-0 top-12 z-[100] w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
              : "absolute right-0 top-12 z-[100] w-72 rounded-2xl border border-white/[0.08] bg-[#07111f]/95 p-2 shadow-2xl backdrop-blur-2xl"
          }
        >
          <div className="p-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search language..."
              className={
                compact
                  ? "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400"
                  : "w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400 focus:border-cyan-300/40"
              }
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-1">
            {filteredLanguages.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => handleSelectLanguage(language.code)}
                className={
                  compact
                    ? `flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                        selectedLanguage === language.code
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-700 hover:bg-slate-100"
                      }`
                    : `flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                        selectedLanguage === language.code
                          ? "bg-cyan-400/[0.14] text-cyan-100"
                          : "text-white hover:bg-white/[0.06]"
                      }`
                }
              >
                <span>
                  <span className="font-medium">{language.nativeName}</span>
                  <span className={compact ? "ml-2 text-xs text-slate-500" : "ml-2 text-xs text-slate-400"}>
                    {language.name}
                  </span>
                </span>
                {selectedLanguage === language.code ? <span>✓</span> : null}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
