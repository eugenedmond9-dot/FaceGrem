"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import AuthBackground from "../../components/AuthBackground";
import LanguageMenu from "../../components/LanguageMenu";
import { useLanguage } from "../../components/LanguageProvider";
import { TranslationLanguage } from "../../lib/language";
import FaceGremLogo from "../../components/FaceGremLogo";

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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#020817] text-white">
      <AuthBackground />

      <header className="relative z-20 border-b border-white/[0.06] bg-[#020817]/55 backdrop-blur-3xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <FaceGremLogo
              href=""
              showWordmark={false}
              markClassName="h-10 w-10 rounded-2xl ring-0 shadow-sm"
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">{t.brandName}</h1>
              <p className="text-xs text-slate-400">{t.pageTitle}</p>
            </div>
          </Link>

          <LanguageMenu compact />
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,520px)] lg:items-start">
          <section className="hidden pt-10 lg:block">
            <Link
              href="/"
              className="mb-8 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-3xl text-slate-200 transition hover:bg-white/[0.06]"
              aria-label="Back"
            >
              {t.back}
            </Link>

            <p className="text-sm font-semibold text-cyan-200">{t.brandName}</p>
            <h2 className="mt-3 max-w-xl text-5xl font-bold tracking-tight text-white">
              {t.pageTitle}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              {t.pageSubtitle}
            </p>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              <Link
                href="/terms"
                className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-sm text-slate-200 transition hover:bg-white/[0.06]"
              >
                {t.terms}
              </Link>
              <Link
                href="/privacy-centre"
                className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-sm text-slate-200 transition hover:bg-white/[0.06]"
              >
                {t.privacy}
              </Link>
              <Link
                href="/cookies"
                className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-sm text-slate-200 transition hover:bg-white/[0.06]"
              >
                {t.cookies}
              </Link>
            </div>
          </section>

          <section>
            <div className="mb-5 lg:hidden">
              <Link
                href="/"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-3xl text-slate-200 transition hover:bg-white/[0.06]"
                aria-label="Back"
              >
                {t.back}
              </Link>
            </div>

            <div className="mb-6 lg:hidden">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                {t.pageTitle}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                {t.pageSubtitle}
              </p>
            </div>

            <div className="rounded-[30px] border border-white/[0.07] bg-white/[0.045] p-5 shadow-[0_25px_90px_rgba(2,8,23,0.32)] backdrop-blur-2xl sm:p-6">
              <div className="space-y-5">
                <div>
                  <label className="mb-3 block text-sm font-semibold text-cyan-100">
                    {t.name}
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder={t.firstName}
                      className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300/35"
                    />
                    <input
                      type="text"
                      value={surname}
                      onChange={(event) => setSurname(event.target.value)}
                      placeholder={t.surname}
                      className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300/35"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-cyan-100">
                    {t.dateOfBirth}
                  </label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <select
                      value={birthDay}
                      onChange={(event) => setBirthDay(event.target.value)}
                      className="w-full rounded-2xl border border-white/[0.07] bg-[#07111f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/35"
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
                      className="w-full rounded-2xl border border-white/[0.07] bg-[#07111f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/35"
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
                      className="w-full rounded-2xl border border-white/[0.07] bg-[#07111f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/35"
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
                  <label className="mb-3 block text-sm font-semibold text-cyan-100">
                    {t.gender}
                  </label>
                  <select
                    value={gender}
                    onChange={(event) => setGender(event.target.value)}
                    className="w-full rounded-2xl border border-white/[0.07] bg-[#07111f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/35"
                  >
                    <option value="">{t.selectGender}</option>
                    <option value="Female">{t.female}</option>
                    <option value="Male">{t.male}</option>
                    <option value="Custom">{t.custom}</option>
                    <option value="Prefer not to say">{t.preferNotToSay}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-cyan-100">
                    {t.emailOrPhone}
                  </label>
                  <input
                    type="email"
                    value={emailOrPhone}
                    onChange={(event) => setEmailOrPhone(event.target.value)}
                    placeholder={t.emailOrPhonePlaceholder}
                    className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300/35"
                  />
                  <p className="mt-3 text-xs leading-6 text-slate-400">
                    {t.contactInfoHelp}
                  </p>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-cyan-100">
                    {t.password}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300/35"
                  />
                </div>

                <div className="space-y-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 text-xs leading-6 text-slate-300">
                  <p>{t.termsTextOne}</p>
                  <p>{t.termsTextTwo}</p>
                </div>

                <button
                  type="button"
                  onClick={handleSignup}
                  disabled={loadingSignup}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:opacity-70"
                >
                  {loadingSignup ? t.creatingAccount : t.submit}
                </button>

                <Link
                  href="/"
                  className="block w-full rounded-2xl border border-white/[0.07] bg-white/[0.035] py-3.5 text-center text-base font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                >
                  {t.alreadyHaveAccount}
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] px-4 py-5 text-center text-xs text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4">
          <Link href="/terms" className="hover:text-slate-300">
            {t.terms}
          </Link>
          <Link href="/privacy-centre" className="hover:text-slate-300">
            {t.privacy}
          </Link>
          <Link href="/cookies" className="hover:text-slate-300">
            {t.cookies}
          </Link>
        </div>
      </footer>
    </div>
  );
}
