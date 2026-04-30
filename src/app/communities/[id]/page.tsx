"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "../../../components/LanguageProvider";
import NotificationDropdown from "../../../components/NotificationDropdown";
import FaceGremLogo from "../../../components/FaceGremLogo";
import { CommunityCircleIcon, GroupPeopleIcon, MessageBubblesIcon, TranslateLanguageIcon } from "../../../components/FaceGremCustomIcons";
import FaceGremHamburgerMenu from "../../../components/FaceGremHamburgerMenu";

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

type TranslationLanguage = "en" | "sw" | "fr" | "rw";

const languageLabels: Record<TranslationLanguage, string> = {
  en: "English",
  sw: "Swahili",
  fr: "French",
  rw: "Kinyarwanda",
};

/* Page text now comes from the shared FaceGrem language provider. */


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

export default function CommunityDetailPage() {
  const router = useRouter();
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const params = useParams<{ id: string }>();
  const communityId = params?.id || "";

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");
  const [userAvatar, setUserAvatar] = useState("");

  const [community, setCommunity] = useState<CommunityRecord | null>(null);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [communityMembers, setCommunityMembers] = useState<CommunityMemberRecord[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [likes, setLikes] = useState<LikeRecord[]>([]);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [postText, setPostText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [posting, setPosting] = useState(false);
  const [searchText, setSearchText] = useState("");

  const { language: selectedLanguage, setLanguage: setSelectedLanguage, t } = useLanguage();

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
    const loadCommunity = async () => {
      if (!communityId) return;

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
        { data: communityData, error: communityError },
        { data: profilesData },
        { data: membersData },
        { data: postsData },
        { data: likesData },
        { data: commentsData },
        { data: notificationsData },
      ] = await Promise.all([
        supabase
          .from("communities")
          .select("id, creator_id, name, category, description, created_at")
          .eq("id", communityId)
          .single(),
        supabase.from("profiles").select("id, full_name, username, bio, avatar_url"),
        supabase
          .from("community_members")
          .select("id, community_id, user_id, created_at")
          .eq("community_id", communityId),
        supabase
          .from("posts")
          .select(
            "id, user_id, content, created_at, full_name, avatar_url, image_url, video_url, community_id"
          )
          .eq("community_id", communityId)
          .order("created_at", { ascending: false }),
        supabase.from("likes").select("id, post_id, user_id"),
        supabase
          .from("comments")
          .select("id, post_id, user_id, full_name, content, created_at"),
        supabase
          .from("notifications")
          .select("id, user_id, actor_id, type, post_id, actor_name, content, is_read, created_at")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false }),
      ]);

      if (communityError || !communityData) {
        alert(communityError?.message || "Community not found.");
        router.push("/communities");
        return;
      }

      const allProfiles = profilesData || [];
      const myProfile = allProfiles.find((profile) => profile.id === currentUserId);

      setCommunity(communityData);
      setProfiles(allProfiles);
      setCommunityMembers(membersData || []);
      setPosts(postsData || []);
      setLikes(likesData || []);
      setComments(commentsData || []);
      setNotifications(notificationsData || []);
      setUserAvatar(
        myProfile?.avatar_url || getAvatarUrl(myProfile?.full_name || currentUserName)
      );
      setLoading(false);
    };

    void loadCommunity();
  }, [communityId, router]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target as Node)
      ) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (language: TranslationLanguage) => {
    setSelectedLanguage(language);
    setIsLanguageMenuOpen(false);
  };

  const handleLogout = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      setSigningOut(false);
      return;
    }

    router.push("/");
  };

  const unreadNotificationsCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const isMember = useMemo(() => {
    return communityMembers.some(
      (member) => member.community_id === communityId && member.user_id === userId
    );
  }, [communityId, communityMembers, userId]);

  const membersCount = communityMembers.length;

  const creatorName = useMemo(() => {
    if (!community) return "FaceGrem User";
    return getBestNameForUser(community.creator_id);
  }, [community, profiles]);

  const creatorAvatar = useMemo(() => {
    if (!community) return getAvatarUrl("FaceGrem User");
    return getBestAvatarForUser(community.creator_id);
  }, [community, profiles]);

  const filteredPosts = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return posts;

    return posts.filter((post) => {
      const author = getBestNameForUser(post.user_id, post.full_name).toLowerCase();
      const text = `${post.content} ${author}`.toLowerCase();
      return text.includes(term);
    });
  }, [posts, searchText, profiles]);

  const getPostLikesCount = (postId: string) =>
    likes.filter((like) => like.post_id === postId).length;

  const getPostCommentsCount = (postId: string) =>
    comments.filter((comment) => comment.post_id === postId).length;

  const isLiked = (postId: string) =>
    likes.some((like) => like.user_id === userId && like.post_id === postId);

  const recentMembers = useMemo(() => {
    return communityMembers
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 4)
      .map((member) => getProfileById(member.user_id))
      .filter(Boolean) as ProfileRecord[];
  }, [communityMembers, profiles]);

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

  const handleJoinOrLeaveCommunity = async () => {
    if (!communityId || !userId) return;

    if (isMember) {
      const existingMember = communityMembers.find(
        (member) => member.community_id === communityId && member.user_id === userId
      );

      if (!existingMember) return;

      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("id", existingMember.id);

      if (error) {
        alert(error.message);
        return;
      }

      setCommunityMembers((prev) =>
        prev.filter((member) => member.id !== existingMember.id)
      );
      return;
    }

    const { data, error } = await supabase
      .from("community_members")
      .insert([
        {
          community_id: communityId,
          user_id: userId,
        },
      ])
      .select("id, community_id, user_id, created_at");

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setCommunityMembers((prev) => [...prev, data[0]]);
    }
  };

  const handleCreateCommunityPost = async () => {
    if (!userId || !communityId) return;

    if (!isMember) {
      alert("Join this community before posting.");
      return;
    }

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
            community_id: communityId,
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
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not create post.");
    }

    setPosting(false);
  };

  const handleToggleLike = async (postId: string) => {
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
  };

  if (loading || !community) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5] text-[#050505]">
        Loading community...
      </div>
    );
  }

  const activeCommunity = community;

  return (
    <div className="min-h-screen bg-[#f0f2f5] pb-24 text-[#050505] xl:pb-0">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-base text-slate-700 shadow-sm transition hover:bg-slate-200"
              aria-label="Open menu"
            >
              ☰
            </button>

            <div className="flex items-center gap-3">
              <FaceGremLogo
                href="/feed"
                showWordmark={false}
                markClassName="h-10 w-10 rounded-2xl ring-0 shadow-sm sm:h-11 sm:w-11"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold tracking-tight text-[#050505]">FaceGrem</h1>
                <p className="text-xs text-slate-500">{t.community}</p>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mx-auto max-w-xl">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition focus-within:border-cyan-400/40 sm:px-4 lg:py-3">
                <span className="text-sm text-slate-500">⌕</span>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleJoinOrLeaveCommunity}
              className={`hidden rounded-2xl px-4 py-2.5 text-sm font-semibold sm:inline-flex ${
                isMember
                  ? "border border-red-200 bg-red-50 text-red-200 hover:bg-red-100"
                  : "bg-blue-600 text-white shadow-lg shadow-blue-200"
              }`}
            >
              {isMember ? t.leave : t.join}
            </button>

            <div ref={languageMenuRef} className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                aria-label="Language"
                title="Language"
              >
                <TranslateLanguageIcon className="mr-2 h-4 w-4" /> {languageLabels[selectedLanguage]}
              </button>

              {isLanguageMenuOpen && (
                <div className="absolute right-0 top-11 z-[90] w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl backdrop-blur-xl">
                  {(["en", "sw", "fr", "rw"] as TranslationLanguage[]).map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => handleLanguageChange(language)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                        selectedLanguage === language
                          ? "bg-blue-50 text-blue-700"
                          : "text-[#050505] hover:bg-slate-100"
                      }`}
                    >
                      <span>{languageLabels[language]}</span>
                      {selectedLanguage === language && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <NotificationDropdown
              iconClassName="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[13px] text-slate-700 transition hover:bg-slate-100"
            />

            <Link
              href="/profile"
              className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 transition hover:bg-slate-100 md:flex md:px-2 md:pr-3"
            >
              <img
                src={userAvatar}
                alt={userName}
                className="h-8 w-8 rounded-xl object-cover ring-1 ring-cyan-400/15"
              />
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-900 lg:inline-block">
                {userName}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-70 lg:inline-flex"
            >
              {signingOut ? t.signingOut : t.logout}
            </button>
          </div>
        </div>
      </header>

      <FaceGremHamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        userName={userName}
        userAvatar={userAvatar}
        onLogout={handleLogout}
        notificationCount={unreadNotificationsCount}
      />

      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="hidden xl:block">
          <div className="sticky top-[104px] space-y-4">
            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(15,23,42,0.94)_45%,rgba(30,41,59,0.94))] p-4 shadow-[0_20px_60px_rgba(6,182,212,0.10)] backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <img
                  src={creatorAvatar}
                  alt={creatorName}
                  className="object-cover h-14 w-14 rounded-2xl ring-2 ring-cyan-400/20"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{activeCommunity.name}</p>
                  <p className="text-sm truncate text-slate-500">
                    {activeCommunity.category || t.communityFallback}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="px-3 py-3 text-center border rounded-2xl border-slate-200 bg-white/5">
                  <p className="text-[11px] text-slate-500">{t.members}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{membersCount}</p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-slate-200 bg-white/5">
                  <p className="text-[11px] text-slate-500">{t.posts}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{posts.length}</p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-slate-200 bg-white/5">
                  <p className="text-[11px] text-slate-500">Status</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {isMember ? t.joined : t.open}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/5 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-blue-600">{"About"}</p>
              </div>

              <div className="mt-4 space-y-4">
                <div className="p-4 border rounded-2xl border-slate-200 bg-white/5">
                  <p className="text-sm leading-7 text-slate-600">
                    {activeCommunity.description || "No description yet."}
                  </p>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-2xl border-slate-200 bg-white/5">
                  <img
                    src={creatorAvatar}
                    alt={creatorName}
                    className="object-cover w-10 h-10 rounded-2xl"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{creatorName}</p>
                    <p className="text-xs text-slate-500">{t.creator}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-5 sm:space-y-6">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,rgba(8,47,73,0.95),rgba(15,23,42,0.95)_55%,rgba(30,41,59,0.95))] p-6 shadow-[0_30px_120px_rgba(6,182,212,0.10)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-blue-600">{t.community}</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#050505] sm:text-4xl">
                  {activeCommunity.name}
                </h2>
                <p className="max-w-xl mt-3 text-sm leading-7 text-slate-600">
                  {activeCommunity.description ||
                    "A space where people gather, talk, learn, and share together."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:min-w-[320px]">
                <div className="p-4 border rounded-2xl border-slate-200 bg-white/5">
                  <p className="text-xs text-slate-500">{t.members}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{membersCount}</p>
                </div>
                <div className="p-4 border rounded-2xl border-slate-200 bg-white/5">
                  <p className="text-xs text-slate-500">{t.posts}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{posts.length}</p>
                </div>
                <div className="p-4 border rounded-2xl border-slate-200 bg-white/5">
                  <p className="text-xs text-slate-500">Status</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {isMember ? t.joined : t.open}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.92)_45%,rgba(15,23,42,0.96))] shadow-[0_25px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:rounded-[34px]">
            <div className="px-4 py-4 border-b border-slate-200 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-blue-600">Create post</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Share with people inside this community
                  </p>
                </div>

                <span className="rounded-full border border-slate-200 bg-white/5 px-3 py-1.5 text-xs text-slate-600">
                  {isMember ? "Members can post" : "Join to post"}
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <img
                  src={userAvatar || getAvatarUrl(userName)}
                  alt={userName}
                  className="object-cover w-12 h-12 rounded-2xl ring-2 ring-cyan-400/15 sm:h-14 sm:w-14"
                />

                <div className="flex-1 min-w-0">
                  <div className="rounded-[22px] border border-slate-200 bg-white/[0.04] p-3 sm:rounded-[26px] sm:p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-3 sm:gap-3">
                      <p className="font-medium text-slate-900">{userName}</p>
                      <span className="rounded-full border border-slate-200 bg-white/5 px-2.5 py-1 text-[11px] text-slate-600">
                        Posting in {activeCommunity.name}
                      </span>
                    </div>

                    <textarea
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      rows={4}
                      placeholder={
                        isMember
                          ? `What do you want to share with ${activeCommunity.name}?`
                          : "Join this community to post."
                      }
                      disabled={!isMember}
                      className="w-full resize-none bg-transparent text-[15px] leading-7 text-[#050505] placeholder:text-slate-500 outline-none disabled:opacity-60 sm:leading-8"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 mt-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-slate-200 bg-white/[0.04] p-4">
                  <p className="text-sm font-medium text-slate-900">Image upload</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Add a visual to your community post
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={!isMember}
                    className="mt-4 block w-full rounded-2xl text-sm text-[#050505] file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500/20 file:px-4 file:py-2.5 file:text-blue-600 disabled:opacity-60"
                  />

                  {imagePreview && (
                    <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 sm:rounded-[24px]">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="object-cover w-full max-h-80"
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-white/[0.04] p-4">
                  <p className="text-sm font-medium text-slate-900">Video link</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Paste a YouTube or direct video URL
                  </p>

                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Paste a YouTube or video URL"
                    disabled={!isMember}
                    className="w-full px-4 py-3 mt-4 text-sm text-slate-700 transition border outline-none rounded-2xl border-slate-200 bg-white/5 placeholder:text-slate-500 focus:border-cyan-400/40 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4 mt-5 border-t border-slate-200 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-white/5 px-3 py-1.5 text-xs text-slate-600">
                    Community post
                  </span>
                  {imagePreview && (
                    <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1.5 text-xs text-fuchsia-200">
                      Image attached
                    </span>
                  )}
                  {videoUrl.trim() && (
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-blue-600">
                      Video linked
                    </span>
                  )}
                </div>

                <button
                  onClick={handleCreateCommunityPost}
                  disabled={posting || !isMember}
                  className="px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg rounded-2xl bg-blue-600 shadow-blue-200 disabled:opacity-70"
                >
                  {posting ? "Posting..." : "Post to community"}
                </button>
              </div>
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="rounded-[30px] border border-slate-200 bg-white/5 p-8 text-center backdrop-blur-xl">
              <p className="text-lg font-medium text-slate-900">No posts in this community yet.</p>
              <p className="mt-2 text-sm text-slate-500">
                Be the first to start the conversation.
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
                    className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/5 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl"
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
                              <p className="font-semibold text-slate-900 truncate">
                                {authorName}
                              </p>

                              {authorProfile?.username && (
                                <span className="text-sm truncate text-slate-500">
                                  @{authorProfile.username}
                                </span>
                              )}

                              <span className="hidden w-1 h-1 rounded-full bg-slate-500 sm:block" />

                              <span className="text-xs text-slate-500">
                                {new Date(post.created_at).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="rounded-full border border-slate-200 bg-white/5 px-2.5 py-1 text-[11px] text-slate-600">
                                {activeCommunity.name}
                              </span>

                              {post.video_url && (
                                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-blue-600">
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
                      </div>

                      {post.content && (
                        <div className="mt-5">
                          <p className="text-[15px] leading-8 text-slate-700">
                            {post.content}
                          </p>
                        </div>
                      )}
                    </div>

                    {post.image_url && (
                      <div className="px-3 pb-3 border-y border-slate-200 bg-black/20 sm:px-4 sm:pb-4">
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
                      <div className="px-3 pb-3 border-y border-slate-200 bg-black/30 sm:px-4 sm:pb-4">
                        <div className="overflow-hidden rounded-[28px]">
                          {isYouTubeUrl(post.video_url) ? (
                            <iframe
                              src={getYouTubeEmbedUrl(post.video_url)}
                              title={`community-video-${post.id}`}
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
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5">
                            <span className="text-base">❤️</span>
                            <span className="text-slate-700">
                              {likesCount} {likesCount === 1 ? "like" : "likes"}
                            </span>
                          </div>

                          <div className="rounded-full bg-white/5 px-3 py-1.5 text-slate-600">
                            {commentsCount}{" "}
                            {commentsCount === 1 ? "comment" : "comments"}
                          </div>
                        </div>

                        <Link
                          href={`/post/${post.id}`}
                          className="text-sm font-medium transition text-cyan-300 hover:text-blue-600"
                        >
                          View discussion
                        </Link>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                        <button
                          onClick={() => handleToggleLike(post.id)}
                          className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                            isLiked(post.id)
                              ? "border border-cyan-400/20 bg-cyan-500/20 text-blue-600"
                              : "border border-slate-200 bg-white/5 text-slate-600 hover:bg-white/10"
                          }`}
                        >
                          {isLiked(post.id) ? "Liked" : "Like"}
                        </button>

                        <Link
                          href={`/post/${post.id}`}
                          className="px-4 py-3 text-sm font-medium text-center transition border rounded-2xl border-slate-200 bg-white/5 text-slate-600 hover:bg-white/10"
                        >
                          Comment
                        </Link>

                        <Link
                          href={`/post/${post.id}`}
                          className="px-4 py-3 text-sm font-medium text-center transition border rounded-2xl border-slate-200 bg-white/5 text-cyan-300 hover:bg-white/10"
                        >
                          Open
                        </Link>

                        <Link
                          href={`/profile?id=${post.user_id}`}
                          className="px-4 py-3 text-sm font-medium text-center transition border rounded-2xl border-slate-200 bg-white/5 text-slate-600 hover:bg-white/10"
                        >
                          Author
                        </Link>
                      </div>

                      {latestComments.length > 0 && (
                        <div className="pt-4 mt-5 space-y-3 border-t border-slate-200">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
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
                                className="flex items-start gap-3 px-3 py-3 border rounded-2xl border-slate-200 bg-white/5"
                              >
                                <img
                                  src={commentAuthorAvatar}
                                  alt={commentAuthorName}
                                  className="object-cover h-9 w-9 rounded-xl"
                                />

                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-slate-900">
                                      {commentAuthorName}
                                    </p>
                                    <span className="text-[11px] text-slate-500">
                                      {new Date(comment.created_at).toLocaleString()}
                                    </span>
                                  </div>

                                  <p className="mt-1 text-sm leading-6 line-clamp-2 text-slate-600">
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
          <div className="rounded-[28px] border border-slate-200 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-blue-600">Creator spotlight</p>
                <p className="mt-1 text-xs text-slate-500">Built by the community creator</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 mt-4 border rounded-2xl border-slate-200 bg-white/5">
              <img
                src={creatorAvatar}
                alt={creatorName}
                className="object-cover w-12 h-12 rounded-2xl"
              />
              <div className="min-w-0">
                <p className="font-medium text-slate-900 truncate">{creatorName}</p>
                <p className="text-xs truncate text-slate-500">{t.creator}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-blue-600">Recent members</p>
                <p className="mt-1 text-xs text-slate-500">People joining this space</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {recentMembers.length === 0 ? (
                <p className="text-sm text-slate-500">No members to show yet.</p>
              ) : (
                recentMembers.map((profile) => (
                  <Link
                    key={profile.id}
                    href={`/profile?id=${profile.id}`}
                    className="flex items-center gap-3 p-4 transition border rounded-2xl border-slate-200 bg-white/5 hover:bg-white/10"
                  >
                    <img
                      src={
                        profile.avatar_url ||
                        getAvatarUrl(profile.full_name || "FaceGrem User")
                      }
                      alt={profile.full_name}
                      className="object-cover w-12 h-12 rounded-2xl"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{profile.full_name}</p>
                      <p className="text-xs truncate text-slate-500">
                        @{profile.username || "member"}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-blue-600">Quick links</p>
                <p className="mt-1 text-xs text-slate-500">Move around FaceGrem fast</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <Link
                href="/communities"
                className="block px-4 py-3 text-sm text-slate-700 transition border rounded-2xl border-slate-200 bg-white/5 hover:bg-white/10"
              >
                Back to communities
              </Link>
              <Link
                href="/feed"
                className="block px-4 py-3 text-sm text-slate-700 transition border rounded-2xl border-slate-200 bg-white/5 hover:bg-white/10"
              >
                Open feed
              </Link>
              <Link
                href="/messages"
                className="block px-4 py-3 text-sm text-slate-700 transition border rounded-2xl border-slate-200 bg-white/5 hover:bg-white/10"
              >
                Open messages
              </Link>
              <Link
                href="/profile"
                className="block px-4 py-3 text-sm text-slate-700 transition border rounded-2xl border-slate-200 bg-white/5 hover:bg-white/10"
              >
                Visit profile
              </Link>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}