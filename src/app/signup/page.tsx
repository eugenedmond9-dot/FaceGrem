"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import LanguageMenu from "../../components/LanguageMenu";
import { useLanguage } from "../../components/LanguageProvider";
import { TranslationLanguage } from "../../lib/language";
import FaceGremLogo from "../../components/FaceGremLogo";
import FaceGremHamburgerMenu from "../../components/FaceGremHamburgerMenu";

const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

const signupTranslations: Record<
  TranslationLanguage,
  {
    back: string;
    brandName: string;
    pageTitle: string;
    pageSubtitle: string;
    name: string;
    firstName: string;
    surname: string;
    dateOfBirth: string;
    day: string;
    month: string;
    year: string;
    months: string[];
    gender: string;
    selectGender: string;
    female: string;
    male: string;
    custom: string;
    preferNotToSay: string;
    emailOrPhone: string;
    emailOrPhonePlaceholder: string;
    contactInfoHelp: string;
    password: string;
    passwordPlaceholder: string;
    termsTextOne: string;
    termsTextTwo: string;
    submit: string;
    creatingAccount: string;
    alreadyHaveAccount: string;
    fillAllFields: string;
    passwordTooShort: string;
    emailOnly: string;
    signupSuccess: string;
    language: string;
    privacy: string;
    terms: string;
    cookies: string;
  }
