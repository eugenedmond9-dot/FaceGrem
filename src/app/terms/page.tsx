"use client";

import { useState } from "react";
import Link from "next/link";
import LanguageMenu from "../../components/LanguageMenu";
import { useLanguage } from "../../components/LanguageProvider";
import { TranslationLanguage } from "../../lib/language";
import FaceGremLogo from "../../components/FaceGremLogo";
import FaceGremHamburgerMenu from "../../components/FaceGremHamburgerMenu";

const termsTranslations: Record<
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
    eyebrow: "FaceGrem legal",
    title: "Terms",
    updated: "Last updated: 2026",
    intro:
      "These terms explain the basic rules for using FaceGrem safely, respectfully, and responsibly.",
    backHome: "Back home",
    sections: [
      {
        title: "1. Using FaceGrem",
        body:
          "By creating an account or using FaceGrem, you agree to use the platform responsibly and lawfully.",
      },
      {
        title: "2. Your account",
        body:
          "You are responsible for maintaining the security of your account and the accuracy of the information you provide.",
      },
      {
        title: "3. Your content",
        body:
          "You are responsible for the content you post, upload, or send through FaceGrem. Content must not violate laws or harm other users.",
      },
      {
        title: "4. Platform changes",
        body:
          "FaceGrem may update features, policies, and services over time to improve the platform and maintain safety.",
      },
      {
        title: "5. Account limitations",
        body:
          "We may suspend or remove accounts or content that violate platform rules or threaten the safety and integrity of the service.",
      },
    ],
  },
  sw: {
    eyebrow: "Sheria za FaceGrem",
    title: "Masharti",
    updated: "Ilisasishwa mwisho: 2026",
    intro:
      "Masharti haya yanaeleza kanuni za msingi za kutumia FaceGrem kwa usalama, heshima, na uwajibikaji.",
    backHome: "Rudi mwanzo",
    sections: [
      {
        title: "1. Kutumia FaceGrem",
        body:
          "Kwa kufungua akaunti au kutumia FaceGrem, unakubali kutumia jukwaa hili kwa uwajibikaji na kwa kufuata sheria.",
      },
      {
        title: "2. Akaunti yako",
        body:
          "Unawajibika kulinda akaunti yako na kuhakikisha taarifa unazotoa ni sahihi.",
      },
      {
        title: "3. Maudhui yako",
        body:
          "Unawajibika kwa maudhui unayochapisha, kupakia, au kutuma kupitia FaceGrem. Maudhui hayapaswi kuvunja sheria au kuwadhuru watumiaji wengine.",
      },
      {
        title: "4. Mabadiliko ya jukwaa",
        body:
          "FaceGrem inaweza kuboresha vipengele, sera, na huduma zake kadri muda unavyokwenda ili kuboresha jukwaa na kulinda usalama.",
      },
      {
        title: "5. Vizuizi vya akaunti",
        body:
          "Tunaweza kusimamisha au kuondoa akaunti au maudhui yanayovunja kanuni za jukwaa au kutishia usalama na uadilifu wa huduma.",
      },
    ],
  },
  fr: {
    eyebrow: "Informations légales FaceGrem",
    title: "Conditions",
    updated: "Dernière mise à jour : 2026",
    intro:
      "Ces conditions expliquent les règles de base pour utiliser FaceGrem de manière sûre, respectueuse et responsable.",
    backHome: "Retour à l’accueil",
    sections: [
      {
        title: "1. Utiliser FaceGrem",
        body:
          "En créant un compte ou en utilisant FaceGrem, vous acceptez d’utiliser la plateforme de manière responsable et légale.",
      },
      {
        title: "2. Votre compte",
        body:
          "Vous êtes responsable de la sécurité de votre compte et de l’exactitude des informations que vous fournissez.",
      },
      {
        title: "3. Votre contenu",
        body:
          "Vous êtes responsable du contenu que vous publiez, téléversez ou envoyez via FaceGrem. Le contenu ne doit pas violer les lois ni nuire aux autres utilisateurs.",
      },
      {
        title: "4. Changements de la plateforme",
        body:
          "FaceGrem peut mettre à jour ses fonctionnalités, politiques et services au fil du temps afin d’améliorer la plateforme et de maintenir la sécurité.",
      },
      {
        title: "5. Limitations du compte",
        body:
          "Nous pouvons suspendre ou supprimer les comptes ou contenus qui enfreignent les règles de la plateforme ou menacent la sécurité et l’intégrité du service.",
      },
    ],
  },
  rw: {
    eyebrow: "Amategeko ya FaceGrem",
    title: "Amabwiriza",
    updated: "Byavuguruwe bwa nyuma: 2026",
    intro:
      "Aya mabwiriza asobanura amategeko y’ibanze yo gukoresha FaceGrem mu mutekano, mu cyubahiro, no mu nshingano.",
    backHome: "Subira ahabanza",
    sections: [
      {
        title: "1. Gukoresha FaceGrem",
        body:
          "Iyo ufunguye konti cyangwa ukoresheje FaceGrem, wemera gukoresha uru rubuga mu buryo bufite inshingano kandi bukurikiza amategeko.",
      },
      {
        title: "2. Konti yawe",
        body:
          "Ufite inshingano zo kurinda umutekano wa konti yawe no gutanga amakuru nyayo.",
      },
      {
        title: "3. Ibyo ushyiraho",
        body:
          "Ufite inshingano ku byo wandika, wohereza, cyangwa usangiza kuri FaceGrem. Ibyo ntibigomba kunyuranya n’amategeko cyangwa kugirira nabi abandi bakoresha.",
      },
      {
        title: "4. Impinduka ku rubuga",
        body:
          "FaceGrem ishobora kuvugurura ibiranga urubuga, politiki, na serivisi mu gihe runaka kugira ngo irusheho kuba nziza kandi itekanye.",
      },
      {
        title: "5. Kugabanya cyangwa guhagarika konti",
        body:
          "Dushobora guhagarika cyangwa gukuraho konti cyangwa ibirimo binyuranya n’amategeko y’urubuga cyangwa bibangamira umutekano n’ubunyangamugayo bwa serivisi.",
      },
    ],
  },
};

export default function TermsPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { language } = useLanguage();
  const pageText = termsTranslations[language];

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
