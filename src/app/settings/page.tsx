"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../components/LanguageProvider";
import { supabase } from "../../lib/supabase";
import FaceGremLogo from "../../components/FaceGremLogo";
import FaceGremHamburgerMenu from "../../components/FaceGremHamburgerMenu";

type PreferenceKey =
  | "emailAlerts"
  | "messageAlerts"
  | "callAlerts"
  | "commentAlerts"
  | "followAlerts"
  | "likeAlerts"
  | "compactMode"
  | "reduceMotion"
  | "privateProfile"
  | "showOnlineStatus"
  | "readReceipts"
  | "autoPlayVideos"
  | "dataSaver"
  | "safeMedia"
  | "soundEffects";

type PreferenceState = Record<PreferenceKey, boolean>;

type ProfileSummary = {
  fullName: string;
  username: string;
  avatarUrl: string;
  email: string;
};

const defaultPreferences: PreferenceState = {
  emailAlerts: true,
  messageAlerts: true,
  callAlerts: true,
  commentAlerts: true,
  followAlerts: true,
  likeAlerts: true,
  compactMode: false,
  reduceMotion: false,
  privateProfile: false,
  showOnlineStatus: true,
  readReceipts: true,
  autoPlayVideos: true,
  dataSaver: false,
  safeMedia: true,
  soundEffects: true,
};

const preferenceStorageKey = "facegrem_settings_preferences_v2";

