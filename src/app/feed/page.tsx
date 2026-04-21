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
    return profiles
      .filter((profile) => profile.id !== userId)
      .slice(0, 6);
  }, [profiles, userId]);

  const suggestedCommunities = useMemo(() => {
    return communities
      .filter((community) => !myCommunityIds.includes(community.id))
      .slice(0, 4);
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
    <div className="min-h-screen bg-[#020817] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_25%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.08),transparent_22%),linear-gradient(to_bottom,#020817,#07111f_45%,#020817)]" />
        <div className="absolute rounded-full -left-20 top-24 h-72 w-72 bg-cyan-400/10 blur-3xl" />
        <div className="absolute top-0 right-0 rounded-full h-96 w-96 bg-blue-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020817]/80 backdrop-blur-2xl">
        <div className="flex items-center gap-4 px-4 py-4 mx-auto max-w-7xl sm:px-6">
          <Link href="/feed" className="flex items-center gap-3">
            <div className="flex items-center justify-center font-bold shadow-lg h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/30">
              F
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight">FaceGrem</h1>
              <p className="text-xs text-slate-400">Social feed</p>
            </div>
          </Link>

          <div className="flex-1 hidden md:block">
            <div className="max-w-xl mx-auto">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search posts, creators, topics..."
                className="w-full px-4 py-3 text-sm text-white transition border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Link
              href="/videos"
              className="px-4 py-2 text-sm transition border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Videos
            </Link>
            <Link
              href="/communities"
              className="px-4 py-2 text-sm transition border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Communities
            </Link>
            <Link
              href="/messages"
              className="px-4 py-2 text-sm transition border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Messages
            </Link>
            <Link
              href="/saved"
              className="hidden px-4 py-2 text-sm transition border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 sm:inline-flex"
            >
              Saved
            </Link>
            <Link
              href="/profile"
              className="hidden px-4 py-2 text-sm transition border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 sm:inline-flex"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="hidden xl:block">
          <div className="sticky top-[96px] space-y-5">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <Link href="/profile" className="flex items-center gap-3">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="object-cover h-14 w-14 rounded-2xl ring-2 ring-cyan-400/20"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{userName}</p>
                  <p className="text-sm text-slate-400">See your profile</p>
                </div>
              </Link>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                Explore
              </p>
              <div className="mt-4 space-y-2">
                <Link
                  href="/feed"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl bg-white/5 hover:bg-white/10"
                >
                  <span>Home feed</span>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link
                  href="/videos"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl bg-white/5 hover:bg-white/10"
                >
                  <span>Watch videos</span>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link
                  href="/communities"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl bg-white/5 hover:bg-white/10"
                >
                  <span>Discover communities</span>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link
                  href="/messages"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl bg-white/5 hover:bg-white/10"
                >
                  <span>Open messages</span>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link
                  href="/saved"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl bg-white/5 hover:bg-white/10"
                >
                  <span>Saved posts</span>
                  <span className="text-slate-400">→</span>
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                Your communities
              </p>
              <div className="mt-4 space-y-3">
                {communities.filter((community) => myCommunityIds.includes(community.id)).length ===
                0 ? (
                  <p className="text-sm leading-6 text-slate-400">
                    Join communities to see them here.
                  </p>
                ) : (
                  communities
                    .filter((community) => myCommunityIds.includes(community.id))
                    .slice(0, 4)
                    .map((community) => (
                      <Link
                        key={community.id}
                        href={`/communities/${community.id}`}
                        className="block px-4 py-3 transition rounded-2xl bg-white/5 hover:bg-white/10"
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

        <section className="min-w-0 space-y-6">
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

          <div className="overflow-x-auto rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="flex gap-4 min-w-max">
              <button
                type="button"
                className="group relative h-48 w-32 shrink-0 overflow-hidden rounded-[28px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(34,211,238,0.18),rgba(59,130,246,0.25))] p-4 text-left"
              >
                <img
                  src={userAvatar}
                  alt={userName}
                  className="absolute inset-x-0 top-0 object-cover w-full h-32 opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-[#020817]/20 to-transparent" />
                <div className="relative flex flex-col justify-between h-full">
                  <div className="flex items-center justify-center text-2xl font-semibold text-white shadow-lg h-11 w-11 rounded-2xl bg-cyan-500">
                    +
                  </div>
                  <p className="text-sm font-semibold text-white">Create story</p>
                </div>
              </button>

              {highlightedProfiles.map((profile, index) => (
                <Link
                  key={profile.id}
                  href={`/profile?id=${profile.id}`}
                  className={`relative h-48 w-32 shrink-0 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${storyGradients[index % storyGradients.length]} p-1`}
                >
                  <div className="absolute inset-0 bg-black/30" />
                  <img
                    src={
                      profile.avatar_url ||
                      getAvatarUrl(profile.full_name || "FaceGrem User")
                    }
                    alt={profile.full_name}
                    className="absolute inset-0 object-cover w-full h-full opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-transparent" />
                  <div className="relative flex flex-col justify-between h-full p-3">
                    <img
                      src={
                        profile.avatar_url ||
                        getAvatarUrl(profile.full_name || "FaceGrem User")
                      }
                      alt={profile.full_name}
                      className="object-cover border-2 h-11 w-11 rounded-2xl border-cyan-300"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white line-clamp-2">
                        {profile.full_name}
                      </p>
                      <p className="mt-1 text-xs text-white/75">
                        @{profile.username || "member"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <img
                src={userAvatar}
                alt={userName}
                className="object-cover h-14 w-14 rounded-2xl ring-2 ring-cyan-400/15"
              />
              <div className="flex-1 min-w-0">
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  rows={3}
                  placeholder={`What do you want to share today?`}
                  className="w-full resize-none rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-400/40"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-5">
              {quickActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => setActiveComposerAction(action)}
                  className={`rounded-full px-5 py-3 text-sm font-medium transition ${
                    activeComposerAction === action
                      ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>

            {(activeComposerAction === "Photo" || activeComposerAction === "Story") && (
              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 p-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full rounded-2xl text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500/20 file:px-4 file:py-2.5 file:text-cyan-200"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-4 max-h-80 w-full rounded-[24px] object-cover"
                  />
                )}
              </div>
            )}

            {(activeComposerAction === "Video" || activeComposerAction === "Live") && (
              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 p-4">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder={
                    activeComposerAction === "Live"
                      ? "Paste a live stream or video URL"
                      : "Paste a YouTube or video URL"
                  }
                  className="w-full px-4 py-3 text-sm text-white transition border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-4 mt-5">
              <p className="text-xs text-slate-400">
                Share text, photos, and video links on FaceGrem.
              </p>
              <button
                onClick={handleCreatePost}
                disabled={posting}
                className="px-6 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
              >
                {posting ? "Posting..." : "Post to FaceGrem"}
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
                            className="object-cover w-12 h-12 rounded-2xl"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{authorName}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(post.created_at).toLocaleString()}
                            </p>
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
                        <p className="mt-5 text-[15px] leading-8 text-slate-200">
                          {post.content}
                        </p>
                      )}
                    </div>

                    {post.image_url && (
                      <div className="border-y border-white/10 bg-black/20">
                        <img
                          src={post.image_url}
                          alt="Post"
                          className="max-h-[700px] w-full object-cover"
                        />
                      </div>
                    )}

                    {post.video_url && (
                      <div className="border-y border-white/10 bg-black/30">
                        {isYouTubeUrl(post.video_url) ? (
                          <iframe
                            src={getYouTubeEmbedUrl(post.video_url)}
                            title={`feed-video-${post.id}`}
                            className="h-80 w-full md:h-[460px]"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            controls
                            className="h-80 w-full bg-black md:h-[460px]"
                            src={post.video_url}
                          />
                        )}
                      </div>
                    )}

                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-center gap-3">
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
                          className="px-4 py-2 text-sm transition border rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
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
                          className="px-4 py-2 text-sm transition border rounded-2xl border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10"
                        >
                          Open post
                        </Link>
                      </div>
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
              <p className="text-sm font-semibold text-cyan-200">Live activity</p>
              <Link href="/notifications" className="text-xs text-cyan-300 hover:text-cyan-200">
                View all
              </Link>
            </div>

            <div className="px-4 py-3 mt-4 border rounded-2xl border-white/10 bg-white/5">
              <p className="text-xs text-slate-400">Unread notifications</p>
              <p className="mt-1 text-2xl font-bold text-white">{unreadNotificationsCount}</p>
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

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-cyan-200">Trending now</p>
              <span className="text-xs text-slate-400">Updated live</span>
            </div>

            <div className="mt-4 space-y-3">
              {trendingTopics.map((topic, index) => (
                <div
                  key={topic.name}
                  className="flex items-center justify-between px-4 py-3 border rounded-2xl border-white/10 bg-white/5"
                >
                  <div>
                    <p className="text-xs text-slate-400">#{index + 1}</p>
                    <p className="mt-1 font-medium text-white">{topic.name}</p>
                  </div>
                  <span className="px-3 py-1 text-xs rounded-full bg-cyan-500/10 text-cyan-200">
                    {topic.pulse}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-cyan-200">Trending videos</p>
              <Link href="/videos" className="text-xs text-cyan-300 hover:text-cyan-200">
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

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-cyan-200">Suggested communities</p>
              <Link
                href="/communities"
                className="text-xs text-cyan-300 hover:text-cyan-200"
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
    </div>
  );
}