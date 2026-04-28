"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import LanguageMenu from "../../components/LanguageMenu";
import NotificationDropdown from "../../components/NotificationDropdown";
import { useLanguage } from "../../components/LanguageProvider";
import { TranslationLanguage } from "../../lib/language";
import { supabase } from "../../lib/supabase";

const settingsTranslations: Record<
  TranslationLanguage,
  {
    title: string;
    subtitle: string;
    account: string;
    accountText: string;
    privacy: string;
    privacyText: string;
    language: string;
    languageText: string;
    notifications: string;
    notificationsText: string;
    security: string;
    securityText: string;
    help: string;
    helpText: string;
    quickLinks: string;
    openProfile: string;
    savedPosts: string;
    privacyCentre: string;
    terms: string;
    cookies: string;
    logout: string;
    loggingOut: string;
    comingSoon: string;
    backToFeed: string;
  }
> = {
  en: {
    title: "Settings",
    subtitle: "Manage your FaceGrem account, language, privacy, and app preferences.",
    account: "Account",
    accountText: "Update your profile, username, avatar, and public identity.",
    privacy: "Privacy",
    privacyText: "Review privacy controls and learn how FaceGrem handles your information.",
    language: "Language",
    languageText: "Choose the language used across the whole website.",
    notifications: "Notifications",
    notificationsText: "Open recent alerts, messages, calls, follows, likes, and comments.",
    security: "Security",
    securityText: "Use a strong password and keep your account access safe.",
    help: "Help",
    helpText: "Find support information and learn how to use FaceGrem.",
    quickLinks: "Quick links",
    openProfile: "Open profile",
    savedPosts: "Saved posts",
    privacyCentre: "Privacy Centre",
    terms: "Terms",
    cookies: "Cookies",
    logout: "Log out",
    loggingOut: "Logging out...",
    comingSoon: "More controls coming soon",
    backToFeed: "Back to feed",
  },
  sw: {
    title: "Mipangilio",
    subtitle: "Simamia akaunti yako ya FaceGrem, lugha, faragha, na mapendeleo ya app.",
    account: "Akaunti",
    accountText: "Sasisha wasifu, username, picha, na utambulisho wako wa umma.",
    privacy: "Faragha",
    privacyText: "Kagua udhibiti wa faragha na ujifunze FaceGrem inavyoshughulikia taarifa zako.",
    language: "Lugha",
    languageText: "Chagua lugha itakayotumika kwenye tovuti yote.",
    notifications: "Arifa",
    notificationsText: "Fungua arifa za hivi karibuni, ujumbe, simu, follows, likes, na comments.",
    security: "Usalama",
    securityText: "Tumia nenosiri imara na linda ufikiaji wa akaunti yako.",
    help: "Msaada",
    helpText: "Pata taarifa za msaada na ujifunze kutumia FaceGrem.",
    quickLinks: "Viungo vya haraka",
    openProfile: "Fungua wasifu",
    savedPosts: "Machapisho yaliyohifadhiwa",
    privacyCentre: "Kituo cha Faragha",
    terms: "Masharti",
    cookies: "Vidakuzi",
    logout: "Toka",
    loggingOut: "Inatoka...",
    comingSoon: "Udhibiti zaidi unakuja hivi karibuni",
    backToFeed: "Rudi kwenye feed",
  },
  fr: {
    title: "Paramètres",
    subtitle: "Gérez votre compte FaceGrem, la langue, la confidentialité et les préférences de l’application.",
    account: "Compte",
    accountText: "Mettez à jour votre profil, nom d’utilisateur, avatar et identité publique.",
    privacy: "Confidentialité",
    privacyText: "Consultez les contrôles de confidentialité et découvrez comment FaceGrem gère vos informations.",
    language: "Langue",
    languageText: "Choisissez la langue utilisée sur tout le site.",
    notifications: "Notifications",
    notificationsText: "Ouvrez les alertes récentes, messages, appels, abonnements, likes et commentaires.",
    security: "Sécurité",
    securityText: "Utilisez un mot de passe fort et protégez l’accès à votre compte.",
    help: "Aide",
    helpText: "Trouvez des informations d’assistance et apprenez à utiliser FaceGrem.",
    quickLinks: "Liens rapides",
    openProfile: "Ouvrir le profil",
    savedPosts: "Publications enregistrées",
    privacyCentre: "Centre de confidentialité",
    terms: "Conditions",
    cookies: "Cookies",
    logout: "Se déconnecter",
    loggingOut: "Déconnexion...",
    comingSoon: "Plus de contrôles arrivent bientôt",
    backToFeed: "Retour au fil",
  },
  rw: {
    title: "Igenamiterere",
    subtitle: "Cunga konti yawe ya FaceGrem, ururimi, ubwirinzi bwite, n’ibyo ukunda muri app.",
    account: "Konti",
    accountText: "Vugurura profile yawe, username, ifoto, n’uko ugaragara ku rubuga.",
    privacy: "Ubwirinzi bwite",
    privacyText: "Reba uburyo bwo gucunga ubwirinzi bwite n’uko FaceGrem ifata amakuru yawe.",
    language: "Ururimi",
    languageText: "Hitamo ururimi ruzakoreshwa ku rubuga rwose.",
    notifications: "Amamenyesha",
    notificationsText: "Fungura alerts nshya, ubutumwa, guhamagara, follows, likes, na comments.",
    security: "Umutekano",
    securityText: "Koresha password ikomeye kandi urinde access ya konti yawe.",
    help: "Ubufasha",
    helpText: "Bona amakuru y’ubufasha kandi wige uko ukoresha FaceGrem.",
    quickLinks: "Links zihuse",
    openProfile: "Fungura umwirondoro",
    savedPosts: "Ibyanditswe byabitswe",
    privacyCentre: "Ikigo cy’Ubwirinzi bwite",
    terms: "Amabwiriza",
    cookies: "Cookies",
    logout: "Sohoka",
    loggingOut: "Birimo gusohoka...",
    comingSoon: "Ibindi byo kugenzura biri hafi kuza",
    backToFeed: "Subira kuri feed",
  },
};