> = {
  en: {
    back: "‹",
    brandName: "FaceGrem",
    pageTitle: "Create your account",
    pageSubtitle: "Join FaceGrem to connect, share, message, and grow your community.",
    name: "Name",
    firstName: "First name",
    surname: "Surname",
    dateOfBirth: "Date of birth",
    day: "Day",
    month: "Month",
    year: "Year",
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    gender: "Gender",
    selectGender: "Select gender",
    female: "Female",
    male: "Male",
    custom: "Custom",
    preferNotToSay: "Prefer not to say",
    emailOrPhone: "Email",
    emailOrPhonePlaceholder: "Email address",
    contactInfoHelp: "Use an email address you can access. FaceGrem currently supports email sign up.",
    password: "Password",
    passwordPlaceholder: "Create a password",
    termsTextOne:
      "By signing up, you agree to FaceGrem’s Terms, Privacy Policy, and Cookies Policy.",
    termsTextTwo:
      "You may receive notifications from FaceGrem and can manage them from your account settings.",
    submit: "Create account",
    creatingAccount: "Creating account...",
    alreadyHaveAccount: "Already have an account?",
    fillAllFields: "Please fill in all fields.",
    passwordTooShort: "Password must be at least 6 characters.",
    emailOnly: "Please use an email address to sign up.",
    signupSuccess: "Account created. Please check your email if confirmation is required.",
    language: "Language",
    privacy: "Privacy",
    terms: "Terms",
    cookies: "Cookies",
  },
  sw: {
    back: "‹",
    brandName: "FaceGrem",
    pageTitle: "Fungua akaunti yako",
    pageSubtitle: "Jiunge na FaceGrem kuungana, kushiriki, kutuma ujumbe, na kukuza jamii yako.",
    name: "Jina",
    firstName: "Jina la kwanza",
    surname: "Jina la ukoo",
    dateOfBirth: "Tarehe ya kuzaliwa",
    day: "Siku",
    month: "Mwezi",
    year: "Mwaka",
    months: [
      "Januari",
      "Februari",
      "Machi",
      "Aprili",
      "Mei",
      "Juni",
      "Julai",
      "Agosti",
      "Septemba",
      "Oktoba",
      "Novemba",
      "Desemba",
    ],
    gender: "Jinsia",
    selectGender: "Chagua jinsia",
    female: "Mwanamke",
    male: "Mwanaume",
    custom: "Nyingine",
    preferNotToSay: "Sipendi kusema",
    emailOrPhone: "Barua pepe",
    emailOrPhonePlaceholder: "Anwani ya barua pepe",
    contactInfoHelp:
      "Tumia barua pepe unayoweza kufikia. FaceGrem kwa sasa inaruhusu kujisajili kwa barua pepe.",
    password: "Nenosiri",
    passwordPlaceholder: "Tengeneza nenosiri",
    termsTextOne:
      "Kwa kujisajili, unakubali Masharti, Sera ya Faragha, na Sera ya Vidakuzi ya FaceGrem.",
    termsTextTwo:
      "Unaweza kupokea arifa kutoka FaceGrem na kuzisimamia kwenye mipangilio ya akaunti yako.",
    submit: "Fungua akaunti",
    creatingAccount: "Inafungua akaunti...",
    alreadyHaveAccount: "Tayari una akaunti?",
    fillAllFields: "Tafadhali jaza sehemu zote.",
    passwordTooShort: "Nenosiri lazima liwe na angalau herufi 6.",
    emailOnly: "Tafadhali tumia barua pepe kujisajili.",
    signupSuccess:
      "Akaunti imefunguliwa. Tafadhali angalia barua pepe yako kama uthibitisho unahitajika.",
    language: "Lugha",
    privacy: "Faragha",
    terms: "Masharti",
    cookies: "Vidakuzi",
  },
  fr: {
    back: "‹",
    brandName: "FaceGrem",
    pageTitle: "Créez votre compte",
    pageSubtitle:
      "Rejoignez FaceGrem pour vous connecter, partager, envoyer des messages et développer votre communauté.",
    name: "Nom",
    firstName: "Prénom",
    surname: "Nom de famille",
    dateOfBirth: "Date de naissance",
    day: "Jour",
    month: "Mois",
    year: "Année",
    months: [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ],
    gender: "Genre",
    selectGender: "Sélectionner le genre",
    female: "Femme",
    male: "Homme",
    custom: "Personnalisé",
    preferNotToSay: "Préfère ne pas répondre",
    emailOrPhone: "Email",
    emailOrPhonePlaceholder: "Adresse email",
    contactInfoHelp:
      "Utilisez une adresse email accessible. FaceGrem prend actuellement en charge l’inscription par email.",
    password: "Mot de passe",
    passwordPlaceholder: "Créer un mot de passe",
    termsTextOne:
      "En vous inscrivant, vous acceptez les Conditions, la Politique de confidentialité et la Politique relative aux cookies de FaceGrem.",
    termsTextTwo:
      "Vous pouvez recevoir des notifications de FaceGrem et les gérer depuis les paramètres de votre compte.",
    submit: "Créer le compte",
    creatingAccount: "Création du compte...",
    alreadyHaveAccount: "Vous avez déjà un compte ?",
    fillAllFields: "Veuillez remplir tous les champs.",
    passwordTooShort: "Le mot de passe doit contenir au moins 6 caractères.",
    emailOnly: "Veuillez utiliser une adresse email pour vous inscrire.",
    signupSuccess:
      "Compte créé. Veuillez vérifier votre email si une confirmation est requise.",
    language: "Langue",
    privacy: "Confidentialité",
    terms: "Conditions",
    cookies: "Cookies",
  },
  rw: {
    back: "‹",
    brandName: "FaceGrem",
    pageTitle: "Fungura konti yawe",
    pageSubtitle:
      "Injira kuri FaceGrem kugira ngo uhuze n’abandi, usangize, wohereze ubutumwa, kandi wubake umuryango wawe.",
    name: "Izina",
    firstName: "Izina rya mbere",
    surname: "Izina ry’umuryango",
    dateOfBirth: "Itariki y’amavuko",
    day: "Umunsi",
    month: "Ukwezi",
    year: "Umwaka",
    months: [
      "Mutarama",
      "Gashyantare",
      "Werurwe",
      "Mata",
      "Gicurasi",
      "Kamena",
      "Nyakanga",
      "Kanama",
      "Nzeri",
      "Ukwakira",
      "Ugushyingo",
      "Ukuboza",
    ],
    gender: "Igitsina",
    selectGender: "Hitamo igitsina",
    female: "Gore",
    male: "Gabo",
    custom: "Ikindi",
    preferNotToSay: "Sinshaka kubivuga",
    emailOrPhone: "Email",
    emailOrPhonePlaceholder: "Aderesi ya email",
    contactInfoHelp:
      "Koresha email ushobora kubona. FaceGrem kuri ubu yemera kwiyandikisha ukoresheje email.",
    password: "Ijambo ry’ibanga",
    passwordPlaceholder: "Kora ijambo ry’ibanga",
    termsTextOne:
      "Iyo wiyandikishije, uba wemeye Amabwiriza, Politiki y’Ubwirinzi bwite, na Politiki ya Cookies bya FaceGrem.",
    termsTextTwo:
      "Ushobora kwakira amamenyesha ya FaceGrem kandi ukayacunga mu igenamiterere rya konti yawe.",
    submit: "Fungura konti",
    creatingAccount: "Birimo gufungura konti...",
    alreadyHaveAccount: "Usanzwe ufite konti?",
    fillAllFields: "Uzuza imyanya yose.",
    passwordTooShort: "Ijambo ry’ibanga rigomba kugira nibura inyuguti 6.",
    emailOnly: "Koresha email kugira ngo wiyandikishe.",
    signupSuccess:
      "Konti yafunguwe. Reba email yawe niba hakenewe kwemeza.",
    language: "Ururimi",
    privacy: "Ubwirinzi bwite",
    terms: "Amabwiriza",
    cookies: "Cookies",
  },
};

