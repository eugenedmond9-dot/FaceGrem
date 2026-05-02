"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../components/LanguageProvider";
import NotificationDropdown from "../../components/NotificationDropdown";
import FaceGremLogo from "../../components/FaceGremLogo";
import { CommunityCircleIcon, FriendsFistIcon, GroupPeopleIcon, MessageBubblesIcon, TranslateLanguageIcon } from "../../components/FaceGremCustomIcons";
import FaceGremHamburgerMenu from "../../components/FaceGremHamburgerMenu";

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
  const [videoVisibility, setVideoVisibility] = useState<"public" | "followers" | "private">("public");

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
    setVideoVisibility("public");
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
    <div className="min-h-screen bg-[#f0f2f5] pb-24 text-[#050505] xl:pb-0">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
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
              markClassName="h-10 w-10 rounded-2xl ring-0 shadow-sm sm:h-11 sm:w-11"
            />

            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight text-slate-950">FaceGrem</h1>
              <p className="text-xs text-slate-500">{t.videos}</p>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mx-auto max-w-xl">
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 shadow-sm transition focus-within:border-blue-300 focus-within:bg-white">
                <span className="text-sm text-slate-500">🔎</span>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={t.searchVideos}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowUploadForm((prev) => !prev)}
              className="hidden rounded-full bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 sm:inline-flex"
            >
              {showUploadForm ? t.close : t.upload}
            </button>

            <div ref={languageMenuRef} className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
                className="inline-flex h-10 items-center rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-200"
                aria-label="Language"
                title="Language"
              >
                <TranslateLanguageIcon className="mr-2 h-4 w-4" /> {languageLabels[selectedLanguage]}
              </button>

              {isLanguageMenuOpen && (
                <div className="absolute right-0 top-12 z-[90] w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                  {(["en", "sw", "fr", "rw"] as TranslationLanguage[]).map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => handleLanguageChange(language)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                        selectedLanguage === language
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>{languageLabels[language]}</span>
                      {selectedLanguage === language && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <NotificationDropdown
              iconClassName="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[13px] text-slate-700 shadow-sm transition hover:bg-slate-200"
            />

            <Link
              href="/profile"
              className="hidden items-center gap-2 rounded-full bg-slate-100 px-2 py-1.5 transition hover:bg-slate-200 md:flex md:px-2 md:pr-3"
            >
              <img
                src={userAvatar}
                alt={userName}
                className="h-8 w-8 rounded-full object-cover"
              />
              <span className="hidden max-w-[120px] truncate text-sm font-semibold text-slate-700 lg:inline-block">
                {userName}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <FaceGremHamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        userName={userName}
        userAvatar={userAvatar}
        onLogout={handleLogout}
        notificationCount={unreadNotificationsCount}
      />

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:py-8 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <aside className="hidden xl:block">
          <div className="sticky top-[96px] space-y-4">
            <section className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="h-14 w-14 rounded-2xl object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-950">{userName}</p>
                  <p className="truncate text-sm text-slate-500">{t.creator}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-blue-50 px-3 py-3 text-center">
                  <p className="text-[11px] font-semibold text-blue-600">{t.videos}</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{videos.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
                  <p className="text-[11px] font-semibold text-slate-500">{t.creators}</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{profiles.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
                  <p className="text-[11px] font-semibold text-slate-500">{t.focus}</p>
                  <p className="mt-1 truncate text-sm font-black text-slate-950">{activeTab}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-950">{t.trendingCreators}</p>
              </div>

              <div className="mt-4 space-y-3">
                {trendingCreators.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                    More creators will appear here as your community grows.
                  </p>
                ) : (
                  trendingCreators.map((profile) => (
                    <Link
                      key={profile.id}
                      href={`/profile?id=${profile.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50"
                    >
                      <img
                        src={
                          profile.avatar_url ||
                          getAvatarUrl(profile.full_name || "FaceGrem User")
                        }
                        alt={profile.full_name}
                        className="h-10 w-10 rounded-2xl object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950">{profile.full_name}</p>
                        <p className="truncate text-xs text-slate-500">
                          @{profile.username || t.creator}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-[34px] bg-white shadow-sm ring-1 ring-slate-200">
            <div className="grid gap-6 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                  {t.watchNow}
                </p>
                <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Discover videos that match your world.
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                  Explore creators, faith content, music, business clips, and trending stories from across FaceGrem.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white">
                    Public video visibility
                  </span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                    Creator-first layout
                  </span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                    Clean video cards
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[24px] bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-semibold text-slate-500">{t.videos}</p>
                  <p className="mt-2 text-3xl font-black text-blue-600">{videos.length}</p>
                </div>
                <div className="rounded-[24px] bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-semibold text-slate-500">{t.creators}</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{profiles.length}</p>
                </div>
                <div className="rounded-[24px] bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-semibold text-slate-500">Tab</p>
                  <p className="mt-2 truncate text-xl font-black text-slate-950">{activeTab}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 rounded-[26px] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {videoTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    activeTab === tab
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {videoTabLabels[selectedLanguage][tab]}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowUploadForm((prev) => !prev)}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              {showUploadForm ? t.close : t.uploadVideo}
            </button>
          </div>

          {showUploadForm && (
            <form
              onSubmit={handleUploadVideo}
              className="overflow-hidden rounded-[30px] bg-white shadow-sm ring-1 ring-slate-200"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-blue-600">{t.uploadVideo}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Publish a new video link to FaceGrem.
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
                    Creator tools
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Video title
                    </span>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t.videoTitle}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Category
                    </span>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder={t.categoryOptional}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Visibility
                  </span>
                  <div className="mt-2 grid gap-3 md:grid-cols-3">
                    {(["public", "followers", "private"] as const).map((visibility) => (
                      <button
                        key={visibility}
                        type="button"
                        onClick={() => setVideoVisibility(visibility)}
                        className={`rounded-2xl border px-4 py-4 text-left transition ${
                          videoVisibility === visibility
                            ? "border-blue-300 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <p className="font-bold capitalize">{visibility}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {visibility === "public"
                            ? "Anyone signed in can discover this video."
                            : visibility === "followers"
                              ? "Followers visibility UI is ready; database support can be added next."
                              : "Private visibility UI is ready; database support can be added next."}
                        </p>
                      </button>
                    ))}
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Description
                  </span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder={t.videoDescription}
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Video URL
                    </span>
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="YouTube or video URL"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Thumbnail URL
                    </span>
                    <input
                      type="text"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="Thumbnail URL (optional)"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white"
                    />
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-70"
                  >
                    {uploading ? t.uploading : t.publishVideo}
                  </button>
                </div>
              </div>
            </form>
          )}

          {filteredVideos.length === 0 ? (
            <div className="rounded-[30px] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-lg font-bold text-slate-950">{t.noVideos}</p>
              <p className="mt-2 text-sm text-slate-500">{t.noVideosSub}</p>
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
                    className="overflow-hidden rounded-[34px] bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <Link
                          href={`/profile?id=${video.user_id}`}
                          className="flex min-w-0 items-center gap-3 hover:opacity-90"
                        >
                          <img
                            src={creatorAvatar}
                            alt={creatorName}
                            className="h-12 w-12 rounded-2xl object-cover"
                          />

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-bold text-slate-950">{creatorName}</p>

                              {creatorProfile?.username && (
                                <span className="truncate text-sm text-slate-500">
                                  @{creatorProfile.username}
                                </span>
                              )}

                              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

                              <span className="text-xs text-slate-500">
                                {new Date(video.created_at).toLocaleString()}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">
                                {video.category || t.video}
                              </span>

                              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                                {(video.views_count || 0).toLocaleString()} {t.views}
                              </span>

                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                                Public
                              </span>
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="mt-5">
                        <h3 className="text-2xl font-black tracking-tight text-slate-950">
                          {video.title}
                        </h3>

                        {video.description && (
                          <p className="mt-3 text-[15px] leading-8 text-slate-600">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="border-y border-slate-200 bg-slate-950 px-3 pb-3 sm:px-4 sm:pb-4">
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
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-600">
                            {(video.views_count || 0).toLocaleString()} {t.views}
                          </div>

                          <div className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-600">
                            {video.category || t.video}
                          </div>
                        </div>

                        <Link
                          href={`/profile?id=${video.user_id}`}
                          className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          View creator
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div>
              <p className="text-sm font-bold text-slate-950">{t.creatorSpotlight}</p>
              <p className="mt-1 text-xs text-slate-500">Discover people to follow</p>
            </div>

            <div className="mt-4 space-y-3">
              {trendingCreators.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  No creators to show yet.
                </p>
              ) : (
                trendingCreators.map((profile) => (
                  <Link
                    key={profile.id}
                    href={`/profile?id=${profile.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
                  >
                    <img
                      src={
                        profile.avatar_url ||
                        getAvatarUrl(profile.full_name || "FaceGrem User")
                      }
                      alt={profile.full_name}
                      className="h-12 w-12 rounded-2xl object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-950">{profile.full_name}</p>
                      <p className="truncate text-xs text-slate-500">
                        @{profile.username || t.creator}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div>
              <p className="text-sm font-bold text-slate-950">Quick links</p>
              <p className="mt-1 text-xs text-slate-500">{t.brandTagline}</p>
            </div>

            <div className="mt-4 space-y-3">
              <Link
                href="/feed"
                className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm">⌂</span>
                {t.homeFeed}
              </Link>
              <Link
                href="/communities"
                className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <CommunityCircleIcon className="h-5 w-5 text-blue-600" />
                {t.communities}
              </Link>
              <Link
                href="/messages"
                className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <MessageBubblesIcon className="h-5 w-5 text-blue-600" />
                {t.messages}
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <FriendsFistIcon className="h-5 w-5 text-blue-600" />
                {t.profile}
              </Link>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
