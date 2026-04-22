"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import MobileBottomNav from "../../components/MobileBottomNav";

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
const feedTabs = [
  "For You",
  "Following",
  "Creators",
  "Videos",
  "Faith",
  "Business",
] as const;

const storyGradients = [
  "from-cyan-400 via-blue-500 to-indigo-600",
  "from-fuchsia-500 via-pink-500 to-orange-400",
  "from-emerald-400 via-teal-500 to-cyan-500",
  "from-amber-400 via-orange-500 to-rose-500",
  "from-violet-500 via-purple-500 to-blue-500",
];

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
    let result = [...posts];

    switch (activeFeedTab) {
      case "Following":
        result = result.filter((post) => post.user_id !== userId);
        break;
      case "Creators":
        result = result.filter((post) => {
          const profile = getProfileById(post.user_id);
          return !!profile?.username;
        });
        break;
      case "Faith":
        result = result.filter((post) => {
          const text = `${post.content} ${post.full_name || ""}`.toLowerCase();
          return text.includes("faith") || text.includes("jesus") || text.includes("church");
        });
        break;
      case "Business":
        result = result.filter((post) => {
          const text = `${post.content} ${post.full_name || ""}`.toLowerCase();
          return (
            text.includes("business") ||
            text.includes("market") ||
            text.includes("brand") ||
            text.includes("money")
          );
        });
        break;
      case "Videos":
        result = result.filter((post) => !!post.video_url);
        break;
      case "For You":
      default:
        break;
    }

    const term = searchText.trim().toLowerCase();
    if (!term) return result;

    return result.filter((post) => {
      const author = getBestNameForUser(post.user_id, post.full_name).toLowerCase();
      const text = `${post.content} ${author}`.toLowerCase();
      return text.includes(term);
    });
  }, [activeFeedTab, posts, userId, profiles, searchText]);

  const highlightedProfiles = useMemo(() => {
    return profiles.filter((profile) => profile.id !== userId).slice(0, 6);
  }, [profiles, userId]);

  const suggestedCommunities = useMemo(() => {
    return communities.filter((community) => !myCommunityIds.includes(community.id)).slice(0, 4);
  }, [communities, myCommunityIds]);

  const trendingTopics = useMemo(() => {
    const topics = [
      "Faith creators",
      "Short videos",
      "Business tips",
      "Music sessions",
      "Community stories",
    ];

    return topics.map((topic, index) => ({
      name: topic,
      pulse: `${12 + index * 7}k`,
    }));
  }, []);

  const latestVideoCards = useMemo(() => videos.slice(0, 3), [videos]);

  const latestActivity = useMemo(() => notifications.slice(0, 4), [notifications]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817] text-white">
        Loading FaceGrem feed...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020817] pb-24 text-white xl:pb-0">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_25%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.08),transparent_22%),linear-gradient(to_bottom,#020817,#07111f_45%,#020817)]" />
        <div className="absolute rounded-full -left-20 top-24 h-72 w-72 bg-cyan-400/10 blur-3xl" />
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
                <p className="text-xs text-slate-400">Your social world, live now</p>
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
                  placeholder="Search posts, creators, communities, topics..."
                  className="w-full text-sm text-white bg-transparent outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Link
              href="/messages"
              className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 md:inline-flex"
            >
              Messages
            </Link>

            <div className="relative">
              <Link
                href="/notifications"
                className="inline-flex items-center justify-center text-sm transition border h-11 w-11 rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              >
                🔔
              </Link>

              {unreadNotificationsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-cyan-400 px-1 text-[11px] font-bold text-slate-950 shadow-lg">
                  {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                </span>
              )}
            </div>

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
                placeholder="Search FaceGrem..."
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
              <Link href="/profile" className="flex items-center gap-3">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="object-cover h-14 w-14 rounded-2xl ring-2 ring-cyan-400/20"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{userName}</p>
                  <p className="text-sm truncate text-slate-400">Welcome back to FaceGrem</p>
                </div>
              </Link>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">Saved</p>
                  <p className="mt-1 text-sm font-semibold text-white">{savedPosts.length}</p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">Alerts</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {unreadNotificationsCount}
                  </p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">Groups</p>
                  <p className="mt-1 text-sm font-semibold text-white">{myCommunityIds.length}</p>
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
                    Watch videos
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
                  href="/saved"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">🔖</span>
                    Saved posts
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
                <p className="text-sm font-semibold text-cyan-200">Your communities</p>
                <Link
                  href="/communities"
                  className="text-xs transition text-cyan-300 hover:text-cyan-200"
                >
                  View all
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {communities.filter((community) => myCommunityIds.includes(community.id))
                  .length === 0 ? (
                  <p className="text-sm leading-6 text-slate-400">
                    Join communities to keep your favorite spaces close.
                  </p>
                ) : (
                  communities
                    .filter((community) => myCommunityIds.includes(community.id))
                    .slice(0, 4)
                    .map((community) => (
                      <Link
                        key={community.id}
                        href={`/communities/${community.id}`}
                        className="block px-4 py-3 transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
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
          </div>
        </aside>

        <section className="min-w-0 space-y-5 sm:space-y-6">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,47,73,0.95),rgba(15,23,42,0.95)_55%,rgba(30,41,59,0.95))] p-6 shadow-[0_30px_120px_rgba(6,182,212,0.10)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-cyan-200">Welcome back</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Good to see you, {userName.split(" ")[0]}.
                </h2>
                <p className="max-w-xl mt-3 text-sm leading-7 text-slate-300">
                  Discover what people are sharing right now across FaceGrem — moments,
                  ideas, videos, conversations, and communities.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:min-w-[320px]">
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">Posts</p>
                  <p className="mt-2 text-2xl font-bold text-white">{posts.length}</p>
                </div>
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">Videos</p>
                  <p className="mt-2 text-2xl font-bold text-white">{videos.length}</p>
                </div>
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">Communities</p>
                  <p className="mt-2 text-2xl font-bold text-white">{communities.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[28px] border border-white/10 bg-white/5 p-3 backdrop-blur-xl sm:rounded-[30px] sm:p-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold text-cyan-200">Stories</p>
                <p className="text-xs text-slate-400">Quick moments from people around you</p>
              </div>

              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium text-slate-300 transition hover:bg-white/10 sm:px-4 sm:text-xs"
              >
                See all
              </button>
            </div>

            <div className="flex gap-3 min-w-max sm:gap-4">
              <button
                type="button"
                className="group relative h-48 w-28 shrink-0 overflow-hidden rounded-[26px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(34,211,238,0.18),rgba(59,130,246,0.3))] p-1 text-left shadow-[0_20px_45px_rgba(34,211,238,0.12)] transition duration-300 hover:-translate-y-1 sm:h-52 sm:w-36 sm:rounded-[30px]"
              >
                <div className="relative h-full overflow-hidden rounded-[22px] bg-[#0f172a] sm:rounded-[26px]">
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="absolute inset-0 object-cover w-full h-full transition duration-300 opacity-70 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-[#020817]/15 to-transparent" />

                  <div className="relative flex flex-col justify-between h-full p-3 sm:p-4">
                    <div className="flex items-center justify-center w-10 h-10 text-xl font-semibold text-white shadow-lg rounded-2xl bg-cyan-500 shadow-cyan-500/30 sm:h-12 sm:w-12 sm:text-2xl">
                      +
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">Create story</p>
                      <p className="mt-1 text-[11px] text-white/75 sm:text-xs">
                        Share a quick moment
                      </p>
                    </div>
                  </div>
                </div>
              </button>

              {highlightedProfiles.map((profile, index) => (
                <Link
                  key={profile.id}
                  href={`/profile?id=${profile.id}`}
                  className={`group relative h-48 w-28 shrink-0 overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br ${
                    storyGradients[index % storyGradients.length]
                  } p-1 shadow-[0_20px_45px_rgba(15,23,42,0.22)] transition duration-300 hover:-translate-y-1 sm:h-52 sm:w-36 sm:rounded-[30px]`}
                >
                  <div className="relative h-full overflow-hidden rounded-[22px] bg-[#0f172a] sm:rounded-[26px]">
                    <img
                      src={
                        profile.avatar_url ||
                        getAvatarUrl(profile.full_name || "FaceGrem User")
                      }
                      alt={profile.full_name}
                      className="absolute inset-0 object-cover w-full h-full transition duration-300 opacity-85 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-black/10" />

                    <div className="relative flex flex-col justify-between h-full p-3 sm:p-4">
                      <img
                        src={
                          profile.avatar_url ||
                          getAvatarUrl(profile.full_name || "FaceGrem User")
                        }
                        alt={profile.full_name}
                        className="object-cover w-10 h-10 border-2 shadow-lg rounded-2xl border-cyan-300/90 sm:h-12 sm:w-12"
                      />

                      <div>
                        <p className="text-sm font-semibold text-white line-clamp-2">
                          {profile.full_name}
                        </p>
                        <p className="mt-1 text-[11px] text-white/75 sm:text-xs">
                          @{profile.username || "member"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.92)_45%,rgba(15,23,42,0.96))] shadow-[0_25px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:rounded-[34px]">
            <div className="px-4 py-4 border-b border-white/10 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-cyan-200">Create post</p>
                  <p className="mt-1 text-xs text-slate-400 sm:block">
                    Share a thought, photo, story, or video with FaceGrem
                  </p>
                </div>

                <div className="items-center hidden gap-2 sm:flex">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                    Public post
                  </span>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">
                    Live composer
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="object-cover w-12 h-12 rounded-2xl ring-2 ring-cyan-400/15 sm:h-14 sm:w-14"
                />

                <div className="flex-1 min-w-0">
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-3 sm:rounded-[26px] sm:p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-3 sm:gap-3">
                      <p className="font-medium text-white">{userName}</p>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                        Posting to everyone
                      </span>
                    </div>

                    <textarea
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      rows={4}
                      placeholder="What’s on your mind today?"
                      className="w-full resize-none bg-transparent text-[15px] leading-7 text-white placeholder:text-slate-400 outline-none sm:leading-8"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-5 sm:gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => setActiveComposerAction(action)}
                    className={`rounded-full px-4 py-2.5 text-sm font-medium transition sm:px-5 sm:py-3 ${
                      activeComposerAction === action
                        ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                        : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>

              {(activeComposerAction === "Photo" ||
                activeComposerAction === "Story") && (
                <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 sm:mt-5 sm:rounded-[26px]">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {activeComposerAction === "Story" ? "Story image" : "Photo upload"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Add a strong visual to make your post stand out
                    </p>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-4 block w-full rounded-2xl text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500/20 file:px-4 file:py-2.5 file:text-cyan-200"
                  />

                  {imagePreview && (
                    <div className="mt-4 overflow-hidden rounded-[20px] border border-white/10 sm:rounded-[24px]">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="object-cover w-full max-h-96"
                      />
                    </div>
                  )}
                </div>
              )}

              {(activeComposerAction === "Video" ||
                activeComposerAction === "Live") && (
                <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 sm:mt-5 sm:rounded-[26px]">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {activeComposerAction === "Live"
                        ? "Live stream link"
                        : "Video link"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Paste a YouTube link or direct video URL
                    </p>
                  </div>

                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder={
                      activeComposerAction === "Live"
                        ? "Paste a live stream or video URL"
                        : "Paste a YouTube or video URL"
                    }
                    className="w-full px-4 py-3 mt-4 text-sm text-white transition border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                  />
                </div>
              )}

              <div className="flex flex-col gap-4 pt-4 mt-5 border-t border-white/10 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                    Text
                  </span>
                  {imagePreview && (
                    <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1.5 text-xs text-fuchsia-200">
                      Image attached
                    </span>
                  )}
                  {videoUrl.trim() && (
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">
                      Video linked
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setPostText("");
                      setVideoUrl("");
                      setImageFile(null);
                      setImagePreview("");
                      setActiveComposerAction("Photo");
                    }}
                    className="px-4 py-3 text-sm font-medium transition border rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  >
                    Clear
                  </button>

                  <button
                    onClick={handleCreatePost}
                    disabled={posting}
                    className="px-4 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70 sm:px-6"
                  >
                    {posting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
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
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeFeedTab === tab
                    ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
              <p className="text-lg font-medium text-white">No posts found here yet.</p>
              <p className="mt-2 text-sm text-slate-400">
                Try another feed tab or create the first post.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => {
                const authorProfile = getProfileById(post.user_id);
                const authorName = getBestNameForUser(post.user_id, post.full_name);
                const authorAvatar = getBestAvatarForUser(
                  post.user_id,
                  post.full_name,
                  post.avatar_url
                );
                const likesCount = getPostLikesCount(post.id);
                const commentsCount = getPostCommentsCount(post.id);

                const latestComments = comments
                  .filter((comment) => comment.post_id === post.id)
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime()
                  )
                  .slice(0, 2);

                return (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <Link
                          href={`/profile?id=${post.user_id}`}
                          className="flex items-center min-w-0 gap-3 hover:opacity-90"
                        >
                          <img
                            src={authorAvatar}
                            alt={authorName}
                            className="object-cover w-12 h-12 rounded-2xl ring-1 ring-white/10"
                          />

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-white truncate">
                                {authorName}
                              </p>

                              {authorProfile?.username && (
                                <span className="text-sm truncate text-slate-400">
                                  @{authorProfile.username}
                                </span>
                              )}

                              <span className="hidden w-1 h-1 rounded-full bg-slate-500 sm:block" />

                              <span className="text-xs text-slate-400">
                                {new Date(post.created_at).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                                Public
                              </span>

                              {post.video_url && (
                                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-200">
                                  Video post
                                </span>
                              )}

                              {post.image_url && !post.video_url && (
                                <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2.5 py-1 text-[11px] text-fuchsia-200">
                                  Photo post
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>

                        {post.user_id === userId && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="px-4 py-2 text-xs text-red-200 transition border rounded-2xl border-red-400/20 bg-red-500/10 hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      {post.content && (
                        <div className="mt-5">
                          <p className="text-[15px] leading-8 text-slate-200">
                            {post.content}
                          </p>
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
                              title={`feed-video-${post.id}`}
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
                            {commentsCount}{" "}
                            {commentsCount === 1 ? "comment" : "comments"}
                          </div>
                        </div>

                        <Link
                          href={`/post/${post.id}`}
                          className="text-sm font-medium transition text-cyan-300 hover:text-cyan-200"
                        >
                          View discussion
                        </Link>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                        <button
                          onClick={() => handleToggleLike(post.id, post.user_id)}
                          className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                            isLiked(post.id)
                              ? "border border-cyan-400/20 bg-cyan-500/20 text-cyan-200"
                              : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {isLiked(post.id) ? "Liked" : "Like"}
                        </button>

                        <Link
                          href={`/post/${post.id}`}
                          className="px-4 py-3 text-sm font-medium text-center transition border rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        >
                          Comment
                        </Link>

                        <button
                          onClick={() => handleToggleSave(post.id)}
                          className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                            isSaved(post.id)
                              ? "border border-cyan-400/20 bg-cyan-500/20 text-cyan-200"
                              : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {isSaved(post.id) ? "Saved" : "Save"}
                        </button>

                        <Link
                          href={`/post/${post.id}`}
                          className="px-4 py-3 text-sm font-medium text-center transition border rounded-2xl border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10"
                        >
                          Open
                        </Link>
                      </div>

                      {latestComments.length > 0 && (
                        <div className="pt-4 mt-5 space-y-3 border-t border-white/10">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Recent comments
                          </p>

                          {latestComments.map((comment) => {
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
                                className="flex items-start gap-3 px-3 py-3 border rounded-2xl border-white/10 bg-white/5"
                              >
                                <img
                                  src={commentAuthorAvatar}
                                  alt={commentAuthorName}
                                  className="object-cover h-9 w-9 rounded-xl"
                                />

                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-white">
                                      {commentAuthorName}
                                    </p>
                                    <span className="text-[11px] text-slate-400">
                                      {new Date(comment.created_at).toLocaleString()}
                                    </span>
                                  </div>

                                  <p className="mt-1 text-sm leading-6 line-clamp-2 text-slate-300">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
                <p className="text-sm font-semibold text-cyan-200">Live activity</p>
                <p className="mt-1 text-xs text-slate-400">What’s happening around you</p>
              </div>
              <Link
                href="/notifications"
                className="text-xs transition text-cyan-300 hover:text-cyan-200"
              >
                View all
              </Link>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.10),rgba(255,255,255,0.04))] px-4 py-4">
              <p className="text-xs text-slate-400">Unread notifications</p>
              <p className="mt-1 text-3xl font-bold text-white">{unreadNotificationsCount}</p>
            </div>

            <div className="mt-4 space-y-3">
              {latestActivity.length === 0 ? (
                <p className="text-sm text-slate-400">No notifications yet.</p>
              ) : (
                latestActivity.map((notification) => (
                  <div
                    key={notification.id}
                    className="px-4 py-3 border rounded-2xl border-white/10 bg-white/5"
                  >
                    <p className="text-sm leading-6 text-white">
                      <span className="font-medium">
                        {notification.actor_name || "Someone"}
                      </span>{" "}
                      {notification.type}
                      {notification.content ? `: ${notification.content}` : ""}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">Trending now</p>
                <p className="mt-1 text-xs text-slate-400">Popular topics across FaceGrem</p>
              </div>
              <span className="text-xs text-slate-400">Live</span>
            </div>

            <div className="mt-4 space-y-3">
              {trendingTopics.map((topic, index) => (
                <div
                  key={topic.name}
                  className="flex items-center justify-between px-4 py-3 border rounded-2xl border-white/10 bg-white/5"
                >
                  <div>
                    <p className="text-[11px] text-slate-400">#{index + 1} trending</p>
                    <p className="mt-1 font-medium text-white">{topic.name}</p>
                  </div>
                  <span className="px-3 py-1 text-xs rounded-full bg-cyan-500/10 text-cyan-200">
                    {topic.pulse}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">Trending videos</p>
                <p className="mt-1 text-xs text-slate-400">Watch what people are sharing</p>
              </div>
              <Link
                href="/videos"
                className="text-xs transition text-cyan-300 hover:text-cyan-200"
              >
                Open videos
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {latestVideoCards.length === 0 ? (
                <p className="text-sm text-slate-400">No videos published yet.</p>
              ) : (
                latestVideoCards.map((video) => (
                  <Link
                    key={video.id}
                    href="/videos"
                    className="block p-4 transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    <p className="font-medium text-white">{video.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {(video.views_count || 0).toLocaleString()} views
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">Suggested communities</p>
                <p className="mt-1 text-xs text-slate-400">Find spaces to join next</p>
              </div>
              <Link
                href="/communities"
                className="text-xs transition text-cyan-300 hover:text-cyan-200"
              >
                Discover
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {suggestedCommunities.length === 0 ? (
                <p className="text-sm text-slate-400">
                  You are already in all visible communities.
                </p>
              ) : (
                suggestedCommunities.map((community) => {
                  const memberCount = communityMembers.filter(
                    (member) => member.community_id === community.id
                  ).length;

                  return (
                    <Link
                      key={community.id}
                      href={`/communities/${community.id}`}
                      className="block p-4 transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                    >
                      <p className="font-medium text-white">{community.name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {community.category || "Community"} • {memberCount} members
                      </p>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </main>

      <MobileBottomNav unreadNotificationsCount={unreadNotificationsCount} />
    </div>
  );
}