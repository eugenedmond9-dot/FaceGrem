"use client";

import { useState } from "react";
import Link from "next/link";
import LanguageMenu from "../../components/LanguageMenu";
import { useLanguage } from "../../components/LanguageProvider";
import { TranslationLanguage } from "../../lib/language";
import FaceGremLogo from "../../components/FaceGremLogo";
import FaceGremHamburgerMenu from "../../components/FaceGremHamburgerMenu";

const cookiesTranslations: Record<
  TranslationLanguage,
  {
    eyebrow: string;
    title: string;
    updated: string;
    intro: string;
    backHome: string;
    sections: { title: string; body: string }[];
  }
> = {
  en: {
    eyebrow: "FaceGrem privacy",
    title: "Cookies",
    updated: "Last updated: 2026",
    intro:
      "This page explains how FaceGrem may use cookies and similar technologies to keep the platform working smoothly.",
    backHome: "Back home",
    sections: [
      {
        title: "What cookies are",
        body:
          "Cookies are small files stored on your device that help websites remember information about your visit and improve the user experience.",
      },
      {
        title: "How FaceGrem may use cookies",
        body:
          "FaceGrem may use cookies or similar technologies to support sign-in, improve performance, keep sessions active, and understand basic site usage.",
      },
      {
        title: "Managing cookies",
        body:
          "You can manage cookies through your browser settings. Disabling some cookies may affect how parts of FaceGrem work.",
      },
    ],
  },
  sw: {
    eyebrow: "Faragha ya FaceGrem",
    title: "Vidakuzi",
    updated: "Ilisasishwa mwisho: 2026",
    intro:
      "Ukurasa huu unaeleza jinsi FaceGrem inaweza kutumia vidakuzi na teknolojia zinazofanana ili kufanya jukwaa lifanye kazi vizuri.",
    backHome: "Rudi mwanzo",
    sections: [
      {
        title: "Vidakuzi ni nini",
        body:
          "Vidakuzi ni faili ndogo zinazohifadhiwa kwenye kifaa chako ambazo husaidia tovuti kukumbuka taarifa kuhusu ziara yako na kuboresha matumizi.",
      },
      {
        title: "Jinsi FaceGrem inaweza kutumia vidakuzi",
        body:
          "FaceGrem inaweza kutumia vidakuzi au teknolojia zinazofanana kusaidia kuingia kwenye akaunti, kuboresha utendaji, kuweka kipindi kikiwa hai, na kuelewa matumizi ya msingi ya tovuti.",
      },
      {
        title: "Kusimamia vidakuzi",
        body:
          "Unaweza kusimamia vidakuzi kupitia mipangilio ya kivinjari chako. Kuzima baadhi ya vidakuzi kunaweza kuathiri jinsi sehemu fulani za FaceGrem zinavyofanya kazi.",
      },
    ],
  },
  fr: {
    eyebrow: "Confidentialité FaceGrem",
    title: "Cookies",
    updated: "Dernière mise à jour : 2026",
    intro:
      "Cette page explique comment FaceGrem peut utiliser les cookies et technologies similaires pour assurer le bon fonctionnement de la plateforme.",
    backHome: "Retour à l’accueil",
    sections: [
      {
        title: "Ce que sont les cookies",
        body:
          "Les cookies sont de petits fichiers stockés sur votre appareil qui aident les sites web à mémoriser des informations sur votre visite et à améliorer l’expérience utilisateur.",
      },
      {
        title: "Comment FaceGrem peut utiliser les cookies",
        body:
          "FaceGrem peut utiliser des cookies ou des technologies similaires pour prendre en charge la connexion, améliorer les performances, garder les sessions actives et comprendre l’utilisation de base du site.",
      },
      {
        title: "Gérer les cookies",
        body:
          "Vous pouvez gérer les cookies dans les paramètres de votre navigateur. Désactiver certains cookies peut affecter le fonctionnement de certaines parties de FaceGrem.",
      },
    ],
  },
  rw: {
    eyebrow: "Ubwirinzi bwite bwa FaceGrem",
    title: "Cookies",
    updated: "Byavuguruwe bwa nyuma: 2026",
    intro:
      "Uru rupapuro rusobanura uko FaceGrem ishobora gukoresha cookies n’ikoranabuhanga risa na zo kugira ngo urubuga rukore neza.",
    backHome: "Subira ahabanza",
    sections: [
      {
        title: "Cookies ni iki",
        body:
          "Cookies ni dosiye nto zibikwa ku gikoresho cyawe zifasha imbuga kwibuka amakuru ajyanye n’uruzinduko rwawe no kunoza uko ukoresha urubuga.",
      },
      {
        title: "Uko FaceGrem ishobora gukoresha cookies",
        body:
          "FaceGrem ishobora gukoresha cookies cyangwa ikoranabuhanga risa na zo mu gufasha kwinjira, kunoza imikorere, kugumisha sessions zikora, no gusobanukirwa imikoreshereze y’ibanze y’urubuga.",
      },
      {
        title: "Gucunga cookies",
        body:
          "Ushobora gucunga cookies ukoresheje igenamiterere rya browser yawe. Kuzimya zimwe muri zo bishobora kugira ingaruka ku mikorere y’ibice bimwe bya FaceGrem.",
      },
    ],
  },
};

export default function CookiesPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { language } = useLanguage();
  const pageText = cookiesTranslations[language];

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      
      
      <FaceGremHamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onLogout={undefined}
      />

<button
        type="button"
        onClick={() => setIsMenuOpen(true)}
        className="fixed right-4 top-4 z-[75] flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl text-slate-800 shadow-lg ring-1 ring-black/10 transition hover:bg-slate-100"
        aria-label="Open menu"
      >
        ≡
      </button>

<div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_28%),linear-gradient(to_bottom,#020817,#07111f_45%,#020817)]" />
        <div className="absolute left-0 top-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#020817]/55 backdrop-blur-3xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <FaceGremLogo
              href=""
              showWordmark={false}
              markClassName="h-10 w-10 rounded-2xl ring-0 shadow-sm"
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">FaceGrem</h1>
              <p className="text-xs text-slate-400">{pageText.eyebrow}</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageMenu compact />
            <Link
              href="/"
              className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
            >
              {pageText.backHome}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="overflow-hidden rounded-[34px] border border-white/[0.07] bg-white/[0.035] shadow-[0_25px_90px_rgba(2,8,23,0.35)] backdrop-blur-2xl">
          <div className="border-b border-white/[0.07] bg-[linear-gradient(135deg,rgba(8,47,73,0.80),rgba(15,23,42,0.90)_55%,rgba(30,41,59,0.90))] p-6 sm:p-8">
            <Link
              href="/"
              className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-2xl text-slate-200 transition hover:bg-white/[0.06]"
              aria-label={pageText.backHome}
            >
              ‹
            </Link>

            <p className="text-sm font-semibold text-cyan-200">{pageText.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-5xl">
              {pageText.title}
            </h2>
            <p className="mt-3 text-sm text-slate-400">{pageText.updated}</p>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">
              {pageText.intro}
            </p>
          </div>

          <div className="space-y-4 p-5 sm:p-8">
            {pageText.sections.map((section) => (
              <section
                key={section.title}
                className="rounded-[26px] border border-white/[0.07] bg-white/[0.035] p-5 transition hover:bg-white/[0.05]"
              >
                <h3 className="text-lg font-semibold text-white sm:text-xl">
                  {section.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
