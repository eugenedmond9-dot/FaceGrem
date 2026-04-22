"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import MobileBottomNav from "../../components/MobileBottomNav";

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

const videoTabs = [
  "For You",
  "Following",
  "Creators",
  "Music",
  "Faith",
  "Business",
] as const;

export default function VideosPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");
  const [userAvatar, setUserAvatar] = useState("");
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);

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

      const [{ data: profilesData }, { data: videosData }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, bio, avatar_url"),
        supabase
          .from("videos")
          .select(
            "id, user_id, title, description, category, video_url, thumbnail_url, views_count, created_at"
          )
          .order("created_at", { ascending: false }),
      ]);

      const allProfiles = profilesData || [];
      const myProfile = allProfiles.find((profile) => profile.id === currentUserId);

      setProfiles(allProfiles);
      setVideos(videosData || []);
      setUserAvatar(
        myProfile?.avatar_url || getAvatarUrl(myProfile?.full_name || currentUserName)
      );
      setLoading(false);
    };

    void loadVideosPage();
  }, [router]);

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

  const trendingCategories = useMemo(() => {
    return [
      { name: "Music", pulse: "18k" },
      { name: "Faith", pulse: "12k" },
      { name: "Business", pulse: "9k" },
      { name: "Creators", pulse: "15k" },
    ];
  }, []);

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
        Loading videos...
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

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020817]/75 backdrop-blur-2xl">
        <div className="flex items-center gap-3 px-4 py-4 mx-auto max-w-7xl sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/feed" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 font-bold text-white shadow-[0_12px_40px_rgba(34,211,238,0.28)] sm:h-12 sm:w-12">
                F
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold tracking-tight text-white">FaceGrem</h1>
                <p className="text-xs text-slate-400">Video world</p>
              </div>
            </Link>
          </div>

          <div className="flex-1 hidden lg:block">
            <div className="max-w-xl mx-auto">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_10px_35px_rgba(15,23,42,0.18)] transition focus-within:border-cyan-400/40">
                <span className="text-sm text-slate-400">⌕</span>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search videos, creators, categories..."
                  className="w-full text-sm text-white bg-transparent outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setShowUploadForm((prev) => !prev)}
              className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
            >
              {showUploadForm ? "Close" : "Upload"}
            </button>

            <Link
              href="/feed"
              className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 md:inline-flex"
            >
              Feed
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-2 px-2 py-2 transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 sm:px-2 sm:pr-3"
            >
              <img
                src={userAvatar}
                alt={userName}
                className="object-cover h-9 w-9 rounded-xl ring-1 ring-cyan-400/20"
              />
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-white lg:inline-block">
                {userName}
              </span>
            </Link>
          </div>
        </div>

        <div className="px-4 pb-4 sm:px-6 lg:hidden">
          <div className="mx-auto space-y-3 max-w-7xl">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_10px_35px_rgba(15,23,42,0.18)] transition focus-within:border-cyan-400/40">
              <span className="text-sm text-slate-400">⌕</span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search videos..."
                className="w-full text-sm text-white bg-transparent outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Link
                href="/feed"
                className="px-3 py-3 text-xs font-medium text-center text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Feed
              </Link>
              <Link
                href="/videos"
                className="px-3 py-3 text-xs font-medium text-center text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Videos
              </Link>
              <Link
                href="/communities"
                className="px-3 py-3 text-xs font-medium text-center text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Groups
              </Link>
              <Link
                href="/messages"
                className="px-3 py-3 text-xs font-medium text-center text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Chat
              </Link>
            </div>
          </div>
        </div>
      </header>

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
                  <p className="text-sm truncate text-slate-400">Creator dashboard</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">Videos</p>
                  <p className="mt-1 text-sm font-semibold text-white">{videos.length}</p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">Tabs</p>
                  <p className="mt-1 text-sm font-semibold text-white">{videoTabs.length}</p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">Focus</p>
                  <p className="mt-1 text-sm font-semibold text-white">{activeTab}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
              <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                Navigate
              </p>

              <div className="space-y-1.5">
                <Link
                  href="/feed"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">🏠</span>
                    Home feed
                  </span>
                  <span className="text-slate-500">→</span>
                </Link>

                <Link
                  href="/videos"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">🎬</span>
                    Video hub
                  </span>
                  <span className="text-slate-500">→</span>
                </Link>

                <Link
                  href="/communities"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">👥</span>
                    Communities
                  </span>
                  <span className="text-slate-500">→</span>
                </Link>

                <Link
                  href="/messages"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">💬</span>
                    Messages
                  </span>
                  <span className="text-slate-500">→</span>
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">👤</span>
                    Your profile
                  </span>
                  <span className="text-slate-500">→</span>
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-cyan-200">Trending creators</p>
              </div>

              <div className="mt-4 space-y-3">
                {trendingCreators.length === 0 ? (
                  <p className="text-sm leading-6 text-slate-400">
                    More creators will appear here as your community grows.
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
                          @{profile.username || "creator"}
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
                <p className="text-sm font-semibold text-cyan-200">Watch now</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Discover videos that match your world.
                </h2>
                <p className="max-w-xl mt-3 text-sm leading-7 text-slate-300">
                  Explore creators, faith content, music, business clips, and trending
                  stories from across FaceGrem.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:min-w-[320px]">
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">Videos</p>
                  <p className="mt-2 text-2xl font-bold text-white">{videos.length}</p>
                </div>
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">Creators</p>
                  <p className="mt-2 text-2xl font-bold text-white">{profiles.length}</p>
                </div>
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">Tab</p>
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
                {tab}
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
                    <p className="text-sm font-semibold text-cyan-200">Upload video</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Publish a new video link to FaceGrem
                    </p>
                  </div>

                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">
                    Creator tools
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Video title"
                    className="w-full px-4 py-3 text-sm text-white transition border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                  />
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Category (optional)"
                    className="w-full px-4 py-3 text-sm text-white transition border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                  />
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Video description"
                  className="w-full px-4 py-3 mt-4 text-sm text-white transition border outline-none resize-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                />

                <div className="grid gap-4 mt-4 md:grid-cols-2">
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="YouTube or video URL"
                    className="w-full px-4 py-3 text-sm text-white transition border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                  />
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="Thumbnail URL (optional)"
                    className="w-full px-4 py-3 text-sm text-white transition border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                  />
                </div>

                <div className="flex justify-end mt-5">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-6 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
                  >
                    {uploading ? "Uploading..." : "Publish video"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {filteredVideos.length === 0 ? (
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
              <p className="text-lg font-medium text-white">No videos found here yet.</p>
              <p className="mt-2 text-sm text-slate-400">
                Try another tab or upload the first video.
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
                                {video.category || "Video"}
                              </span>

                              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-200">
                                {(video.views_count || 0).toLocaleString()} views
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
                            {(video.views_count || 0).toLocaleString()} views
                          </div>

                          <div className="rounded-full bg-white/5 px-3 py-1.5 text-slate-300">
                            {video.category || "Video"}
                          </div>
                        </div>

                        <Link
                          href={`/profile?id=${video.user_id}`}
                          className="text-sm font-medium transition text-cyan-300 hover:text-cyan-200"
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

        <aside className="space-y-5 xl:space-y-5">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">Trending categories</p>
                <p className="mt-1 text-xs text-slate-400">What people are watching</p>
              </div>
              <span className="text-xs text-slate-400">Live</span>
            </div>

            <div className="mt-4 space-y-3">
              {trendingCategories.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-4 py-3 border rounded-2xl border-white/10 bg-white/5"
                >
                  <div>
                    <p className="text-[11px] text-slate-400">#{index + 1} trending</p>
                    <p className="mt-1 font-medium text-white">{item.name}</p>
                  </div>
                  <span className="px-3 py-1 text-xs rounded-full bg-cyan-500/10 text-cyan-200">
                    {item.pulse}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">Creator spotlight</p>
                <p className="mt-1 text-xs text-slate-400">Discover people to follow</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {trendingCreators.length === 0 ? (
                <p className="text-sm text-slate-400">No creators to show yet.</p>
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
                        @{profile.username || "creator"}
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
                <p className="text-sm font-semibold text-cyan-200">Quick links</p>
                <p className="mt-1 text-xs text-slate-400">Move around FaceGrem fast</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <Link
                href="/feed"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Back to feed
              </Link>
              <Link
                href="/communities"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Explore communities
              </Link>
              <Link
                href="/messages"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Open messages
              </Link>
              <Link
                href="/profile"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Visit profile
              </Link>
            </div>
          </div>
        </aside>
      </main>

      <MobileBottomNav />
    </div>
  );
}