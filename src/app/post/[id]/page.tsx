"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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

type SavedPostRecord = {
  id: string;
  user_id: string;
  post_id: string;
};

type CommunityRecord = {
  id: string;
  creator_id: string;
  name: string;
  category: string | null;
  description: string | null;
  created_at: string;
};

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = params?.id || "";

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");

  const [post, setPost] = useState<PostRecord | null>(null);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [likes, setLikes] = useState<LikeRecord[]>([]);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPostRecord[]>([]);
  const [community, setCommunity] = useState<CommunityRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);

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
    const loadPostPage = async () => {
      if (!postId) return;

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
        { data: postData, error: postError },
        { data: profilesData },
        { data: likesData },
        { data: commentsData },
        { data: savedPostsData },
      ] = await Promise.all([
        supabase
          .from("posts")
          .select(
            "id, user_id, content, created_at, full_name, avatar_url, image_url, video_url, community_id"
          )
          .eq("id", postId)
          .single(),
        supabase.from("profiles").select("id, full_name, username, bio, avatar_url"),
        supabase.from("likes").select("id, post_id, user_id").eq("post_id", postId),
        supabase
          .from("comments")
          .select("id, post_id, user_id, full_name, content, created_at")
          .eq("post_id", postId)
          .order("created_at", { ascending: true }),
        supabase.from("saved_posts").select("id, user_id, post_id").eq("post_id", postId),
      ]);

      if (postError || !postData) {
        alert(postError?.message || "Post not found.");
        router.push("/feed");
        return;
      }

      setPost(postData);
      setProfiles(profilesData || []);
      setLikes(likesData || []);
      setComments(commentsData || []);
      setSavedPosts(savedPostsData || []);

      if (postData.community_id) {
        const { data: communityData } = await supabase
          .from("communities")
          .select("id, creator_id, name, category, description, created_at")
          .eq("id", postData.community_id)
          .single();

        setCommunity(communityData || null);
      }

      setLoading(false);
    };

    void loadPostPage();
  }, [postId, router]);

  const likesCount = likes.length;
  const commentsCount = comments.length;

  const isLiked = useMemo(() => {
    return likes.some((like) => like.user_id === userId);
  }, [likes, userId]);

  const savedRecord = useMemo(() => {
    return savedPosts.find((saved) => saved.user_id === userId);
  }, [savedPosts, userId]);

  const authorName = useMemo(() => {
    if (!post) return "FaceGrem User";
    return getBestNameForUser(post.user_id, post.full_name);
  }, [post, profiles]);

  const authorAvatar = useMemo(() => {
    if (!post) return getAvatarUrl("FaceGrem User");
    return getBestAvatarForUser(post.user_id, post.full_name, post.avatar_url);
  }, [post, profiles]);

  const handleToggleLike = async () => {
    if (!post) return;

    const existingLike = likes.find((like) => like.user_id === userId);

    if (existingLike) {
      const { error } = await supabase.from("likes").delete().eq("id", existingLike.id);

      if (error) {
        alert(error.message);
        return;
      }

      setLikes((prev) => prev.filter((like) => like.id !== existingLike.id));
      return;
    }

    const { data, error } = await supabase
      .from("likes")
      .insert([{ post_id: post.id, user_id: userId }])
      .select("id, post_id, user_id");

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setLikes((prev) => [...prev, data[0]]);
    }
  };

  const handleToggleSave = async () => {
    if (!post) return;

    if (savedRecord) {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("id", savedRecord.id);

      if (error) {
        alert(error.message);
        return;
      }

      setSavedPosts((prev) => prev.filter((saved) => saved.id !== savedRecord.id));
      return;
    }

    const { data, error } = await supabase
      .from("saved_posts")
      .insert([{ post_id: post.id, user_id: userId }])
      .select("id, user_id, post_id");

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setSavedPosts((prev) => [...prev, data[0]]);
    }
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!post) return;

    const trimmed = commentText.trim();
    if (!trimmed) {
      alert("Write a comment first.");
      return;
    }

    setCommenting(true);

    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          post_id: post.id,
          user_id: userId,
          full_name: userName,
          content: trimmed,
        },
      ])
      .select("id, post_id, user_id, full_name, content, created_at");

    setCommenting(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setComments((prev) => [...prev, data[0]]);
    }

    setCommentText("");
  };

  if (loading || !post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        Loading post...
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
              <p className="text-xs text-slate-400">Post Detail</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {community ? (
              <Link
                href={`/communities/${community.id}`}
                className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              >
                Open community
              </Link>
            ) : (
              <Link
                href="/feed"
                className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              >
                Back to Feed
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl px-6 py-10 mx-auto">
        {community && (
          <section className="mb-6 rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_30%),linear-gradient(to_bottom_right,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 backdrop-blur-xl">
            <p className="text-sm font-medium text-cyan-200">Community post</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">{community.name}</h2>
            <p className="mt-2 text-sm text-slate-300">
              {community.description || "Community discussion"}
            </p>
          </section>
        )}

        <article className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <Link
              href={`/profile?id=${post.user_id}`}
              className="flex items-center gap-3 hover:opacity-90"
            >
              <img
                src={authorAvatar}
                alt={authorName}
                className="object-cover h-14 w-14 rounded-2xl"
              />
              <div>
                <p className="font-semibold text-white">{authorName}</p>
                <p className="text-xs text-slate-400">
                  {new Date(post.created_at).toLocaleString()}
                </p>
              </div>
            </Link>

            <span className="px-3 py-1 text-xs border rounded-full border-white/10 bg-white/5 text-slate-300">
              {community ? community.name : "Public"}
            </span>
          </div>

          {post.content && (
            <p className="mt-5 text-sm leading-8 text-slate-200">{post.content}</p>
          )}

          {post.image_url && (
            <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10">
              <img
                src={post.image_url}
                alt="Post"
                className="max-h-[620px] w-full object-cover"
              />
            </div>
          )}

          {post.video_url && (
            <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-black/30">
              {isYouTubeUrl(post.video_url) ? (
                <iframe
                  src={getYouTubeEmbedUrl(post.video_url)}
                  title={`post-video-${post.id}`}
                  className="h-80 w-full md:h-[420px]"
                  allowFullScreen
                />
              ) : (
                <video
                  controls
                  className="h-80 w-full bg-black md:h-[420px]"
                  src={post.video_url}
                />
              )}
            </div>
          )}

          {!post.image_url && !post.video_url && !post.content && (
            <div className="mt-6 h-40 rounded-[28px] bg-gradient-to-br from-cyan-400/10 via-blue-500/10 to-purple-500/10" />
          )}

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={handleToggleLike}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                isLiked
                  ? "border border-cyan-400/20 bg-cyan-500/20 text-cyan-200"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              ❤️ {likesCount}
            </button>

            <div className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-300">
              💬 {commentsCount}
            </div>

            <button
              onClick={handleToggleSave}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                savedRecord
                  ? "border border-cyan-400/20 bg-cyan-500/20 text-cyan-200"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {savedRecord ? "Saved" : "Save"}
            </button>
          </div>
        </article>

        <section className="mt-8 rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-sm font-medium text-cyan-200">Join the conversation</p>

          <form onSubmit={handleAddComment} className="mt-4">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={4}
              placeholder="Write your comment..."
              className="w-full px-4 py-3 text-sm text-white border outline-none resize-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
            />

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={commenting}
                className="px-6 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
              >
                {commenting ? "Posting..." : "Add comment"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 space-y-4">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <h3 className="text-xl font-bold tracking-tight text-white">
              Comments ({commentsCount})
            </h3>
          </div>

          {comments.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-slate-300">
              No comments yet. Be the first to comment.
            </div>
          ) : (
            comments.map((comment) => {
              const commentAuthorName = getBestNameForUser(
                comment.user_id,
                comment.full_name
              );
              const commentAuthorAvatar = getBestAvatarForUser(
                comment.user_id,
                comment.full_name,
                null
              );

              return (
                <article
                  key={comment.id}
                  className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                >
                  <div className="flex items-start gap-3">
                    <Link href={`/profile?id=${comment.user_id}`} className="shrink-0">
                      <img
                        src={commentAuthorAvatar}
                        alt={commentAuthorName}
                        className="object-cover h-11 w-11 rounded-2xl"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/profile?id=${comment.user_id}`}
                          className="font-medium text-white hover:text-cyan-300"
                        >
                          {commentAuthorName}
                        </Link>
                        <span className="text-xs text-slate-400">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-7 text-slate-200">
                        {comment.content}
                      </p>
                    </div>
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