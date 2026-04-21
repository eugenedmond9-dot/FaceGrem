"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

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

type CommunityMemberRecord = {
  id: string;
  community_id: string;
  user_id: string;
  created_at: string;
};

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

const quickActions = ["Photo", "Video", "Live", "Story"] as const;
const feedTabs = ["For You", "Following", "Creators", "Videos", "Faith", "Business"] as const;

export default function FeedPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");
  const [userAvatar, setUserAvatar] = useState("");
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [likes, setLikes] = useState<LikeRecord[]>([]);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPostRecord[]>([]);
  const [communities, setCommunities] = useState<CommunityRecord[]>([]);
  const [communityMembers, setCommunityMembers] = useState<CommunityMemberRecord[]>([]);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeComposerAction, setActiveComposerAction] =
    useState<(typeof quickActions)[number]>("Photo");
  const [activeFeedTab, setActiveFeedTab] =
    useState<(typeof feedTabs)[number]>("For You");

  const [postText, setPostText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [posting, setPosting] = useState(false);

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
    const loadFeed = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/");
        return;
      }

      const sessionUserId = session.user.id;
      const sessionFullName =
        session.user.user_metadata?.full_name || "FaceGrem User";

      setUserId(sessionUserId);
      setUserName(sessionFullName);

      const [
        { data: profilesData },
        { data: postsData },
        { data: likesData },
        { data: commentsData },
        { data: savedPostsData },
        { data: communitiesData },
        { data: communityMembersData },
        { data: videosData },
        { data: notificationsData },
      ] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, bio, avatar_url"),
        supabase
          .from("posts")
          .select(
            "id, user_id, content, created_at, full_name, avatar_url, image_url, video_url, community_id"
          )
          .is("community_id", null)
          .order("created_at", { ascending: false }),
        supabase.from("likes").select("id, post_id, user_id"),
        supabase
          .from("comments")
          .select("id, post_id, user_id, full_name, content, created_at"),
        supabase.from("saved_posts").select("id, user_id, post_id"),
        supabase
          .from("communities")
          .select("id, creator_id, name, category, description, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("community_members")
          .select("id, community_id, user_id, created_at"),
        supabase
          .from("videos")
          .select(
            "id, user_id, title, description, category, video_url, thumbnail_url, views_count, created_at"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("notifications")
          .select(
            "id, user_id, actor_id, type, post_id, actor_name, content, is_read, created_at"
          )
          .eq("user_id", sessionUserId)
          .order("created_at", { ascending: false }),
      ]);

      const allProfiles = profilesData || [];
      const myProfile = allProfiles.find((profile) => profile.id === sessionUserId);

      setProfiles(allProfiles);
      setPosts(postsData || []);
      setLikes(likesData || []);
      setComments(commentsData || []);
      setSavedPosts(savedPostsData || []);
      setCommunities(communitiesData || []);
      setCommunityMembers(communityMembersData || []);
      setVideos(videosData || []);
      setNotifications(notificationsData || []);
      setUserAvatar(
        myProfile?.avatar_url || getAvatarUrl(myProfile?.full_name || sessionFullName)
      );
      setLoading(false);
    };

    void loadFeed();
  }, [router]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);

    if (!file) {
      setImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const uploadPostImage = async () => {
    if (!imageFile || !userId) return null;

    const fileExt = imageFile.name.split(".").pop() || "jpg";
    const filePath = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt.toLowerCase()}`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("post-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleCreatePost = async () => {
    if (!userId) return;

    const trimmedContent = postText.trim();
    const trimmedVideoUrl = videoUrl.trim();

    if (!trimmedContent && !imageFile && !trimmedVideoUrl) {
      alert("Add text, an image, or a video link.");
      return;
    }

    setPosting(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        imageUrl = await uploadPostImage();
      }

      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            user_id: userId,
            content: trimmedContent,
            full_name: userName,
            avatar_url: userAvatar,
            image_url: imageUrl,
            video_url: trimmedVideoUrl || null,
          },
        ])
        .select(
          "id, user_id, content, created_at, full_name, avatar_url, image_url, video_url, community_id"
        );

      if (error) {
        alert(error.message);
        setPosting(false);
        return;
      }

      if (data && data.length > 0) {
        setPosts((prev) => [data[0], ...prev]);
      }

      setPostText("");
      setVideoUrl("");
      setImageFile(null);
      setImagePreview("");
      setActiveComposerAction("Photo");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not create post.");
    }

    setPosting(false);
  };

  const handleToggleLike = async (postId: string, ownerId: string) => {
    const existingLike = likes.find(
      (like) => like.post_id === postId && like.user_id === userId
    );

    if (existingLike) {
      const { error } = await supabase.from("likes").delete().eq("id", existingLike.id);

      if (!error) {
        setLikes((prev) => prev.filter((like) => like.id !== existingLike.id));
      }

      return;
    }

    const { data, error } = await supabase
      .from("likes")
      .insert([{ post_id: postId, user_id: userId }])
      .select("id, post_id, user_id");

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setLikes((prev) => [...prev, data[0]]);
    }

    if (ownerId !== userId) {
      await supabase.from("notifications").insert([
        {
          user_id: ownerId,
          actor_id: userId,
          type: "like",
          post_id: postId,
          actor_name: userName,
        },
      ]);
    }
  };

  const handleToggleSave = async (postId: string) => {
    const existingSaved = savedPosts.find(
      (saved) => saved.post_id === postId && saved.user_id === userId
    );

    if (existingSaved) {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("id", existingSaved.id);

      if (!error) {
        setSavedPosts((prev) => prev.filter((saved) => saved.id !== existingSaved.id));
      }

      return;
    }

    const { data, error } = await supabase
      .from("saved_posts")
      .insert([{ post_id: postId, user_id: userId }])
      .select("id, user_id, post_id");

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setSavedPosts((prev) => [...prev, data[0]]);
    }
  };

  const handleDeletePost = async (postId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this post?");
    if (!confirmed) return;

    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      alert(error.message);
      return;
    }

    setPosts((prev) => prev.filter((post) => post.id !== postId));
    setLikes((prev) => prev.filter((like) => like.post_id !== postId));
    setComments((prev) => prev.filter((comment) => comment.post_id !== postId));
    setSavedPosts((prev) => prev.filter((saved) => saved.post_id !== postId));
  };

  const getPostLikesCount = (postId: string) =>
    likes.filter((like) => like.post_id === postId).length;

  const getPostCommentsCount = (postId: string) =>
    comments.filter((comment) => comment.post_id === postId).length;

  const isSaved = (postId: string) =>
    savedPosts.some((saved) => saved.user_id === userId && saved.post_id === postId);

  const isLiked = (postId: string) =>
    likes.some((like) => like.user_id === userId && like.post_id === postId);

  const unreadNotificationsCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const myCommunityIds = useMemo(() => {
    return communityMembers
      .filter((member) => member.user_id === userId)
      .map((member) => member.community_id);
  }, [communityMembers, userId]);

  const filteredPosts = useMemo(() => {
    switch (activeFeedTab) {
      case "Following":
        return posts.filter((post) => post.user_id !== userId);
      case "Creators":
        return posts.filter((post) => {
          const profile = getProfileById(post.user_id);
          return !!profile?.username;
        });
      case "Faith":
        return posts.filter((post) => {
          const text = `${post.content} ${post.full_name || ""}`.toLowerCase();
          return text.includes("faith") || text.includes("jesus") || text.includes("church");
        });
      case "Business":
        return posts.filter((post) => {
          const text = `${post.content} ${post.full_name || ""}`.toLowerCase();
          return (
            text.includes("business") ||
            text.includes("market") ||
            text.includes("brand") ||
            text.includes("money")
          );
        });
      case "Videos":
        return posts.filter((post) => !!post.video_url);
      case "For You":
      default:
        return posts;
    }
  }, [activeFeedTab, posts, userId, profiles]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        Loading FaceGrem feed...
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
              <p className="text-xs text-slate-400">Home Feed</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/videos"
              className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Videos
            </Link>
            <Link
              href="/communities"
              className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Communities
            </Link>
            <Link
              href="/messages"
              className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Messages
            </Link>
            <Link
              href="/saved"
              className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Saved
            </Link>
            <Link
              href="/profile"
              className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <Link href="/profile" className="flex items-center gap-3 hover:opacity-90">
              <img
                src={userAvatar}
                alt={userName}
                className="object-cover h-14 w-14 rounded-2xl"
              />
              <div>
                <p className="font-semibold text-white">{userName}</p>
                <p className="text-sm text-slate-400">View your profile</p>
              </div>
            </Link>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-sm font-medium text-cyan-200">Shortcuts</p>
            <div className="mt-4 space-y-3 text-sm">
              <Link href="/videos" className="block px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10">
                Open Videos
              </Link>
              <Link href="/communities" className="block px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10">
                Open Communities
              </Link>
              <Link href="/messages" className="block px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10">
                Direct Messages
              </Link>
              <Link href="/saved" className="block px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10">
                Saved Posts
              </Link>
              <Link href="/threads" className="block px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10">
                Threads
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-sm font-medium text-cyan-200">Your communities</p>
            <div className="mt-4 space-y-3">
              {communities.filter((community) => myCommunityIds.includes(community.id)).length === 0 ? (
                <p className="text-sm text-slate-400">You have not joined any communities yet.</p>
              ) : (
                communities
                  .filter((community) => myCommunityIds.includes(community.id))
                  .slice(0, 4)
                  .map((community) => (
                    <Link
                      key={community.id}
                      href={`/communities/${community.id}`}
                      className="block px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10"
                    >
                      <p className="font-medium text-white">{community.name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {community.category || "Community"}
                      </p>
                    </Link>
                  ))
              )}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <img
                src={userAvatar}
                alt={userName}
                className="object-cover w-12 h-12 rounded-2xl"
              />
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                rows={3}
                placeholder={`What's happening, ${userName.split(" ")[0]}?`}
                className="w-full px-4 py-3 text-sm text-white border outline-none resize-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5 sm:grid-cols-4">
              {quickActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => setActiveComposerAction(action)}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    activeComposerAction === action
                      ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>

            {(activeComposerAction === "Photo" || activeComposerAction === "Story") && (
              <div className="mt-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full px-4 py-3 text-sm text-white border rounded-2xl border-white/10 bg-white/5 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500/20 file:px-3 file:py-2 file:text-cyan-200"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="object-cover w-full mt-4 max-h-72 rounded-3xl"
                  />
                )}
              </div>
            )}

            {(activeComposerAction === "Video" || activeComposerAction === "Live") && (
              <div className="mt-4">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder={
                    activeComposerAction === "Live"
                      ? "Paste a live stream or video URL"
                      : "Paste a YouTube or video URL"
                  }
                  className="w-full px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
                />
              </div>
            )}

            <div className="flex justify-end mt-5">
              <button
                onClick={handleCreatePost}
                disabled={posting}
                className="px-6 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {feedTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveFeedTab(tab);
                  if (tab === "Videos") router.push("/videos");
                  if (tab === "Creators" || tab === "Faith" || tab === "Business") {
                    // stays in feed, only filters posts
                  }
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeFeedTab === tab
                    ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-slate-300">
              No posts found for this section yet.
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => {
                const authorName = getBestNameForUser(post.user_id, post.full_name);
                const authorAvatar = getBestAvatarForUser(
                  post.user_id,
                  post.full_name,
                  post.avatar_url
                );
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

                      {post.user_id === userId && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="px-4 py-2 text-xs text-red-200 border rounded-2xl border-red-400/20 bg-red-500/10 hover:bg-red-500/20"
                        >
                          Delete
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
                            title={`feed-video-${post.id}`}
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
                      <button
                        onClick={() => handleToggleLike(post.id, post.user_id)}
                        className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                          isLiked(post.id)
                            ? "border border-cyan-400/20 bg-cyan-500/20 text-cyan-200"
                            : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        ❤️ {likesCount}
                      </button>

                      <Link
                        href={`/post/${post.id}`}
                        className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      >
                        💬 {commentsCount}
                      </Link>

                      <button
                        onClick={() => handleToggleSave(post.id)}
                        className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                          isSaved(post.id)
                            ? "border border-cyan-400/20 bg-cyan-500/20 text-cyan-200"
                            : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {isSaved(post.id) ? "Saved" : "Save"}
                      </button>

                      <Link
                        href={`/post/${post.id}`}
                        className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10"
                      >
                        Open post
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-cyan-200">Notifications</p>
              <Link href="/notifications" className="text-xs text-cyan-300 hover:text-cyan-200">
                View all
              </Link>
            </div>

            <div className="px-4 py-3 mt-4 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-200">
              Unread notifications: {unreadNotificationsCount}
            </div>

            <div className="mt-4 space-y-3">
              {notifications.slice(0, 4).map((notification) => (
                <div
                  key={notification.id}
                  className="px-4 py-3 border rounded-2xl border-white/10 bg-white/5"
                >
                  <p className="text-sm text-white">
                    {notification.actor_name || "Someone"} {notification.type}
                    {notification.content ? `: ${notification.content}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              ))}

              {notifications.length === 0 && (
                <p className="text-sm text-slate-400">No notifications yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-cyan-200">Trending videos</p>
              <Link href="/videos" className="text-xs text-cyan-300 hover:text-cyan-200">
                Open videos
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {videos.slice(0, 3).map((video) => (
                <Link
                  key={video.id}
                  href="/videos"
                  className="block p-4 border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                >
                  <p className="font-medium text-white">{video.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {(video.views_count || 0).toLocaleString()} views
                  </p>
                </Link>
              ))}

              {videos.length === 0 && (
                <p className="text-sm text-slate-400">No videos published yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-cyan-200">Popular communities</p>
              <Link href="/communities" className="text-xs text-cyan-300 hover:text-cyan-200">
                Open communities
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {communities.slice(0, 4).map((community) => {
                const memberCount = communityMembers.filter(
                  (member) => member.community_id === community.id
                ).length;

                return (
                  <Link
                    key={community.id}
                    href={`/communities/${community.id}`}
                    className="block p-4 border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    <p className="font-medium text-white">{community.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {community.category || "Community"} • {memberCount} members
                    </p>
                  </Link>
                );
              })}

              {communities.length === 0 && (
                <p className="text-sm text-slate-400">No communities created yet.</p>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}