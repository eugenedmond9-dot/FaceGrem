"use client";

import Link from "next/link";
import { Language, languages } from "../lib/i18n";

type FooterText = {
  footerMoreLanguages: string;
  footerSignup: string;
  footerLogin: string;
  footerVideo: string;
  footerThreads: string;
  footerPrivacyPolicy: string;
  footerPrivacyCentre: string;
  footerAbout: string;
  footerCreateAd: string;
  footerCreatePage: string;
  footerDevelopers: string;
  footerCareers: string;
  footerCookies: string;
  footerAdChoices: string;
  footerTerms: string;
  footerHelp: string;
  footerContactUploading: string;
};

type AuthFooterProps = {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
  text: FooterText;
};

export default function AuthFooter({
  selectedLanguage,
  onLanguageChange,
  text,
}: AuthFooterProps) {
  return (
    <footer className="relative z-10 px-6 py-8 text-sm border-t border-black/10 bg-white/35 text-slate-500 backdrop-blur-md">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {languages.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => onLanguageChange(language)}
              className={`transition hover:text-[#1877f2] ${
                selectedLanguage === language ? "font-semibold text-[#1877f2]" : ""
              }`}
            >
              {language}
            </button>
          ))}

          <button className="transition hover:text-[#1877f2]" type="button">
            {text.footerMoreLanguages}
          </button>
        </div>

        <div className="flex flex-wrap mt-6 gap-x-4 gap-y-2">
          <Link href="/signup" className="transition hover:text-[#1877f2]">
            {text.footerSignup}
          </Link>
          <Link href="/" className="transition hover:text-[#1877f2]">
            {text.footerLogin}
          </Link>
          <Link href="/videos" className="transition hover:text-[#1877f2]">
            {text.footerVideo}
          </Link>
          <Link href="/threads" className="transition hover:text-[#1877f2]">
            {text.footerThreads}
          </Link>
          <Link href="/privacy" className="transition hover:text-[#1877f2]">
            {text.footerPrivacyPolicy}
          </Link>
          <Link href="/privacy-centre" className="transition hover:text-[#1877f2]">
            {text.footerPrivacyCentre}
          </Link>
          <Link href="/about" className="transition hover:text-[#1877f2]">
            {text.footerAbout}
          </Link>
          <Link href="/create-ad" className="transition hover:text-[#1877f2]">
            {text.footerCreateAd}
          </Link>
          <Link href="/create-page" className="transition hover:text-[#1877f2]">
            {text.footerCreatePage}
          </Link>
          <Link href="/developers" className="transition hover:text-[#1877f2]">
            {text.footerDevelopers}
          </Link>
          <Link href="/careers" className="transition hover:text-[#1877f2]">
            {text.footerCareers}
          </Link>
          <Link href="/cookies" className="transition hover:text-[#1877f2]">
            {text.footerCookies}
          </Link>
          <Link href="/adchoices" className="transition hover:text-[#1877f2]">
            {text.footerAdChoices}
          </Link>
          <Link href="/terms" className="transition hover:text-[#1877f2]">
            {text.footerTerms}
          </Link>
          <Link href="/help" className="transition hover:text-[#1877f2]">
            {text.footerHelp}
          </Link>
          <Link
            href="/contact-uploading-non-users"
            className="transition hover:text-[#1877f2]"
          >
            {text.footerContactUploading}
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-500">FaceGrem © 2026</p>
      </div>
    </footer>
  );
}