export default function SettingsPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  const [preferences, setPreferences] = useState<PreferenceState>(defaultPreferences);
  const [savingPreference, setSavingPreference] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileSummary, setProfileSummary] = useState<ProfileSummary>({
    fullName: "FaceGrem User",
    username: "",
    avatarUrl: "",
    email: "",
  });

  const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=0f172a&color=ffffff&bold=true`;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedPreferences = window.localStorage.getItem(preferenceStorageKey);

    if (!savedPreferences) return;

    try {
      const parsed = JSON.parse(savedPreferences) as Partial<PreferenceState>;
      setPreferences((prev) => ({ ...prev, ...parsed }));
    } catch {
      setPreferences(defaultPreferences);
    }
  }, []);

  useEffect(() => {
    const loadProfileSummary = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const fallbackName =
        session.user.user_metadata?.full_name || session.user.email || "FaceGrem User";

      const { data } = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url")
        .eq("id", session.user.id)
        .maybeSingle();

      setProfileSummary({
        fullName: data?.full_name || fallbackName,
        username: data?.username || "",
        avatarUrl: data?.avatar_url || session.user.user_metadata?.avatar_url || "",
        email: session.user.email || "",
      });
    };

    void loadProfileSummary();
  }, []);

  const savePreferences = (nextPreferences: PreferenceState) => {
    setPreferences(nextPreferences);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(preferenceStorageKey, JSON.stringify(nextPreferences));
    }
  };

  const togglePreference = (key: PreferenceKey) => {
    setSavingPreference(key);

    const nextPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };

    savePreferences(nextPreferences);

    window.setTimeout(() => {
      setSavingPreference("");
    }, 350);
  };

  const resetPreferences = () => {
    savePreferences(defaultPreferences);
    setSavingPreference("reset");
    window.setTimeout(() => setSavingPreference(""), 500);
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    setLoggingOut(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/");
  };

  const enabledPreferenceCount = useMemo(
    () => Object.values(preferences).filter(Boolean).length,
    [preferences]
  );

  const accountCards = [
    {
      icon: "👤",
      title: t.profile,
      text: "Edit your profile photo, display name, username, bio, and public identity.",
      href: "/profile",
      action: t.openProfile,
    },
    {
      icon: "💬",
      title: t.messages,
      text: "Manage conversations, calls, voice messages, and chat activity.",
      href: "/messages",
      action: t.open,
    },
    {
      icon: "🔖",
      title: t.savedPosts,
      text: "Review posts, videos, and moments you saved for later.",
      href: "/saved",
      action: t.open,
    },
    {
      icon: "🔔",
      title: t.notifications,
      text: "Open your notification centre and review recent activity.",
      href: "/notifications",
      action: t.open,
    },
  ];

  const notificationItems: {
    key: PreferenceKey;
    icon: string;
    title: string;
    text: string;
  }[] = [
    {
      key: "messageAlerts",
      icon: "💬",
      title: "Message alerts",
      text: "Show alerts when someone sends you a new message.",
    },
    {
      key: "callAlerts",
      icon: "📞",
      title: "Call alerts",
      text: "Show incoming audio and video call notifications.",
    },
    {
      key: "commentAlerts",
      icon: "💭",
      title: "Comment alerts",
      text: "Notify you when people comment on your posts.",
    },
    {
      key: "followAlerts",
      icon: "👤",
      title: "Follow alerts",
      text: "Notify you when someone follows your profile.",
    },
    {
      key: "likeAlerts",
      icon: "❤️",
      title: "Like alerts",
      text: "Notify you when someone likes your posts.",
    },
    {
      key: "emailAlerts",
      icon: "✉️",
      title: "Email alerts",
      text: "Allow important account and activity emails.",
    },
  ];

  const privacyItems: {
    key: PreferenceKey;
    icon: string;
    title: string;
    text: string;
  }[] = [
    {
      key: "privateProfile",
      icon: "🛡️",
      title: "Private profile request",
      text: "Prepare your account for future private-profile controls.",
    },
    {
      key: "showOnlineStatus",
      icon: "🟢",
      title: "Show online status",
      text: "Let people know when you are active on FaceGrem.",
    },
    {
      key: "readReceipts",
      icon: "✓✓",
      title: "Read receipts",
      text: "Allow chats to show when messages have been seen.",
    },
    {
      key: "safeMedia",
      icon: "🧯",
      title: "Safe media mode",
      text: "Use safer defaults for media previews and uploads.",
    },
  ];

  const experienceItems: {
    key: PreferenceKey;
    icon: string;
    title: string;
    text: string;
  }[] = [
    {
      key: "compactMode",
      icon: "📱",
      title: "Compact mobile layout",
      text: "Use tighter spacing for phone screens where supported.",
    },
    {
      key: "reduceMotion",
      icon: "🧘",
      title: "Reduce motion",
      text: "Reduce heavy animations and background movement where supported.",
    },
    {
      key: "autoPlayVideos",
      icon: "▶️",
      title: "Autoplay videos",
      text: "Allow videos to play automatically where supported.",
    },
    {
      key: "dataSaver",
      icon: "📶",
      title: "Data saver",
      text: "Reduce automatic media loading on slower or mobile networks.",
    },
    {
      key: "soundEffects",
      icon: "🔊",
      title: "Sound effects",
      text: "Allow small sounds for messages, calls, and actions.",
    },
  ];

  const supportCards = [
    {
      icon: "🔒",
      title: t.privacy,
      text: "Review privacy information, account controls, and safety guidance.",
      href: "/privacy-centre",
    },
    {
      icon: "📄",
      title: "Terms",
      text: "Read FaceGrem rules, responsibilities, and platform terms.",
      href: "/terms",
    },
    {
      icon: "🍪",
      title: "Cookies",
      text: "Learn how cookies may support sign-in, sessions, and performance.",
      href: "/cookies",
    },
    {
      icon: "❓",
      title: t.help,
      text: "Help and support tools will be expanded here soon.",
      href: "/help",
    },
  ];

  const renderToggleRow = (item: {
    key: PreferenceKey;
    icon: string;
    title: string;
    text: string;
  }) => {
    const isEnabled = preferences[item.key];

    return (
      <div
        key={item.key}
        className="flex items-center justify-between gap-4 px-3 py-4"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            {item.icon}
          </div>

          <div className="min-w-0">
            <p className="font-medium text-[#050505]">{item.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
            {savingPreference === item.key && (
              <p className="mt-1 text-xs text-blue-600">Saved</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => togglePreference(item.key)}
          className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
            isEnabled
              ? "border-cyan-300/30 bg-cyan-400/40"
              : "border-slate-200 bg-white/[0.06]"
          }`}
          aria-pressed={isEnabled}
          aria-label={item.title}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-lg transition ${
              isEnabled ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-[#050505]">
      <FaceGremHamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        userName={profileSummary.fullName}
        userAvatar={profileSummary.avatarUrl}
        onLogout={handleLogout}
      />

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
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
              href="/feed"
              showWordmark={false}
              markClassName="h-10 w-10 rounded-2xl ring-0 shadow-sm"
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">FaceGrem</h1>
              <p className="text-xs text-slate-500">{t.settings}</p>
            </div>
          </div>

          <Link
            href="/feed"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {t.homeFeed}
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm backdrop-blur-xl">
          <div className="border-b border-slate-200 bg-white p-6 sm:p-8">
            <Link
              href="/feed"
              className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl text-slate-700 transition hover:bg-slate-100"
              aria-label={t.homeFeed}
            >
              ‹
            </Link>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <p className="text-sm font-semibold text-blue-600">FaceGrem control center</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                  {t.settings}
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">
                  Manage your account, privacy, notifications, layout preferences, safety controls, and important FaceGrem links from one professional control panel.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={profileSummary.avatarUrl || getAvatarUrl(profileSummary.fullName)}
                    alt={profileSummary.fullName}
                    className="h-14 w-14 rounded-2xl object-cover ring-1 ring-cyan-300/20"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {profileSummary.fullName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {profileSummary.username
                        ? `@${profileSummary.username}`
                        : profileSummary.email || "FaceGrem account"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-white p-3 text-center">
                    <p className="text-xl">🔔</p>
                    <p className="mt-1 text-[11px] text-slate-500">Alerts</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 text-center">
                    <p className="text-xl">🌐</p>
                    <p className="mt-1 text-[11px] text-slate-500">Global</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 text-center">
                    <p className="text-xl">{enabledPreferenceCount}</p>
                    <p className="mt-1 text-[11px] text-slate-500">Enabled</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-8 xl:grid-cols-[minmax(0,1fr)_370px]">
            <section className="space-y-6">
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-600">Account shortcuts</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Open the main places connected to your account.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {accountCards.map((card) => (
                    <Link
                      key={card.title}
                      href={card.href}
                      className="group rounded-[28px] border border-slate-200 bg-white p-5 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl">
                          {card.icon}
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {card.title}
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            {card.text}
                          </p>
                          <span className="mt-4 inline-flex text-sm font-semibold text-blue-600 transition group-hover:text-blue-700">
                            {card.action} →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <p className="text-sm font-semibold text-blue-600">Notification preferences</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Choose what should get your attention.
                  </p>
                </div>

                <div className="rounded-[30px] border border-slate-200 bg-white/[0.025] p-3">
                  <div className="divide-y divide-slate-100">
                    {notificationItems.map(renderToggleRow)}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <p className="text-sm font-semibold text-blue-600">Privacy & safety</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Control your visibility and safety defaults.
                  </p>
                </div>

                <div className="rounded-[30px] border border-slate-200 bg-white/[0.025] p-3">
                  <div className="divide-y divide-slate-100">
                    {privacyItems.map(renderToggleRow)}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <p className="text-sm font-semibold text-blue-600">App experience</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Tune the way FaceGrem feels on phone and desktop.
                  </p>
                </div>

                <div className="rounded-[30px] border border-slate-200 bg-white/[0.025] p-3">
                  <div className="divide-y divide-slate-100">
                    {experienceItems.map(renderToggleRow)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetPreferences}
                  className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  {savingPreference === "reset" ? "Reset saved" : "Reset preferences"}
                </button>
              </div>
            </section>

            <aside className="space-y-5">
              <section className="rounded-[30px] border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-blue-600">Privacy & support</p>
                <div className="mt-4 space-y-3">
                  {supportCards.map((card) => (
                    <Link
                      key={card.title}
                      href={card.href}
                      className="block rounded-2xl border border-slate-200 bg-white/[0.03] p-4 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{card.icon}</span>
                        <div>
                          <p className="font-medium text-[#050505]">{card.title}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {card.text}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="rounded-[30px] border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-blue-600">Data & device</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  <div className="rounded-2xl border border-slate-200 bg-white/[0.03] p-4">
                    <p className="font-medium text-[#050505]">Stored locally</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      These preference switches are saved in this browser for now.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/[0.03] p-4">
                    <p className="font-medium text-[#050505]">Future database sync</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Later, these controls can be connected to a Supabase user_settings table.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[30px] border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-blue-600">Session</p>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Sign out of this device when you are done using FaceGrem.
                </p>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-5 w-full rounded-2xl border border-red-200 bg-red-400/[0.07] px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-400/[0.11] disabled:opacity-70"
                >
                  {loggingOut ? "Signing out..." : `↩️ ${t.logout}`}
                </button>
              </section>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
