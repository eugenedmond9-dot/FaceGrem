"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../components/LanguageProvider";

type VideoRecord = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  video_url: string;
  thumbnail_url: string | null;
  views_count: number | null;
  created_at: string;
};

type ProfileRecord = {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url?: string | null;
};

type NotificationRecord = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  post_id: string | null;
  actor_name: string | null;
  content: string | null;
  is_read: boolean | null;
  created_at: string;
};

type TranslationLanguage = "en" | "sw" | "fr" | "rw";

const languageLabels: Record<TranslationLanguage, string> = {
  en: "English",
  sw: "Swahili",
  fr: "French",
  rw: "Kinyarwanda",
};

const videoTabs = [
  "For You",
  "Following",
  "Creators",
  "Music",
  "Faith",
  "Business",
] as const;

/* Page text now comes from the shared FaceGrem language provider. */

const videoTabLabels: Record<TranslationLanguage, Record<typeof videoTabs[number], string>> = {
  en: { "For You": "For You", Following: "Following", Creators: "Creators", Music: "Music", Faith: "Faith", Business: "Business" },
  sw: { "For You": "Kwa Ajili Yako", Following: "Unaowafuata", Creators: "Wabunifu", Music: "Muziki", Faith: "Imani", Business: "Biashara" },
  fr: { "For You": "Pour vous", Following: "Abonnements", Creators: "Créateurs", Music: "Musique", Faith: "Foi", Business: "Business" },
  rw: { "For You": "Bikubereye", Following: "Ukurikira", Creators: "Abahanzi", Music: "Umuziki", Faith: "Ukwizera", Business: "Ubucuruzi" },
};