export default function SettingsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const pageText = settingsTranslations[language];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/");
  };

  const settingCards = [
    {
      icon: "👤",
      title: pageText.account,
      text: pageText.accountText,
      href: "/profile",
      action: pageText.openProfile,
    },
    {
      icon: "🔒",
      title: pageText.privacy,
      text: pageText.privacyText,
      href: "/privacy-centre",
      action: pageText.privacyCentre,
    },
    {
      icon: "🌐",
      title: pageText.language,
      text: pageText.languageText,
      custom: <LanguageMenu />,
    },
    {
      icon: "🔔",
      title: pageText.notifications,
      text: pageText.notificationsText,
      custom: <NotificationDropdown />,
    },
    {
      icon: "🛡️",
      title: pageText.security,
      text: pageText.securityText,
      badge: pageText.comingSoon,
    },
    {
      icon: "❓",
      title: pageText.help,
      text: pageText.helpText,
      href: "/help",
      action: pageText.help,
    },
  ];

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_28%),linear-gradient(to_bottom,#020817,#07111f_45%,#020817)]" />
        <div className="absolute left-0 top-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#020817]/55 backdrop-blur-3xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/feed" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/10 bg-[linear-gradient(145deg,rgba(10,18,34,0.95),rgba(8,15,28,0.75))] font-bold text-cyan-100 shadow-[0_10px_30px_rgba(34,211,238,0.08)]">
              F
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">FaceGrem</h1>
              <p className="text-xs text-slate-400">{pageText.title}</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <LanguageMenu compact />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="overflow-hidden rounded-[34px] border border-white/[0.07] bg-white/[0.035] shadow-[0_25px_90px_rgba(2,8,23,0.35)] backdrop-blur-2xl">
          <div className="border-b border-white/[0.07] bg-[linear-gradient(135deg,rgba(8,47,73,0.80),rgba(15,23,42,0.90)_55%,rgba(30,41,59,0.90))] p-6 sm:p-8">
            <Link
              href="/feed"
              className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-2xl text-slate-200 transition hover:bg-white/[0.06]"
              aria-label={pageText.backToFeed}
            >
              ‹
            </Link>

            <p className="text-sm font-semibold text-cyan-200">FaceGrem</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-5xl">
              {pageText.title}
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">
              {pageText.subtitle}
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:p-8 lg:grid-cols-2">
            {settingCards.map((card) => (
              <section
                key={card.title}
                className="rounded-[28px] border border-white/[0.07] bg-white/[0.035] p-5 transition hover:bg-white/[0.05]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-xl">
                    {card.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      {card.text}
                    </p>

                    <div className="mt-4">
                      {card.custom ? (
                        card.custom
                      ) : card.href ? (
                        <Link
                          href={card.href}
                          className="inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
                        >
                          {card.action}
                        </Link>
                      ) : (
                        <span className="inline-flex rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-2 text-sm text-slate-300">
                          {card.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="border-t border-white/[0.07] p-5 sm:p-8">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/saved"
                className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-center text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
              >
                {pageText.savedPosts}
              </Link>
              <Link
                href="/privacy-centre"
                className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-center text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
              >
                {pageText.privacyCentre}
              </Link>
              <Link
                href="/terms"
                className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-center text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
              >
                {pageText.terms}
              </Link>
              <Link
                href="/cookies"
                className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-center text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
              >
                {pageText.cookies}
              </Link>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 w-full rounded-2xl border border-red-300/10 bg-red-400/[0.07] px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-400/[0.11]"
            >
              ↩️ {pageText.logout}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
