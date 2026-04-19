"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type SavedPostRecord = {
  id: string;
  user_id: string;
  post_id: string;
};

type ProfileRecord = {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url?: string | null;
};

type PostRecord = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  full_name: string | null;
  avatar_url: string | null;
  image_url?: string | null;
  video_url?: string | null;
  community_id?: string | null;
};

export default function SavedPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [savedPosts, setSavedPosts] = useState<SavedPostRecord[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=0f172a&color=ffffff&bold=true`;

  const getProfileById = (profileId?: string) => {
    if (!profileId) return undefined;
    return profiles.find((profile) => profile.id === profileId);
  };

  const getBestNameForUser = (userId?: string, fallbackName?: string | null) => {
    const profile = getProfileById(userId);
    return profile?.full_name || fallbackName || "FaceGrem User";
  };

  const getBestAvatarForUser = (
    userId?: string,
    fallbackName?: string | null,
    fallbackAvatarUrl?: string | null
  ) => {
    const profile = getProfileById(userId);

    return (
      profile?.avatar_url ||
      fallbackAvatarUrl ||
      getAvatarUrl(profile?.full_name || fallbackName || "FaceGrem User")
    );
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
    const loadSavedPosts = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/");
        return;
      }

      setUserId(session.user.id);

      const [{ data: savedData }, { data: postsData }, { data: profilesData }] =
        await Promise.all([
          supabase
            .from("saved_posts")
            .select("id, user_id, post_id")
            .eq("user_id", session.user.id),
          supabase
            .from("posts")
            .select(
              "id, user_id, content, created_at, full_name, avatar_url, image_url, video_url, community_id"
            )
            .is("community_id", null)
            .order("created_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("id, full_name, username, bio, avatar_url"),
        ]);

      setSavedPosts(savedData || []);
      setPosts(postsData || []);
      setProfiles(profilesData || []);
      setLoading(false);
    };

    void loadSavedPosts();
  }, [router]);

  const savedFeed = useMemo(() => {
    const savedIds = savedPosts.map((item) => item.post_id);
    return posts.filter((post) => savedIds.includes(post.id));
  }, [savedPosts, posts]);

  const handleUnsave = async (postId: string) => {
    const existing = savedPosts.find(
      (savedPost) => savedPost.user_id === userId && savedPost.post_id === postId
    );

    if (!existing) return;

    const { error } = await supabase
      .from("saved_posts")
      .delete()
      .eq("id", existing.id);

    if (!error) {
      setSavedPosts((prev) => prev.filter((item) => item.id !== existing.id));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        Loading saved posts...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10 bg-[#07111f]/85 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-5xl px-6 py-4 mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center font-bold shadow-lg h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/20">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FaceGrem</h1>
              <p className="text-xs text-slate-400">Saved Posts</p>
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

      <main className="max-w-4xl px-6 py-10 mx-auto">
        <div className="mb-8 rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_30%),linear-gradient(to_bottom_right,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 backdrop-blur-xl">
          <p className="text-sm font-medium text-cyan-200">Bookmarks</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Your saved FaceGrem posts
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Come back to the posts you wanted to keep.
          </p>
        </div>

        {savedFeed.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-slate-300">
            You have no saved posts yet.
          </div>
        ) : (
          <div className="space-y-6">
            {savedFeed.map((post) => {
              const authorName = getBestNameForUser(post.user_id, post.full_name);
              const authorAvatar = getBestAvatarForUser(
                post.user_id,
                post.full_name,
                post.avatar_url
              );

              return (
                <article
                  key={post.id}
                  className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                >
                  <Link
                    href={`/profile?id=${post.user_id}`}
                    className="flex items-center gap-3 hover:opacity-90"
                  >
                    <img
                      src={authorAvatar}
                      alt={authorName}
                      className="object-cover w-12 h-12 rounded-2xl"
                    />
                    <div>
                      <p className="font-semibold text-white">{authorName}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>
                  </Link>

                  {post.content && (
                    <p className="mt-4 text-sm leading-7 text-slate-200">
                      {post.content}
                    </p>
                  )}

                  {post.image_url && (
                    <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10">
                      <img
                        src={post.image_url}
                        alt="Saved post"
                        className="max-h-[520px] w-full object-cover"
                      />
                    </div>
                  )}

                  {post.video_url && (
                    <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-black/30">
                      {isYouTubeUrl(post.video_url) ? (
                        <iframe
                          src={getYouTubeEmbedUrl(post.video_url)}
                          title={`saved-video-${post.id}`}
                          className="w-full h-72 md:h-96"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          controls
                          className="w-full bg-black h-72 md:h-96"
                          src={post.video_url}
                        />
                      )}
                    </div>
                  )}

                  {!post.image_url && !post.video_url && !post.content && (
                    <div className="mt-5 h-40 rounded-[28px] bg-gradient-to-br from-cyan-400/10 via-blue-500/10 to-purple-500/10" />
                  )}

                  <div className="flex gap-3 mt-5">
                    <Link
                      href={`/post/${post.id}`}
                      className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10"
                    >
                      Open post
                    </Link>

                    <button
                      onClick={() => handleUnsave(post.id)}
                      className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}