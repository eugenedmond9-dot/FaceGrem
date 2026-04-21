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

type ProfileRecord = {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url?: string | null;
};

type LikeRecord = {
  id: string;
  post_id: string;
  user_id: string;
};

type CommentRecord = {
  id: string;
  post_id: string;
  user_id: string;
  full_name: string | null;
  content: string;
  created_at: string;
};

export default function SavedPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [savedPosts, setSavedPosts] = useState<SavedPostRecord[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [likes, setLikes] = useState<LikeRecord[]>([]);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getBestAvatarForUser = (
    uid?: string,
    fallbackName?: string | null,
    fallbackAvatarUrl?: string | null
  ) => {
    const profile = getProfileById(uid);
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
    const loadSavedPage = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/");
        return;
      }

      const currentUserId = session.user.id;
      setUserId(currentUserId);

      const [
        { data: savedPostsData },
        { data: postsData },
        { data: profilesData },
        { data: likesData },
        { data: commentsData },
      ] = await Promise.all([
        supabase.from("saved_posts").select("id, user_id, post_id").eq("user_id", currentUserId),
        supabase
          .from("posts")
          .select(
            "id, user_id, content, created_at, full_name, avatar_url, image_url, video_url, community_id"
          )
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name, username, bio, avatar_url"),
        supabase.from("likes").select("id, post_id, user_id"),
        supabase
          .from("comments")
          .select("id, post_id, user_id, full_name, content, created_at"),
      ]);

      setSavedPosts(savedPostsData || []);
      setPosts(postsData || []);
      setProfiles(profilesData || []);
      setLikes(likesData || []);
      setComments(commentsData || []);
      setLoading(false);
    };

    void loadSavedPage();
  }, [router]);

  const savedPostItems = useMemo(() => {
    const savedIds = new Set(savedPosts.map((saved) => saved.post_id));
    return posts.filter((post) => savedIds.has(post.id));
  }, [savedPosts, posts]);

  const getPostLikesCount = (postId: string) =>
    likes.filter((like) => like.post_id === postId).length;

  const getPostCommentsCount = (postId: string) =>
    comments.filter((comment) => comment.post_id === postId).length;

  const handleRemoveSavedPost = async (savedId: string, postId: string) => {
    const { error } = await supabase.from("saved_posts").delete().eq("id", savedId);

    if (error) {
      alert(error.message);
      return;
    }

    setSavedPosts((prev) => prev.filter((saved) => saved.id !== savedId));
    setPosts((prev) => prev.filter((post) => post.id !== postId || !savedPosts.some((s) => s.post_id === post.id && s.id !== savedId)));
  };

  const findSavedRecord = (postId: string) =>
    savedPosts.find((saved) => saved.post_id === postId && saved.user_id === userId);

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
        <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_30%),linear-gradient(to_bottom_right,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 backdrop-blur-xl">
          <p className="text-sm font-medium text-cyan-200">Your collection</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Posts you saved to revisit later.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Keep ideas, videos, messages, and moments you want to come back to.
          </p>
        </section>

        <section className="mt-8 space-y-6">
          {savedPostItems.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-slate-300">
              You have not saved any posts yet.
            </div>
          ) : (
            savedPostItems.map((post) => {
              const authorName = getBestNameForUser(post.user_id, post.full_name);
              const authorAvatar = getBestAvatarForUser(
                post.user_id,
                post.full_name,
                post.avatar_url
              );
              const savedRecord = findSavedRecord(post.id);
              const likesCount = getPostLikesCount(post.id);
              const commentsCount = getPostCommentsCount(post.id);

              return (
                <article
                  key={post.id}
                  className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-4">
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

                    {savedRecord && (
                      <button
                        onClick={() => handleRemoveSavedPost(savedRecord.id, post.id)}
                        className="px-4 py-2 text-xs text-red-200 border rounded-2xl border-red-400/20 bg-red-500/10 hover:bg-red-500/20"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {post.content && (
                    <p className="mt-4 text-sm leading-7 text-slate-200">{post.content}</p>
                  )}

                  {post.image_url && (
                    <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10">
                      <img
                        src={post.image_url}
                        alt="Post"
                        className="max-h-[560px] w-full object-cover"
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

                  <div className="flex flex-wrap gap-3 mt-5">
                    <div className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-300">
                      ❤️ {likesCount}
                    </div>
                    <div className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-300">
                      💬 {commentsCount}
                    </div>
                    <Link
                      href={`/post/${post.id}`}
                      className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10"
                    >
                      Open post
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