export default function SignupPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const router = useRouter();
  const { language } = useLanguage();

  const [loadingSignup, setLoadingSignup] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

  const t = signupTranslations[language];

  const fullName = useMemo(() => {
    return `${firstName.trim()} ${surname.trim()}`.trim();
  }, [firstName, surname]);

  const handleSignup = async () => {
    if (
      !firstName.trim() ||
      !surname.trim() ||
      !birthDay ||
      !birthMonth ||
      !birthYear ||
      !gender ||
      !emailOrPhone.trim() ||
      !password.trim()
    ) {
      alert(t.fillAllFields);
      return;
    }

    if (password.length < 6) {
      alert(t.passwordTooShort);
      return;
    }

    const looksLikeEmail = emailOrPhone.includes("@");

    if (!looksLikeEmail) {
      alert(t.emailOnly);
      return;
    }

    setLoadingSignup(true);

    const { error } = await supabase.auth.signUp({
      email: emailOrPhone.trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: firstName.trim(),
          surname: surname.trim(),
          birth_day: birthDay,
          birth_month: birthMonth,
          birth_year: birthYear,
          gender,
        },
      },
    });

    setLoadingSignup(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(t.signupSuccess);
    router.push("/");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f0f2f5] text-[#050505]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-200/45 blur-3xl" />
        <div className="absolute -right-24 top-24 h-[30rem] w-[30rem] rounded-full bg-sky-200/45 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-indigo-100/55 blur-3xl" />
      </div>

      <FaceGremHamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onLogout={undefined}
      />

      <header className="relative z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-700 shadow-sm transition hover:bg-slate-200"
              aria-label="Open menu"
            >
              ≡
            </button>

            <FaceGremLogo
              href="/"
              showWordmark={false}
              markClassName="h-11 w-11 rounded-2xl ring-0 shadow-sm"
            />

            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-950">{t.brandName}</h1>
              <p className="text-xs font-medium text-slate-500">{t.pageTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageMenu compact />
            <Link
              href="/"
              className="hidden rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 sm:inline-flex"
            >
              {t.alreadyHaveAccount}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-start lg:py-12">
        <section className="space-y-6">
          <Link
            href="/"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-3xl text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
            aria-label="Back"
          >
            {t.back}
          </Link>

          <div className="overflow-hidden rounded-[36px] bg-white shadow-sm ring-1 ring-slate-200">
            <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 p-7 text-white sm:p-9">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-50">
                FaceGrem account
              </p>
              <h2 className="mt-4 max-w-3xl text-5xl font-black tracking-tight sm:text-6xl">
                {t.pageTitle}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-blue-50">
                {t.pageSubtitle}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[24px] bg-white/15 p-4 ring-1 ring-white/15 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-100">
                    Connect
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white">
                    Find friends and creators.
                  </p>
                </div>
                <div className="rounded-[24px] bg-white/15 p-4 ring-1 ring-white/15 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-100">
                    Share
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white">
                    Post stories, videos, and updates.
                  </p>
                </div>
                <div className="rounded-[24px] bg-white/15 p-4 ring-1 ring-white/15 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-100">
                    Grow
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white">
                    Build your groups and community.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
              <Link
                href="/terms"
                className="rounded-[24px] bg-slate-50 p-5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                  📄
                </span>
                {t.terms}
              </Link>
              <Link
                href="/privacy-centre"
                className="rounded-[24px] bg-slate-50 p-5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                  🔒
                </span>
                {t.privacy}
              </Link>
              <Link
                href="/cookies"
                className="rounded-[24px] bg-slate-50 p-5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                  🍪
                </span>
                {t.cookies}
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-[30px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                ✓
              </div>
              <h3 className="mt-4 text-xl font-black text-slate-950">Security-first account</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Your account is connected to Supabase Auth, profile records, RLS policies, and
                protected storage rules.
              </p>
            </article>

            <article className="rounded-[30px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                ✦
              </div>
              <h3 className="mt-4 text-xl font-black text-slate-950">Ready for your world</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Once you join, you can access the feed, messages, groups, communities, videos,
                settings, privacy, and cookies controls.
              </p>
            </article>
          </div>
        </section>

        <section className="rounded-[36px] bg-white p-5 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 sm:p-6">
          <div className="rounded-[28px] bg-slate-950 p-6 text-white">
            <div className="flex items-center gap-3">
              <FaceGremLogo
                href="/"
                showWordmark={false}
                markClassName="h-12 w-12 rounded-2xl ring-0 shadow-sm"
              />
              <div>
                <p className="text-sm font-semibold text-blue-200">Create your FaceGrem ID</p>
                <h3 className="text-2xl font-black tracking-tight">{t.submit}</h3>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Fill in your details below. Use an email address you can access so your account can
              stay secure.
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSignup();
            }}
            className="mt-6 space-y-5"
          >
            <div>
              <label className="mb-3 block text-sm font-black text-slate-950">
                {t.name}
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder={t.firstName}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white"
                />
                <input
                  type="text"
                  value={surname}
                  onChange={(event) => setSurname(event.target.value)}
                  placeholder={t.surname}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-black text-slate-950">
                {t.dateOfBirth}
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  value={birthDay}
                  onChange={(event) => setBirthDay(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white"
                >
                  <option value="">{t.day}</option>
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>

                <select
                  value={birthMonth}
                  onChange={(event) => setBirthMonth(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white"
                >
                  <option value="">{t.month}</option>
                  {t.months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>

                <select
                  value={birthYear}
                  onChange={(event) => setBirthYear(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white"
                >
                  <option value="">{t.year}</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-black text-slate-950">
                {t.gender}
              </label>
              <select
                value={gender}
                onChange={(event) => setGender(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white"
              >
                <option value="">{t.selectGender}</option>
                <option value="Female">{t.female}</option>
                <option value="Male">{t.male}</option>
                <option value="Custom">{t.custom}</option>
                <option value="Prefer not to say">{t.preferNotToSay}</option>
              </select>
            </div>

            <div>
              <label className="mb-3 block text-sm font-black text-slate-950">
                {t.emailOrPhone}
              </label>
              <input
                type="email"
                value={emailOrPhone}
                onChange={(event) => setEmailOrPhone(event.target.value)}
                placeholder={t.emailOrPhonePlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white"
              />
              <p className="mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-xs leading-6 text-blue-700">
                {t.contactInfoHelp}
              </p>
            </div>

            <div>
              <label className="mb-3 block text-sm font-black text-slate-950">
                {t.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white"
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <span className="rounded-full bg-slate-100 px-3 py-2 text-center text-xs font-bold text-slate-600">
                  6+ characters
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-center text-xs font-bold text-slate-600">
                  Private to you
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-center text-xs font-bold text-slate-600">
                  Secure login
                </span>
              </div>
            </div>

            <div className="space-y-2 rounded-[24px] bg-slate-50 p-4 text-xs leading-6 text-slate-600 ring-1 ring-slate-200">
              <p>{t.termsTextOne}</p>
              <p>{t.termsTextTwo}</p>
            </div>

            <button
              type="submit"
              disabled={loadingSignup}
              className="w-full rounded-2xl bg-blue-600 py-3.5 text-base font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingSignup ? t.creatingAccount : t.submit}
            </button>

            <Link
              href="/"
              className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 text-center text-base font-bold text-slate-700 transition hover:bg-slate-100"
            >
              {t.alreadyHaveAccount}
            </Link>
          </form>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-200 bg-white/90 px-4 py-5 text-center text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-4">
          <Link href="/terms" className="font-semibold hover:text-blue-600">
            {t.terms}
          </Link>
          <Link href="/privacy-centre" className="font-semibold hover:text-blue-600">
            {t.privacy}
          </Link>
          <Link href="/cookies" className="font-semibold hover:text-blue-600">
            {t.cookies}
          </Link>
        </div>
      </footer>
    </div>
  );
}
