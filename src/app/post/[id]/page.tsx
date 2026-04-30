"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "../../../components/LanguageProvider";
import FaceGremLogo from "../../../components/FaceGremLogo";

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
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const postId = params?.id || "";

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");
  const [userAvatar, setUserAvatar] = useState("");

  const [post, setPost] = useState<PostRecord | null>(null);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [likes, setLikes] = useState<LikeRecord[]>([]);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPostRecord[]>([]);
  const [community, setCommunity] = useState<CommunityRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [searchText, setSearchText] = useState("");

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

      const allProfiles = profilesData || [];
      const myProfile = allProfiles.find((profile) => profile.id === currentUserId);

      setPost(postData);
      setProfiles(allProfiles);
      setLikes(likesData || []);
      setComments(commentsData || []);
      setSavedPosts(savedPostsData || []);
      setUserAvatar(
        myProfile?.avatar_url || getAvatarUrl(myProfile?.full_name || currentUserName)
      );

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

  useEffect(() => {
    if (!postId) return;

    const postChannel = supabase
      .channel(`post-detail-live-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
          filter: `id=eq.${postId}`,
        },
        (payload) => {
          setPost(payload.new as PostRecord);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "posts",
          filter: `id=eq.${postId}`,
        },
        () => {
          router.push("/feed");
        }
      )
      .subscribe();

    const likesChannel = supabase
      .channel(`post-detail-likes-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "likes",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const newLike = payload.new as LikeRecord;
          setLikes((prev) => {
            if (prev.some((like) => like.id === newLike.id)) return prev;
            return [...prev, newLike];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "likes",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const deletedLike = payload.old as Partial<LikeRecord>;
          setLikes((prev) => prev.filter((like) => like.id !== deletedLike.id));
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel(`post-detail-comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const newComment = payload.new as CommentRecord;
          setComments((prev) => {
            if (prev.some((comment) => comment.id === newComment.id)) return prev;
            return [...prev, newComment].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const updatedComment = payload.new as CommentRecord;
          setComments((prev) =>
            prev.map((comment) =>
              comment.id === updatedComment.id ? updatedComment : comment
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const deletedComment = payload.old as Partial<CommentRecord>;
          setComments((prev) =>
            prev.filter((comment) => comment.id !== deletedComment.id)
          );
        }
      )
      .subscribe();

    const savedChannel = supabase
      .channel(`post-detail-saved-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "saved_posts",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const newSaved = payload.new as SavedPostRecord;
          setSavedPosts((prev) => {
            if (prev.some((saved) => saved.id === newSaved.id)) return prev;
            return [...prev, newSaved];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "saved_posts",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const deletedSaved = payload.old as Partial<SavedPostRecord>;
          setSavedPosts((prev) =>
            prev.filter((saved) => saved.id !== deletedSaved.id)
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(postChannel);
      void supabase.removeChannel(likesChannel);
      void supabase.removeChannel(commentsChannel);
      void supabase.removeChannel(savedChannel);
    };
  }, [postId, router]);

  const likesCount = likes.length;

  const filteredComments = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return comments;

    return comments.filter((comment) => {
      const author = getBestNameForUser(comment.user_id, comment.full_name).toLowerCase();
      const text = `${comment.content} ${author}`.toLowerCase();
      return text.includes(term);
    });
  }, [comments, searchText, profiles]);

  const commentsCount = filteredComments.length;

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
      <div className="flex min-h-screen items-center justify-center bg-[#020817] text-white">
        Loading post...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_25%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.08),transparent_22%),linear-gradient(to_bottom,#020817,#07111f_45%,#020817)]" />
        <div className="absolute left-0 rounded-full top-10 h-72 w-72 bg-cyan-400/10 blur-3xl" />
        <div className="absolute top-0 right-0 rounded-full h-96 w-96 bg-blue-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020817]/75 backdrop-blur-2xl">
        <div className="flex items-center gap-3 px-4 py-4 mx-auto max-w-7xl sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/feed" className="flex items-center gap-3">
              <FaceGremLogo
              href=""
              showWordmark={false}
              markClassName="h-12 w-12 rounded-2xl ring-0 shadow-sm"
            />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold tracking-tight text-white">FaceGrem</h1>
                <p className="text-xs text-slate-400">{t.viewDiscussion}</p>
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
                  placeholder={t.searchPlaceholder}
                  className="w-full text-sm text-white bg-transparent outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {community ? (
              <Link
                href={`/communities/${community.id}`}
                className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 md:inline-flex"
              >
                Community
              </Link>
            ) : (
              <Link
                href="/feed"
                className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 md:inline-flex"
              >
                Feed
              </Link>
            )}

            <Link
              href="/profile"
              className="flex items-center gap-2 px-2 py-2 transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 sm:px-2 sm:pr-3"
            >
              <img
                src={userAvatar || getAvatarUrl(userName)}
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
                placeholder={t.searchPlaceholder}
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
            {community && (
              <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(15,23,42,0.94)_45%,rgba(30,41,59,0.94))] p-4 shadow-[0_20px_60px_rgba(6,182,212,0.10)] backdrop-blur-xl">
                <p className="text-sm font-semibold text-cyan-200">Community post</p>
                <h3 className="mt-2 text-xl font-bold text-white">{community.name}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  {community.description || "Community discussion"}
                </p>
              </div>
            )}

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

                {community && (
                  <Link
                    href={`/communities/${community.id}`}
                    className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-base">👥</span>
                      Community
                    </span>
                    <span className="text-slate-500">→</span>
                  </Link>
                )}

                <Link
                  href={`/profile?id=${post.user_id}`}
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">👤</span>
                    Author profile
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
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <p className="text-sm font-semibold text-cyan-200">Discussion stats</p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">Likes</p>
                  <p className="mt-2 text-xl font-bold text-white">{likesCount}</p>
                </div>
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">{"Comments"}</p>
                  <p className="mt-2 text-xl font-bold text-white">{comments.length}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-5 sm:space-y-6">
          <article className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <div className="p-5 sm:p-6">
              {community && (
                <div className="mb-5 inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200">
                  Posted in {community.name}
                </div>
              )}

              <div className="flex items-start justify-between gap-4">
                <Link
                  href={`/profile?id=${post.user_id}`}
                  className="flex items-center gap-3 hover:opacity-90"
                >
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    className="object-cover h-14 w-14 rounded-2xl ring-1 ring-white/10"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">{authorName}</p>
                      <span className="text-xs text-slate-400">
                        {new Date(post.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{t.publicPost}</p>
                  </div>
                </Link>

                <span className="px-3 py-1 text-xs border rounded-full border-white/10 bg-white/5 text-slate-300">
                  {community ? community.name : "Public"}
                </span>
              </div>

              {post.content && (
                <div className="mt-6">
                  <p className="text-[15px] leading-8 text-slate-200">{post.content}</p>
                </div>
              )}
            </div>

            {post.image_url && (
              <div className="px-3 pb-3 border-y border-white/10 bg-black/20 sm:px-4 sm:pb-4">
                <div className="overflow-hidden rounded-[28px]">
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="max-h-[720px] w-full object-cover"
                  />
                </div>
              </div>
            )}

            {post.video_url && (
              <div className="px-3 pb-3 border-y border-white/10 bg-black/30 sm:px-4 sm:pb-4">
                <div className="overflow-hidden rounded-[28px]">
                  {isYouTubeUrl(post.video_url) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(post.video_url)}
                      title={`post-video-${post.id}`}
                      className="h-80 w-full md:h-[480px]"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      controls
                      className="h-80 w-full bg-black md:h-[480px]"
                      src={post.video_url}
                    />
                  )}
                </div>
              </div>
            )}

            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5">
                    <span className="text-base">❤️</span>
                    <span className="text-slate-200">
                      {likesCount} {likesCount === 1 ? "like" : "likes"}
                    </span>
                  </div>

                  <div className="rounded-full bg-white/5 px-3 py-1.5 text-slate-300">
                    {comments.length} {comments.length === 1 ? "comment" : "comments"}
                  </div>
                </div>

                <Link
                  href={`/profile?id=${post.user_id}`}
                  className="text-sm font-medium transition text-cyan-300 hover:text-cyan-200"
                >
                  View author
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                <button
                  onClick={handleToggleLike}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isLiked
                      ? "border border-cyan-400/20 bg-cyan-500/20 text-cyan-200"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {isLiked ? t.liked : t.like}
                </button>

                <div className="px-4 py-3 text-sm font-medium text-center border rounded-2xl border-white/10 bg-white/5 text-slate-300">
                  {comments.length} Comments
                </div>

                <button
                  onClick={handleToggleSave}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    savedRecord
                      ? "border border-cyan-400/20 bg-cyan-500/20 text-cyan-200"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {savedRecord ? t.saved : t.saved}
                </button>

                <Link
                  href={`/messages?user=${post.user_id}`}
                  className="px-4 py-3 text-sm font-medium text-center transition border rounded-2xl border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10"
                >
                  Message
                </Link>
              </div>
            </div>
          </article>

          <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.92)_45%,rgba(15,23,42,0.96))] shadow-[0_25px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:rounded-[34px]">
            <div className="px-4 py-4 border-b border-white/10 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-cyan-200">Join the conversation</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Add your thoughts to this post
                  </p>
                </div>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                  {comments.length} total comments
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <form onSubmit={handleAddComment}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={4}
                  placeholder="Write your comment..."
                  className="w-full px-4 py-3 text-sm text-white transition border outline-none resize-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                />

                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    disabled={commenting}
                    className="px-6 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
                  >
                    {commenting ? t.posting : "Add comment"}
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">{"Comments"}</p>
                <h3 className="mt-1 text-2xl font-bold tracking-tight text-white">
                  Discussion ({filteredComments.length})
                </h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                {searchText.trim() ? "Filtered" : "All"}
              </span>
            </div>
          </section>

          {filteredComments.length === 0 ? (
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
              <p className="text-lg font-medium text-white">No comments found.</p>
              <p className="mt-2 text-sm text-slate-400">
                Be the first to start the discussion here.
              </p>
            </div>
          ) : (
            <section className="space-y-4">
              {filteredComments.map((comment) => {
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
                    className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl"
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
              })}
            </section>
          )}
        </section>

        <aside className="space-y-5 xl:space-y-5">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">Author</p>
                <p className="mt-1 text-xs text-slate-400">Person who shared this post</p>
              </div>
            </div>

            <Link
              href={`/profile?id=${post.user_id}`}
              className="flex items-center gap-3 p-4 mt-4 transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
            >
              <img
                src={authorAvatar}
                alt={authorName}
                className="object-cover w-12 h-12 rounded-2xl"
              />
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{authorName}</p>
                <p className="text-xs truncate text-slate-400">
                  Open profile
                </p>
              </div>
            </Link>
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
              {community && (
                <Link
                  href={`/communities/${community.id}`}
                  className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                >
                  Open community
                </Link>
              )}
              <Link
                href={`/messages?user=${post.user_id}`}
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Message author
              </Link>
              <Link
                href="/profile"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Visit your profile
              </Link>
            </div>
          </div>
        </aside>
      </main>

    </div>
  );
}