export default function VideosPage() {
  const router = useRouter();
  const languageMenuRef = useRef<HTMLDivElement | null>(null);

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");
  const [userAvatar, setUserAvatar] = useState("");
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [activeTab, setActiveTab] =
    useState<(typeof videoTabs)[number]>("For You");

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const { language: selectedLanguage, setLanguage: setSelectedLanguage, t } = useLanguage();

  const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=0f172a&color=ffffff&bold=true`;

  const getProfileById = (profileId?: string) => {
    if (!profileId) return undefined;
    return profiles.find((profile) => profile.id === profileId);
  };

  const getBestNameForUser = (uid?: string) => {
    const profile = getProfileById(uid);
    return profile?.full_name || "FaceGrem User";
  };

  const getBestAvatarForUser = (uid?: string) => {
    const profile = getProfileById(uid);
    return profile?.avatar_url || getAvatarUrl(profile?.full_name || "FaceGrem User");
  };

  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const parsed = new URL(url);

      if (parsed.hostname.includes("youtube.com")) {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }

      if (parsed.hostname.includes("youtu.be")) {
        const id = parsed.pathname.replace("/", "");
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }

      return url;
    } catch {
      return url;
    }
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  useEffect(() => {
    const loadVideosPage = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/");
        return;
      }

      const currentUserId = session.user.id;
      const currentUserName =
        session.user.user_metadata?.full_name || "FaceGrem User";

      setUserId(currentUserId);
      setUserName(currentUserName);

      const [
        { data: profilesData },
        { data: videosData },
        { data: notificationsData },
      ] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, bio, avatar_url"),
        supabase
          .from("videos")
          .select(
            "id, user_id, title, description, category, video_url, thumbnail_url, views_count, created_at"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("notifications")
          .select("id, user_id, actor_id, type, post_id, actor_name, content, is_read, created_at")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false }),
      ]);

      const allProfiles = profilesData || [];
      const myProfile = allProfiles.find((profile) => profile.id === currentUserId);

      setProfiles(allProfiles);
      setVideos(videosData || []);
      setNotifications(notificationsData || []);
      setUserAvatar(
        myProfile?.avatar_url || getAvatarUrl(myProfile?.full_name || currentUserName)
      );
      setLoading(false);
    };

    void loadVideosPage();
  }, [router]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target as Node)
      ) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (language: TranslationLanguage) => {
    setSelectedLanguage(language);
    setIsLanguageMenuOpen(false);
  };

  const handleLogout = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      setSigningOut(false);
      return;
    }

    router.push("/");
  };

  const unreadNotificationsCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const filteredVideos = useMemo(() => {
    let result = [...videos];

    switch (activeTab) {
      case "Following":
        result = result.filter((video) => video.user_id !== userId);
        break;
      case "Creators":
        result = result.filter((video) => {
          const profile = getProfileById(video.user_id);
          return !!profile?.username;
        });
        break;
      case "Music":
        result = result.filter((video) => {
          const text = `${video.title} ${video.description || ""} ${video.category || ""}`.toLowerCase();
          return text.includes("music") || text.includes("song") || text.includes("guitar");
        });
        break;
      case "Faith":
        result = result.filter((video) => {
          const text = `${video.title} ${video.description || ""} ${video.category || ""}`.toLowerCase();
          return (
            text.includes("faith") ||
            text.includes("jesus") ||
            text.includes("church") ||
            text.includes("gospel")
          );
        });
        break;
      case "Business":
        result = result.filter((video) => {
          const text = `${video.title} ${video.description || ""} ${video.category || ""}`.toLowerCase();
          return (
            text.includes("business") ||
            text.includes("money") ||
            text.includes("market") ||
            text.includes("brand")
          );
        });
        break;
      case "For You":
      default:
        break;
    }

    const term = searchText.trim().toLowerCase();
    if (!term) return result;

    return result.filter((video) => {
      const creator = getBestNameForUser(video.user_id).toLowerCase();
      const text = `${video.title} ${video.description || ""} ${video.category || ""} ${creator}`.toLowerCase();
      return text.includes(term);
    });
  }, [activeTab, videos, userId, profiles, searchText]);

  const trendingCreators = useMemo(() => {
    return profiles.filter((profile) => profile.id !== userId).slice(0, 4);
  }, [profiles, userId]);


  const handleUploadVideo = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedCategory = category.trim();
    const trimmedVideoUrl = videoUrl.trim();
    const trimmedThumbnailUrl = thumbnailUrl.trim();

    if (!trimmedTitle || !trimmedVideoUrl) {
      alert("Video title and video URL are required.");
      return;
    }

    setUploading(true);

    const { data, error } = await supabase
      .from("videos")
      .insert([
        {
          user_id: userId,
          title: trimmedTitle,
          description: trimmedDescription || null,
          category: trimmedCategory || null,
          video_url: trimmedVideoUrl,
          thumbnail_url: trimmedThumbnailUrl || null,
          views_count: 0,
        },
      ])
      .select(
        "id, user_id, title, description, category, video_url, thumbnail_url, views_count, created_at"
      );

    if (error) {
      alert(error.message);
      setUploading(false);
      return;
    }

    if (data && data.length > 0) {
      setVideos((prev) => [data[0], ...prev]);
    }

    setTitle("");
    setDescription("");
    setCategory("");
    setVideoUrl("");
    setThumbnailUrl("");
    setShowUploadForm(false);
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817] text-white">
        {t.loadingVideos}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020817] pb-24 text-white xl:pb-0">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_25%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.08),transparent_22%),linear-gradient(to_bottom,#020817,#07111f_45%,#020817)]" />
        <div className="absolute left-0 rounded-full top-10 h-72 w-72 bg-cyan-400/10 blur-3xl" />
        <div className="absolute top-0 right-0 rounded-full h-96 w-96 bg-blue-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#020817]/40 backdrop-blur-3xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-base text-white transition hover:bg-white/[0.06]"
              aria-label="Open menu"
            >
              ☰
            </button>

            <Link href="/feed" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/10 bg-[linear-gradient(145deg,rgba(10,18,34,0.92),rgba(8,15,28,0.72))] font-bold text-[15px] text-cyan-100 shadow-[0_10px_30px_rgba(34,211,238,0.08)] sm:h-11 sm:w-11">
                F
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold tracking-tight text-white">FaceGrem</h1>
                <p className="text-xs text-slate-400">{t.brandTagline}</p>
              </div>
            </Link>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mx-auto max-w-xl">
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 shadow-[0_10px_35px_rgba(15,23,42,0.14)] transition focus-within:border-cyan-400/40 sm:px-4 lg:py-3">
                <span className="text-sm text-slate-400">⌕</span>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={t.searchVideos}
                  className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-400 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowUploadForm((prev) => !prev)}
              className="hidden rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 sm:inline-flex"
            >
              {showUploadForm ? t.close : t.upload}
            </button>

            <div ref={languageMenuRef} className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
                className="inline-flex h-9 items-center rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/[0.06]"
                aria-label="Language"
                title="Language"
              >
                🌐 {languageLabels[selectedLanguage]}
              </button>

              {isLanguageMenuOpen && (
                <div className="absolute right-0 top-11 z-[90] w-44 rounded-2xl border border-white/[0.08] bg-[#07111f]/95 p-2 shadow-2xl backdrop-blur-2xl">
                  {(["en", "sw", "fr", "rw"] as TranslationLanguage[]).map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => handleLanguageChange(language)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                        selectedLanguage === language
                          ? "bg-cyan-400/[0.14] text-cyan-100"
                          : "text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      <span>{languageLabels[language]}</span>
                      {selectedLanguage === language && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Link
                href="/notifications"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-[13px] text-slate-200 transition hover:bg-white/[0.06]"
              >
                🔔
              </Link>

              {unreadNotificationsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-slate-950 shadow-lg">
                  {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                </span>
              )}
            </div>

            <Link
              href="/profile"
              className="hidden items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-2 py-1.5 transition hover:bg-white/[0.06] md:flex md:px-2 md:pr-3"
            >
              <img
                src={userAvatar}
                alt={userName}
                className="h-8 w-8 rounded-xl object-cover ring-1 ring-cyan-400/15"
              />
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-white lg:inline-block">
                {userName}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="hidden rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06] disabled:opacity-70 lg:inline-flex"
            >
              {signingOut ? t.signingOut : t.logout}
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-[70] flex h-full w-[290px] flex-col overflow-y-auto overscroll-contain border-r border-white/10 bg-[#07111f]/90 p-5 backdrop-blur-2xl shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/10 bg-[linear-gradient(145deg,rgba(10,18,34,0.92),rgba(8,15,28,0.72))] font-bold text-cyan-100 shadow-[0_10px_30px_rgba(34,211,238,0.08)]">
                  F
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">FaceGrem</h2>
                  <p className="text-xs text-slate-400">{t.navigation}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-white transition hover:bg-white/[0.08]"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-2">
              <Link href="/feed" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">🏠 {t.homeFeed}</Link>
              <Link href="/videos" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">🎬 {t.videos}</Link>
              <Link href="/communities" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">👥 {t.communities}</Link>
              <Link href="/groups" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">🫂 {t.groups}</Link>
              <Link href="/messages" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">💬 {t.messages}</Link>
              <Link href="/saved" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">🔖 {t.saved}</Link>
              <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">👤 {t.profile}</Link>
            </div>

            <div className="mt-8 border-t border-white/10 pt-5">
              <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                More
              </p>

              <div className="space-y-2">
                <button className="block w-full rounded-2xl px-4 py-3 text-left text-white transition hover:bg-white/[0.08]">
                  ⚙️ {t.settings}
                </button>

                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-2">
                  <button
                    type="button"
                    onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
                    className="block w-full rounded-2xl px-4 py-3 text-left text-white transition hover:bg-white/[0.08]"
                  >
                    🌐 {t.language}: {languageLabels[selectedLanguage]}
                  </button>

                  {isLanguageMenuOpen && (
                    <div className="mt-2 space-y-1 px-2 pb-2">
                      {(["en", "sw", "fr", "rw"] as TranslationLanguage[]).map((language) => (
                        <button
                          key={language}
                          type="button"
                          onClick={() => handleLanguageChange(language)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                            selectedLanguage === language
                              ? "bg-cyan-400/[0.14] text-cyan-100"
                              : "text-white hover:bg-white/[0.06]"
                          }`}
                        >
                          <span>{languageLabels[language]}</span>
                          {selectedLanguage === language && <span>✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button className="block w-full rounded-2xl px-4 py-3 text-left text-white transition hover:bg-white/[0.08]">
                  🔒 {t.privacy}
                </button>
                <button className="block w-full rounded-2xl px-4 py-3 text-left text-white transition hover:bg-white/[0.08]">
                  ❓ {t.help}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={signingOut}
                  className="block w-full rounded-2xl px-4 py-3 text-left text-red-100 transition hover:bg-red-500/10 disabled:opacity-70"
                >
                  ↩️ {signingOut ? t.signingOut : t.logout}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="hidden xl:block">
          <div className="sticky top-[104px] space-y-4">
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(15,23,42,0.94)_45%,rgba(30,41,59,0.94))] p-4 shadow-[0_20px_60px_rgba(6,182,212,0.10)] backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="object-cover h-14 w-14 rounded-2xl ring-2 ring-cyan-400/20"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{userName}</p>
                  <p className="text-sm truncate text-slate-400">{t.creatorDashboard}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">{t.videos}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{videos.length}</p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">{"Tabs"}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{videoTabs.length}</p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">{t.focus}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{activeTab}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-cyan-200">{t.trendingCreators}</p>
              </div>

              <div className="mt-4 space-y-3">
                {trendingCreators.length === 0 ? (
                  <p className="text-sm leading-6 text-slate-400">
                    {"More creators will appear here as your community grows."}
                  </p>
                ) : (
                  trendingCreators.map((profile) => (
                    <Link
                      key={profile.id}
                      href={`/profile?id=${profile.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                    >
                      <img
                        src={
                          profile.avatar_url ||
                          getAvatarUrl(profile.full_name || "FaceGrem User")
                        }
                        alt={profile.full_name}
                        className="object-cover w-10 h-10 rounded-2xl"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{profile.full_name}</p>
                        <p className="text-xs truncate text-slate-400">
                          @{profile.username || t.creator}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-5 sm:space-y-6">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,47,73,0.95),rgba(15,23,42,0.95)_55%,rgba(30,41,59,0.95))] p-6 shadow-[0_30px_120px_rgba(6,182,212,0.10)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-cyan-200">{t.watchNow}</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {"Discover videos that match your world."}
                </h2>
                <p className="max-w-xl mt-3 text-sm leading-7 text-slate-300">
                  {"Explore creators, faith content, music, business clips, and trending stories from across FaceGrem."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:min-w-[320px]">
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">{t.videos}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{videos.length}</p>
                </div>
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">{t.creators}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{profiles.length}</p>
                </div>
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">{"Tab"}</p>
                  <p className="mt-2 text-xl font-bold text-white">{activeTab}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {videoTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {videoTabLabels[selectedLanguage][tab]}
              </button>
            ))}
          </div>

          {showUploadForm && (
            <form
              onSubmit={handleUploadVideo}
              className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.92)_45%,rgba(15,23,42,0.96))] shadow-[0_25px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:rounded-[34px]"
            >
              <div className="px-4 py-4 border-b border-white/10 sm:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-cyan-200">{t.uploadVideo}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {"Publish a new video link to FaceGrem"}
                    </p>
                  </div>

                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">
                    {"Creator tools"}
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.videoTitle}
                    className="w-full px-4 py-3 text-sm text-white transition border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                  />
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder={t.categoryOptional}
                    className="w-full px-4 py-3 text-sm text-white transition border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                  />
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder={t.videoDescription}
                  className="w-full px-4 py-3 mt-4 text-sm text-white transition border outline-none resize-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                />

                <div className="grid gap-4 mt-4 md:grid-cols-2">
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder={"YouTube or video URL"}
                    className="w-full px-4 py-3 text-sm text-white transition border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                  />
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder={"Thumbnail URL (optional)"}
                    className="w-full px-4 py-3 text-sm text-white transition border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                  />
                </div>

                <div className="flex justify-end mt-5">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-6 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
                  >
                    {uploading ? t.uploading : t.publishVideo}
                  </button>
                </div>
              </div>
            </form>
          )}

          {filteredVideos.length === 0 ? (
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
              <p className="text-lg font-medium text-white">{t.noVideos}</p>
              <p className="mt-2 text-sm text-slate-400">
                {t.noVideosSub}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredVideos.map((video) => {
                const creatorProfile = getProfileById(video.user_id);
                const creatorName = getBestNameForUser(video.user_id);
                const creatorAvatar = getBestAvatarForUser(video.user_id);

                return (
                  <article
                    key={video.id}
                    className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <Link
                          href={`/profile?id=${video.user_id}`}
                          className="flex items-center min-w-0 gap-3 hover:opacity-90"
                        >
                          <img
                            src={creatorAvatar}
                            alt={creatorName}
                            className="object-cover w-12 h-12 rounded-2xl ring-1 ring-white/10"
                          />

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-white truncate">{creatorName}</p>

                              {creatorProfile?.username && (
                                <span className="text-sm truncate text-slate-400">
                                  @{creatorProfile.username}
                                </span>
                              )}

                              <span className="hidden w-1 h-1 rounded-full bg-slate-500 sm:block" />

                              <span className="text-xs text-slate-400">
                                {new Date(video.created_at).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                                {video.category || t.video}
                              </span>

                              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-200">
                                {(video.views_count || 0).toLocaleString()} {t.views}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="mt-5">
                        <h3 className="text-2xl font-bold tracking-tight text-white">
                          {video.title}
                        </h3>

                        {video.description && (
                          <p className="mt-3 text-[15px] leading-8 text-slate-200">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-3 pb-3 border-y border-white/10 bg-black/30 sm:px-4 sm:pb-4">
                      <div className="overflow-hidden rounded-[28px]">
                        {isYouTubeUrl(video.video_url) ? (
                          <iframe
                            src={getYouTubeEmbedUrl(video.video_url)}
                            title={`video-${video.id}`}
                            className="h-80 w-full md:h-[480px]"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            controls
                            poster={video.thumbnail_url || undefined}
                            className="h-80 w-full bg-black md:h-[480px]"
                            src={video.video_url}
                          />
                        )}
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="rounded-full bg-white/5 px-3 py-1.5 text-slate-200">
                            {(video.views_count || 0).toLocaleString()} {t.views}
                          </div>

                          <div className="rounded-full bg-white/5 px-3 py-1.5 text-slate-300">
                            {video.category || t.video}
                          </div>
                        </div>

                        <Link
                          href={`/profile?id=${video.user_id}`}
                          className="text-sm font-medium transition text-cyan-300 hover:text-cyan-200"
                        >
                          {"View creator"}
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-5 xl:space-y-5">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">{t.creatorSpotlight}</p>
                <p className="mt-1 text-xs text-slate-400">{"Discover people to follow"}</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {trendingCreators.length === 0 ? (
                <p className="text-sm text-slate-400">{"No creators to show yet."}</p>
              ) : (
                trendingCreators.map((profile) => (
                  <Link
                    key={profile.id}
                    href={`/profile?id=${profile.id}`}
                    className="flex items-center gap-3 p-4 transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    <img
                      src={
                        profile.avatar_url ||
                        getAvatarUrl(profile.full_name || "FaceGrem User")
                      }
                      alt={profile.full_name}
                      className="object-cover w-12 h-12 rounded-2xl"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{profile.full_name}</p>
                      <p className="text-xs truncate text-slate-400">
                        @{profile.username || t.creator}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">{"Quick links"}</p>
                <p className="mt-1 text-xs text-slate-400">{t.brandTagline}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <Link
                href="/feed"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                {t.homeFeed}
              </Link>
              <Link
                href="/communities"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                {t.communities}
              </Link>
              <Link
                href="/messages"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                {t.messages}
              </Link>
              <Link
                href="/profile"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                {t.profile}
              </Link>
            </div>
          </div>
        </aside>
      </main>

    </div>
  );
}