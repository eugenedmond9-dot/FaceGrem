"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

const categories = ["All", "For You", "Creators", "Faith", "Business"];

export default function VideosPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [creatingVideo, setCreatingVideo] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("For You");
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

  const getBestNameForUser = (uid?: string, fallbackName?: string | null) => {
    const profile = getProfileById(uid);
    return profile?.full_name || fallbackName || "FaceGrem User";
  };

  const getBestAvatarForUser = (uid?: string, fallbackName?: string | null) => {
    const profile = getProfileById(uid);
    return (
      profile?.avatar_url ||
      getAvatarUrl(profile?.full_name || fallbackName || "FaceGrem User")
    );
  };

  useEffect(() => {
    const loadVideos = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/");
        return;
      }

      setUserId(session.user.id);

      const [{ data, error }, { data: profilesData, error: profilesError }] =
        await Promise.all([
          supabase
            .from("videos")
            .select(
              "id, user_id, title, description, category, video_url, thumbnail_url, views_count, created_at"
            )
            .order("created_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("id, full_name, username, bio, avatar_url"),
        ]);

      if (error) {
        alert(error.message);
      } else {
        setVideos(data || []);
      }

      if (profilesError) {
        alert(profilesError.message);
      } else {
        setProfiles(profilesData || []);
      }

      setLoading(false);
    };

    void loadVideos();
  }, [router]);

  const filteredVideos = useMemo(() => {
    if (activeCategory === "All") return videos;
    return videos.filter(
      (video) => (video.category || "For You") === activeCategory
    );
  }, [videos, activeCategory]);

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

  const handleCreateVideo = async () => {
    if (!title.trim() || !videoUrl.trim()) {
      alert("Title and video URL are required.");
      return;
    }

    if (!userId) {
      alert("You must be logged in.");
      return;
    }

    setCreatingVideo(true);

    const { data, error } = await supabase
      .from("videos")
      .insert([
        {
          user_id: userId,
          title: title.trim(),
          description: description.trim() || null,
          category: category || "For You",
          video_url: videoUrl.trim(),
          thumbnail_url: thumbnailUrl.trim() || null,
        },
      ])
      .select(
        "id, user_id, title, description, category, video_url, thumbnail_url, views_count, created_at"
      );

    if (error) {
      alert(error.message);
      setCreatingVideo(false);
      return;
    }

    if (data && data.length > 0) {
      setVideos((prev) => [data[0], ...prev]);
      setTitle("");
      setDescription("");
      setCategory("For You");
      setVideoUrl("");
      setThumbnailUrl("");
    }

    setCreatingVideo(false);
  };

  const handleDeleteVideo = async (videoId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this video?");
    if (!confirmed) return;

    const { error } = await supabase.from("videos").delete().eq("id", videoId);

    if (error) {
      alert(error.message);
      return;
    }

    setVideos((prev) => prev.filter((video) => video.id !== videoId));
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
      <header className="border-b border-white/10 bg-[#07111f]/85 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center font-bold shadow-lg h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/20">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FaceGrem</h1>
              <p className="text-xs text-slate-400">Videos</p>
            </div>
          </div>

          <Link
            href="/feed"
            className="px-4 py-2 text-sm font-medium transition border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
          >
            Back to Feed
          </Link>
        </div>
      </header>

      <main className="px-6 py-10 mx-auto max-w-7xl">
        <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_30%),linear-gradient(to_bottom_right,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 backdrop-blur-xl">
          <p className="text-sm font-medium text-cyan-200">FaceGrem video hub</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Watch real videos from your community.
          </h2>
          <p className="max-w-3xl mt-3 text-sm leading-7 text-slate-300">
            Publish video links, explore creator content, and build your media space
            inside FaceGrem.
          </p>
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-xl font-semibold text-white">Add a video</h3>

          <div className="grid gap-4 mt-5 md:grid-cols-2">
            <input
              type="text"
              placeholder="Video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5"
            >
              <option value="For You">For You</option>
              <option value="Creators">Creators</option>
              <option value="Faith">Faith</option>
              <option value="Business">Business</option>
            </select>

            <input
              type="text"
              placeholder="Video URL (YouTube or direct link)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 md:col-span-2"
            />

            <input
              type="text"
              placeholder="Thumbnail URL (optional)"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 md:col-span-2"
            />

            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 md:col-span-2"
            />
          </div>

          <button
            onClick={handleCreateVideo}
            disabled={creatingVideo}
            className="px-5 py-3 mt-5 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
          >
            {creatingVideo ? "Publishing..." : "Publish video"}
          </button>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap gap-3 mb-5">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setActiveCategory(item)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeCategory === item
                    ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {filteredVideos.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-slate-300">
              No videos available yet.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredVideos.map((video) => {
                const creatorProfile = getProfileById(video.user_id);
                const creatorName = getBestNameForUser(
                  video.user_id,
                  creatorProfile?.full_name
                );
                const creatorAvatar = getBestAvatarForUser(
                  video.user_id,
                  creatorProfile?.full_name
                );

                return (
                  <article
                    key={video.id}
                    className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                  >
                    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/30">
                      {isYouTubeUrl(video.video_url) ? (
                        <iframe
                          src={getYouTubeEmbedUrl(video.video_url)}
                          title={video.title}
                          className="w-full h-64"
                          allowFullScreen
                        />
                      ) : video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="object-cover w-full h-64"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-64 bg-gradient-to-br from-cyan-400/10 via-blue-500/10 to-purple-500/10">
                          <div className="flex items-center justify-center w-16 h-16 text-2xl rounded-full bg-white/10">
                            ▶
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="px-3 py-1 text-xs rounded-full bg-white/10 text-slate-300">
                          {video.category || "For You"}
                        </span>
                        <span className="text-xs text-slate-400">
                          {(video.views_count || 0).toLocaleString()} views
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold leading-7 text-white">
                        {video.title}
                      </h3>

                      <Link
                        href={`/profile?id=${video.user_id}`}
                        className="flex items-center gap-3 mt-4 hover:opacity-90"
                      >
                        <img
                          src={creatorAvatar}
                          alt={creatorName}
                          className="object-cover w-10 h-10 rounded-2xl"
                        />
                        <div>
                          <p className="text-sm font-medium text-white">
                            {creatorName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {creatorProfile?.username
                              ? `@${creatorProfile.username}`
                              : "Video creator"}
                          </p>
                        </div>
                      </Link>

                      {video.description && (
                        <p className="mt-4 text-sm leading-6 text-slate-300">
                          {video.description}
                        </p>
                      )}

                      <p className="mt-3 text-xs text-slate-500">
                        {new Date(video.created_at).toLocaleString()}
                      </p>

                      <div className="flex flex-wrap gap-3 mt-4">
                        <a
                          href={video.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 text-sm font-medium transition border rounded-2xl border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10"
                        >
                          Open video
                        </a>

                        {video.user_id === userId && (
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="px-4 py-2 text-sm text-red-200 border rounded-2xl border-red-400/20 bg-red-500/10 hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}