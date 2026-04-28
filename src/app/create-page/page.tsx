"use client";

import Link from "next/link";
import LanguageMenu from "../../components/LanguageMenu";
import { useLanguage } from "../../components/LanguageProvider";
import { TranslationLanguage } from "../../lib/language";

const createPageTranslations: Record<
  TranslationLanguage,
  {
    eyebrow: string;
    title: string;
    intro: string;
    backHome: string;
    sections: { title: string; body: string }[];
    actions: {
      feed: string;
      profile: string;
      communities: string;
    };
  }
> = {
  en: {
    eyebrow: "FaceGrem pages",
    title: "Create Page",
    intro:
      "Build a public presence for a brand, creator, organization, church, nonprofit, public figure, or idea.",
    backHome: "Back home",
    sections: [
      {
        title: "Public identity",
        body:
          "In the future, FaceGrem Pages can allow businesses, creators, churches, nonprofits, and public figures to create a dedicated presence.",
      },
      {
        title: "Current status",
        body:
          "FaceGrem may not yet support full Page creation tools, but this route is ready for future public-page features.",
      },
    ],
    actions: {
      feed: "Back to feed",
      profile: "Open profile",
      communities: "Explore communities",
    },
  },
  sw: {
    eyebrow: "Kurasa za FaceGrem",
    title: "Tengeneza Ukurasa",
    intro:
      "Jenga uwepo wa umma kwa ajili ya brand, mbunifu, shirika, kanisa, nonprofit, mtu maarufu, au wazo.",
    backHome: "Rudi mwanzo",
    sections: [
      {
        title: "Utambulisho wa umma",
        body:
          "Katika siku zijazo, FaceGrem Pages inaweza kuruhusu biashara, wabunifu, makanisa, nonprofits, na watu wa umma kutengeneza uwepo wao maalum.",
      },
      {
        title: "Hali ya sasa",
        body:
          "FaceGrem huenda bado haijakamilisha zana zote za kutengeneza Page, lakini njia hii iko tayari kwa vipengele vya public-page vya baadaye.",
      },
    ],
    actions: {
      feed: "Rudi kwenye feed",
      profile: "Fungua wasifu",
      communities: "Gundua jumuiya",
    },
  },
  fr: {
    eyebrow: "Pages FaceGrem",
    title: "Créer une Page",
    intro:
      "Construisez une présence publique pour une marque, un créateur, une organisation, une église, une association, une personnalité publique ou une idée.",
    backHome: "Retour à l’accueil",
    sections: [
      {
        title: "Identité publique",
        body:
          "À l’avenir, les Pages FaceGrem pourront permettre aux entreprises, créateurs, églises, associations et personnalités publiques de créer une présence dédiée.",
      },
      {
        title: "État actuel",
        body:
          "FaceGrem ne prend peut-être pas encore en charge tous les outils de création de Page, mais cette route est prête pour les futures fonctionnalités de pages publiques.",
      },
    ],
    actions: {
      feed: "Retour au fil",
      profile: "Ouvrir le profil",
      communities: "Explorer les communautés",
    },
  },
  rw: {
    eyebrow: "Paji za FaceGrem",
    title: "Kora Page",
    intro:
      "Wubake uko ugaragara ku mugaragaro ku brand, umuhanzi, umuryango, itorero, nonprofit, umuntu uzwi, cyangwa igitekerezo.",
    backHome: "Subira ahabanza",
    sections: [
      {
        title: "Umwirondoro wa rubanda",
        body:
          "Mu gihe kiri imbere, FaceGrem Pages ishobora gufasha businesses, abahanzi, amatorero, nonprofits, n’abantu bazwi gukora umwanya wabo wihariye.",
      },
      {
        title: "Uko bihagaze ubu",
        body:
          "FaceGrem ishobora kuba itarashyiraho ibikoresho byose byo gukora Page, ariko iyi route yiteguye kwakira features za public-page mu gihe kizaza.",
      },
    ],
    actions: {
      feed: "Subira kuri feed",
      profile: "Fungura umwirondoro",
      communities: "Reba imiryango",
    },
  },
};

export default function CreatePagePage() {
  const { language } = useLanguage();
  const pageText = createPageTranslations[language];

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_28%),linear-gradient(to_bottom,#020817,#07111f_45%,#020817)]" />
        <div className="absolute left-0 top-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#020817]/55 backdrop-blur-3xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/10 bg-[linear-gradient(145deg,rgba(10,18,34,0.95),rgba(8,15,28,0.75))] font-bold text-cyan-100 shadow-[0_10px_30px_rgba(34,211,238,0.08)]">
              F
            </div>
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
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">
              {pageText.intro}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/feed"
                className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
              >
                {pageText.actions.feed}
              </Link>
              <Link
                href="/profile"
                className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
              >
                {pageText.actions.profile}
              </Link>
              <Link
                href="/communities"
                className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
              >
                {pageText.actions.communities}
              </Link>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:p-8 md:grid-cols-2">
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
