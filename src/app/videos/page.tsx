"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

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

const videoTabs = ["For You", "Following", "Creators", "Music", "Faith", "Business"] as const;

export default function VideosPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] =
    useState<(typeof videoTabs)[number]>("For You");

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
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

      setProfiles(profilesData || []);
      setVideos(videosData || []);
      setLoading(false);
    };

    void loadVideosPage();
  }, [router]);

  const filteredVideos = useMemo(() => {
    switch (activeTab) {
      case "Following":
        return videos.filter((video) => video.user_id !== userId);
      case "Creators":
        return videos.filter((video) => {
          const profile = getProfileById(video.user_id);
          return !!profile?.username;
        });
      case "Music":
        return videos.filter((video) => {
          const text = `${video.title} ${video.description || ""} ${video.category || ""}`.toLowerCase();
          return text.includes("music") || text.includes("song") || text.includes("guitar");
        });
      case "Faith":
        return videos.filter((video) => {
          const text = `${video.title} ${video.description || ""} ${video.category || ""}`.toLowerCase();
          return text.includes("faith") || text.includes("jesus") || text.includes("church") || text.includes("gospel");
        });
      case "Business":
        return videos.filter((video) => {
          const text = `${video.title} ${video.description || ""} ${video.category || ""}`.toLowerCase();
          return text.includes("business") || text.includes("money") || text.includes("market") || text.includes("brand");
        });
      case "For You":
      default:
        return videos;
    }
  }, [activeTab, videos, userId, profiles]);

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
      <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        Loading videos...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111f]/85 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 px-4 py-4 mx-auto max-w-7xl sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center font-bold shadow-lg h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/20">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FaceGrem</h1>
              <p className="text-xs text-slate-400">Videos</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUploadForm((prev) => !prev)}
              className="px-4 py-2 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20"
            >
              {showUploadForm ? "Close" : "Upload video"}
            </button>

            <Link
              href="/feed"
              className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Back to Feed
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 mx-auto max-w-7xl sm:px-6">
        <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_30%),linear-gradient(to_bottom_right,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 backdrop-blur-xl">
          <p className="text-sm font-medium text-cyan-200">Watch & create</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Share videos and discover what people are watching.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Upload your links, explore trending clips, and follow creators on FaceGrem.
          </p>
        </section>

        <div className="flex flex-wrap gap-3 mt-6">
          {videoTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white"
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
            className="mt-6 rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
          >
            <p className="text-sm font-medium text-cyan-200">Upload a new video</p>

            <div className="grid gap-4 mt-4 md:grid-cols-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Video title"
                className="w-full px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
              />
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category (optional)"
                className="w-full px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
              />
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Video description"
              className="w-full px-4 py-3 mt-4 text-sm text-white border outline-none resize-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
            />

            <div className="grid gap-4 mt-4 md:grid-cols-2">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="YouTube or video URL"
                className="w-full px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
              />
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="Thumbnail URL (optional)"
                className="w-full px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
              />
            </div>

            <div className="flex justify-end mt-5">
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-3 text-sm font-semibold text-white rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 disabled:opacity-70"
              >
                {uploading ? "Uploading..." : "Publish video"}
              </button>
            </div>
          </form>
        )}

        <section className="grid gap-6 mt-6 lg:grid-cols-2">
          {filteredVideos.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-slate-300">
              No videos found in this section yet.
            </div>
          ) : (
            filteredVideos.map((video) => {
              const creatorName = getBestNameForUser(video.user_id);
              const creatorAvatar = getBestAvatarForUser(video.user_id);

              return (
                <article
                  key={video.id}
                  className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      href={`/profile?id=${video.user_id}`}
                      className="flex items-center gap-3 hover:opacity-90"
                    >
                      <img
                        src={creatorAvatar}
                        alt={creatorName}
                        className="object-cover w-12 h-12 rounded-2xl"
                      />
                      <div>
                        <p className="font-semibold text-white">{creatorName}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(video.created_at).toLocaleString()}
                        </p>
                      </div>
                    </Link>

                    <span className="px-3 py-1 text-xs border rounded-full border-white/10 bg-white/5 text-slate-300">
                      {video.category || "Video"}
                    </span>
                  </div>

                  <h3 className="mt-4 text-2xl font-bold tracking-tight text-white">
                    {video.title}
                  </h3>

                  {video.description && (
                    <p className="mt-3 text-sm leading-7 text-slate-200">
                      {video.description}
                    </p>
                  )}

                  <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-black/30">
                    {isYouTubeUrl(video.video_url) ? (
                      <iframe
                        src={getYouTubeEmbedUrl(video.video_url)}
                        title={`video-${video.id}`}
                        className="w-full h-72 md:h-96"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        controls
                        poster={video.thumbnail_url || undefined}
                        className="w-full bg-black h-72 md:h-96"
                        src={video.video_url}
                      />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-5">
                    <div className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-300">
                      {(video.views_count || 0).toLocaleString()} views
                    </div>
                    <Link
                      href={`/profile?id=${video.user_id}`}
                      className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10"
                    >
                      Open creator
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}