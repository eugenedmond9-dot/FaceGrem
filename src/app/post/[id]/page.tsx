"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type UserProfile = {
  id?: string;
  full_name?: string;
  avatar_url?: string;
};

type ProfileRecord = {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url?: string | null;
};

type CommunityRecord = {
  id: string;
  creator_id: string;
  name: string;
  category: string | null;
  description: string | null;
  created_at: string;
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

type CommentRecord = {
  id: string;
  post_id: string;
  user_id: string;
  full_name: string | null;
  content: string;
  created_at: string;
};

type LikeRecord = {
  id: string;
  post_id: string;
  user_id: string;
};

type SavedPostRecord = {
  id: string;
  user_id: string;
  post_id: string;
};

export default function PostPage() {
  const router = useRouter();
  const params = useParams();

  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [community, setCommunity] = useState<CommunityRecord | null>(null);
  const [post, setPost] = useState<PostRecord | null>(null);
  const [likes, setLikes] = useState<LikeRecord[]>([]);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPostRecord[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState("");

  const postId = params?.id as string | undefined;

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
    const loadPostPage = async () => {
      if (!postId) {
        router.push("/feed");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/");
        return;
      }

      const fullName =
        session.user.user_metadata?.full_name || "FaceGrem User";
      const metadataAvatarUrl = session.user.user_metadata?.avatar_url as
        | string
        | undefined;

      const [{ data: myProfileData }, { data: profilesData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, username, bio, avatar_url")
          .eq("id", session.user.id)
          .single(),
        supabase
          .from("profiles")
          .select("id, full_name, username, bio, avatar_url"),
      ]);

      setProfiles(profilesData || []);
      setUserProfile({
        id: session.user.id,
        full_name: myProfileData?.full_name || fullName,
        avatar_url:
          myProfileData?.avatar_url ||
          metadataAvatarUrl ||
          getAvatarUrl(myProfileData?.full_name || fullName),
      });

      const [
        { data: postData, error: postError },
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
        supabase
          .from("likes")
          .select("id, post_id, user_id")
          .eq("post_id", postId),
        supabase
          .from("comments")
          .select("id, post_id, user_id, full_name, content, created_at")
          .eq("post_id", postId)
          .order("created_at", { ascending: true }),
        supabase
          .from("saved_posts")
          .select("id, user_id, post_id")
          .eq("post_id", postId),
      ]);

      if (postError || !postData) {
        alert(postError?.message || "Post not found.");
        router.push("/feed");
        return;
      }

      setPost(postData);
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

  const likeCount = useMemo(() => likes.length, [likes]);

  const hasLiked = useMemo(() => {
    if (!userProfile.id) return false;
    return likes.some((like) => like.user_id === userProfile.id);
  }, [likes, userProfile.id]);

  const isSaved = useMemo(() => {
    if (!userProfile.id || !post) return false;

    return savedPosts.some(
      (savedPost) =>
        savedPost.user_id === userProfile.id && savedPost.post_id === post.id
    );
  }, [savedPosts, userProfile.id, post]);

  const handleToggleLike = async () => {
    if (!userProfile.id || !post) return;

    const existingLike = likes.find((like) => like.user_id === userProfile.id);

    if (existingLike) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("id", existingLike.id);

      if (!error) {
        setLikes((prev) => prev.filter((like) => like.id !== existingLike.id));
      }
      return;
    }

    const { data, error } = await supabase
      .from("likes")
      .insert([
        {
          post_id: post.id,
          user_id: userProfile.id,
        },
      ])
      .select("id, post_id, user_id");

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setLikes((prev) => [...prev, data[0]]);

      if (post.user_id !== userProfile.id) {
        await supabase.from("notifications").insert([
          {
            user_id: post.user_id,
            actor_id: userProfile.id,
            type: "like",
            post_id: post.id,
            actor_name: getBestNameForUser(userProfile.id, userProfile.full_name),
          },
        ]);
      }
    }
  };

  const handleToggleSavePost = async () => {
    if (!userProfile.id || !post) return;

    const existingSavedPost = savedPosts.find(
      (savedPost) =>
        savedPost.user_id === userProfile.id && savedPost.post_id === post.id
    );

    if (existingSavedPost) {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("id", existingSavedPost.id);

      if (!error) {
        setSavedPosts((prev) =>
          prev.filter((savedPost) => savedPost.id !== existingSavedPost.id)
        );
      }
      return;
    }

    const { data, error } = await supabase
      .from("saved_posts")
      .insert([
        {
          user_id: userProfile.id,
          post_id: post.id,
        },
      ])
      .select("id, user_id, post_id");

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setSavedPosts((prev) => [...prev, data[0]]);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !userProfile.id || !post) return;

    const content = commentText.trim();

    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          post_id: post.id,
          user_id: userProfile.id,
          full_name: getBestNameForUser(userProfile.id, userProfile.full_name),
          content,
        },
      ])
      .select("id, post_id, user_id, full_name, content, created_at");

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setComments((prev) => [...prev, data[0]]);
      setCommentText("");

      if (post.user_id !== userProfile.id) {
        await supabase.from("notifications").insert([
          {
            user_id: post.user_id,
            actor_id: userProfile.id,
            type: "comment",
            post_id: post.id,
            actor_name: getBestNameForUser(userProfile.id, userProfile.full_name),
            content,
          },
        ]);
      }
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      alert(error.message);
      return;
    }

    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
  };

  const startEditing = () => {
    if (!post) return;
    setEditingText(post.content);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingText("");
  };

  const saveEditedPost = async () => {
    if (!post) return;

    const trimmedContent = editingText.trim();
    if (!trimmedContent) {
      alert("Post cannot be empty.");
      return;
    }

    const { error } = await supabase
      .from("posts")
      .update({ content: trimmedContent })
      .eq("id", post.id);

    if (error) {
      alert(error.message);
      return;
    }

    setPost((prev) => (prev ? { ...prev, content: trimmedContent } : prev));
    setIsEditing(false);
    setEditingText("");
  };

  const deletePost = async () => {
    if (!post) return;

    const confirmed = window.confirm("Are you sure you want to delete this post?");
    if (!confirmed) return;

    const { error } = await supabase.from("posts").delete().eq("id", post.id);

    if (error) {
      alert(error.message);
      return;
    }

    if (post.community_id) {
      router.push(`/communities/${post.community_id}`);
      return;
    }

    router.push("/feed");
  };

  const handleSharePost = async () => {
    if (!post) return;

    const shareUrl = `${window.location.origin}/post/${post.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Post link copied!");
    } catch {
      alert("Could not copy post link.");
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading || !post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        Loading post...
      </div>
    );
  }

  const authorName = getBestNameForUser(post.user_id, post.full_name);
  const authorAvatar = getBestAvatarForUser(
    post.user_id,
    post.full_name,
    post.avatar_url
  );

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
              <p className="text-xs text-slate-400">Post</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {community ? (
              <Link
                href={`/communities/${community.id}`}
                className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              >
                Back to Community
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
          <div className="mb-6 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-sm font-medium text-cyan-200">Posted in community</p>
            <Link
              href={`/communities/${community.id}`}
              className="inline-block mt-2 text-2xl font-bold tracking-tight text-white hover:text-cyan-300"
            >
              {community.name}
            </Link>
            <p className="mt-2 text-sm text-slate-400">
              {community.category || "General"}
            </p>
          </div>
        )}

        <article className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
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
              <p className="text-lg font-semibold text-white">{authorName}</p>
              <p className="text-sm text-slate-400">{formatTime(post.created_at)}</p>
            </div>
          </Link>

          {isEditing ? (
            <div className="mt-6 space-y-3">
              <textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 text-sm text-white border outline-none resize-none rounded-2xl border-white/10 bg-white/5"
              />
              <div className="flex gap-3">
                <button
                  onClick={saveEditedPost}
                  className="px-4 py-2 text-sm font-semibold text-white rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={cancelEditing}
                  className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {post.content && (
                <p className="mt-6 text-base leading-8 text-slate-200">
                  {post.content}
                </p>
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
                      title={`video-${post.id}`}
                      className="h-72 w-full md:h-[420px]"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      controls
                      className="h-72 w-full bg-black md:h-[420px]"
                      src={post.video_url}
                    />
                  )}
                </div>
              )}

              {!post.image_url && !post.video_url && (
                <div className="mt-6 h-56 rounded-[28px] bg-gradient-to-br from-cyan-400/10 via-blue-500/10 to-purple-500/10" />
              )}
            </>
          )}

          {post.user_id === userProfile.id && !isEditing && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={startEditing}
                className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              >
                Edit Post
              </button>
              <button
                onClick={deletePost}
                className="px-4 py-2 text-sm text-red-200 border rounded-2xl border-red-400/20 bg-red-500/10 hover:bg-red-500/20"
              >
                Delete Post
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-6 text-sm">
            <button
              onClick={handleToggleLike}
              className={`rounded-2xl px-4 py-2 font-medium transition ${
                hasLiked
                  ? "border border-cyan-400/20 bg-cyan-500/20 text-cyan-200"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              ❤️ {likeCount} {likeCount === 1 ? "Like" : "Likes"}
            </button>

            <div className="px-4 py-2 border rounded-2xl border-white/10 bg-white/5 text-slate-300">
              💬 {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
            </div>

            <button
              onClick={handleToggleSavePost}
              className={`rounded-2xl px-4 py-2 font-medium transition ${
                isSaved
                  ? "border border-cyan-400/20 bg-cyan-500/20 text-cyan-200"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              🔖 {isSaved ? "Saved" : "Save"}
            </button>

            <button
              onClick={handleSharePost}
              className="px-4 py-2 border rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            >
              ↗ Share
            </button>
          </div>
        </article>

        <section className="mt-6 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white">Comments</h2>

          <div className="flex gap-3 mt-5">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
            />
            <button
              onClick={handleAddComment}
              className="px-4 py-3 text-sm font-semibold text-white rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600"
            >
              Comment
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-slate-400">No comments yet.</p>
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
                  <div
                    key={comment.id}
                    className="px-4 py-4 border rounded-2xl border-white/10 bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <img
                          src={commentAuthorAvatar}
                          alt={commentAuthorName}
                          className="object-cover w-10 h-10 rounded-2xl"
                        />
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {commentAuthorName}
                          </p>
                          <p className="mt-1 text-sm text-slate-300">
                            {comment.content}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {formatTime(comment.created_at)}
                          </p>
                        </div>
                      </div>

                      {comment.user_id === userProfile.id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="px-3 py-2 text-xs border rounded-xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}