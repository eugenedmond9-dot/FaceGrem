"use client";

import Link from "next/link";
import LanguageMenu from "../../components/LanguageMenu";
import { useLanguage } from "../../components/LanguageProvider";
import { TranslationLanguage } from "../../lib/language";
import FaceGremLogo from "../../components/FaceGremLogo";

const privacyCentreTranslations: Record<
  TranslationLanguage,
  {
    eyebrow: string;
    title: string;
    intro: string;
    backHome: string;
    cards: { title: string; body: string }[];
    moreTitle: string;
    moreBody: string;
    openPrivacy: string;
  }
> = {
  en: {
    eyebrow: "FaceGrem privacy",
    title: "Privacy Centre",
    intro: "Learn how FaceGrem handles privacy and user controls.",
    backHome: "Back home",
    cards: [
      {
        title: "Account information",
        body:
          "Review and update your profile details, including name, username, bio, and avatar.",
      },
      {
        title: "Posts and content",
        body:
          "Manage what you post and remember that public content may be visible to others.",
      },
      {
        title: "Messages and interactions",
        body:
          "Direct messages and social interactions are part of the FaceGrem experience and may be stored to support the service.",
      },
      {
        title: "Security tips",
        body:
          "Use a strong password, avoid sharing account access, and review your account regularly.",
      },
    ],
    moreTitle: "Need more details?",
    moreBody:
      "For the full explanation of how information is handled on FaceGrem, read the Privacy Policy.",
    openPrivacy: "Open Privacy Policy",
  },
  sw: {
    eyebrow: "Faragha ya FaceGrem",
    title: "Kituo cha Faragha",
    intro: "Jifunze jinsi FaceGrem inavyoshughulikia faragha na udhibiti wa mtumiaji.",
    backHome: "Rudi mwanzo",
    cards: [
      {
        title: "Taarifa za akaunti",
        body:
          "Kagua na sasisha taarifa za wasifu wako, ikiwemo jina, username, bio, na picha ya wasifu.",
      },
      {
        title: "Machapisho na maudhui",
        body:
          "Dhibiti unachochapisha na kumbuka kuwa maudhui ya umma yanaweza kuonekana na wengine.",
      },
      {
        title: "Ujumbe na mwingiliano",
        body:
          "Ujumbe wa moja kwa moja na mwingiliano wa kijamii ni sehemu ya matumizi ya FaceGrem na unaweza kuhifadhiwa ili kusaidia huduma.",
      },
      {
        title: "Vidokezo vya usalama",
        body:
          "Tumia nenosiri imara, epuka kushiriki ufikiaji wa akaunti, na kagua akaunti yako mara kwa mara.",
      },
    ],
    moreTitle: "Unahitaji maelezo zaidi?",
    moreBody:
      "Kwa maelezo kamili ya jinsi taarifa zinavyoshughulikiwa kwenye FaceGrem, soma Sera ya Faragha.",
    openPrivacy: "Fungua Sera ya Faragha",
  },
  fr: {
    eyebrow: "Confidentialité FaceGrem",
    title: "Centre de confidentialité",
    intro:
      "Découvrez comment FaceGrem gère la confidentialité et les contrôles utilisateur.",
    backHome: "Retour à l’accueil",
    cards: [
      {
        title: "Informations du compte",
        body:
          "Consultez et mettez à jour les détails de votre profil, notamment le nom, le nom d’utilisateur, la bio et l’avatar.",
      },
      {
        title: "Publications et contenu",
        body:
          "Gérez ce que vous publiez et souvenez-vous que le contenu public peut être visible par d’autres.",
      },
      {
        title: "Messages et interactions",
        body:
          "Les messages directs et les interactions sociales font partie de l’expérience FaceGrem et peuvent être stockés pour soutenir le service.",
      },
      {
        title: "Conseils de sécurité",
        body:
          "Utilisez un mot de passe fort, évitez de partager l’accès au compte et vérifiez régulièrement votre compte.",
      },
    ],
    moreTitle: "Besoin de plus de détails ?",
    moreBody:
      "Pour une explication complète de la gestion des informations sur FaceGrem, lisez la politique de confidentialité.",
    openPrivacy: "Ouvrir la politique de confidentialité",
  },
  rw: {
    eyebrow: "Ubwirinzi bwite bwa FaceGrem",
    title: "Ikigo cy’Ubwirinzi bwite",
    intro:
      "Menya uko FaceGrem icunga ubwirinzi bwite n’uburyo umukoresha agenzura amakuru ye.",
    backHome: "Subira ahabanza",
    cards: [
      {
        title: "Amakuru ya konti",
        body:
          "Reba kandi uvugurure amakuru ya profile yawe, harimo izina, username, bio, n’ifoto ya profile.",
      },
      {
        title: "Ibyanditswe n’ibirimo",
        body:
          "Cunga ibyo utangaza kandi wibuke ko ibirimo bya rubanda bishobora kubonwa n’abandi.",
      },
      {
        title: "Ubutumwa n’imikoranire",
        body:
          "Ubutumwa bwihariye n’imikoranire ya social ni igice cya FaceGrem kandi bishobora kubikwa kugira ngo serivisi ikore neza.",
      },
      {
        title: "Inama z’umutekano",
        body:
          "Koresha password ikomeye, wirinde gusangiza abandi access ya konti, kandi ujye usuzuma konti yawe kenshi.",
      },
    ],
    moreTitle: "Ukeneye ibisobanuro birambuye?",
    moreBody:
      "Ku bisobanuro byose by’uko amakuru acungwa kuri FaceGrem, soma Politiki y’Ubwirinzi bwite.",
    openPrivacy: "Fungura Politiki y’Ubwirinzi bwite",
  },
};

export default function PrivacyCentrePage() {
  const { language } = useLanguage();
  const pageText = privacyCentreTranslations[language];

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
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">
              {pageText.intro}
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8">
            {pageText.cards.map((card) => (
              <section
                key={card.title}
                className="rounded-[26px] border border-white/[0.07] bg-white/[0.035] p-5 transition hover:bg-white/[0.05]"
              >
                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{card.body}</p>
              </section>
            ))}
          </div>

          <div className="border-t border-white/[0.07] p-5 sm:p-8">
            <section className="rounded-[28px] border border-cyan-300/15 bg-cyan-400/[0.06] p-5">
              <h3 className="text-lg font-semibold text-white">{pageText.moreTitle}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {pageText.moreBody}
              </p>
              <Link
                href="/privacy"
                className="mt-5 inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
              >
                {pageText.openPrivacy}
              </Link>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
