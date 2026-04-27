"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "../../../components/LanguageProvider";

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
      <div className="flex min-h-screen items-center justify-center bg-[#020817] text-white">
        Loading community...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020817] pb-24 text-white xl:pb-0">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_25%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.08),transparent_22%),linear-gradient(to_bottom,#020817,#07111f_45%,#020817)]" />
        <div className="absolute left-0 rounded-full top-10 h-72 w-72 bg-cyan-400/10 blur-3xl" />
        <div className="absolute top-0 right-0 rounded-full h-96 w-96 bg-blue-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#020817]/40 backdrop-blur-3xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-base text-white transition hover:bg-white/[0.06]"
              aria-label="Open menu"
            >
              ☰
            </button>

            <Link href="/feed" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/10 bg-[linear-gradient(145deg,rgba(10,18,34,0.92),rgba(8,15,28,0.72))] font-bold text-[15px] text-cyan-100 shadow-[0_10px_30px_rgba(34,211,238,0.08)] sm:h-11 sm:w-11">
                F
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold tracking-tight text-white">FaceGrem</h1>
                <p className="text-xs text-slate-400">{t.community}</p>
              </div>
            </Link>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mx-auto max-w-xl">
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 shadow-[0_10px_35px_rgba(15,23,42,0.14)] transition focus-within:border-cyan-400/40 sm:px-4 lg:py-3">
                <span className="text-sm text-slate-400">⌕</span>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-400 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleJoinOrLeaveCommunity}
              className={`hidden rounded-2xl px-4 py-2.5 text-sm font-semibold sm:inline-flex ${
                isMember
                  ? "border border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                  : "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
              }`}
            >
              {isMember ? t.leave : t.join}
            </button>

            <div ref={languageMenuRef} className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
                className="inline-flex h-9 items-center rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/[0.06]"
                aria-label="Language"
                title="Language"
              >
                🌐 {languageLabels[selectedLanguage]}
              </button>

              {isLanguageMenuOpen && (
                <div className="absolute right-0 top-11 z-[90] w-44 rounded-2xl border border-white/[0.08] bg-[#07111f]/95 p-2 shadow-2xl backdrop-blur-2xl">
                  {(["en", "sw", "fr", "rw"] as TranslationLanguage[]).map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => handleLanguageChange(language)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                        selectedLanguage === language
                          ? "bg-cyan-400/[0.14] text-cyan-100"
                          : "text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      <span>{languageLabels[language]}</span>
                      {selectedLanguage === language && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Link
                href="/notifications"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-[13px] text-slate-200 transition hover:bg-white/[0.06]"
              >
                🔔
              </Link>

              {unreadNotificationsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-slate-950 shadow-lg">
                  {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                </span>
              )}
            </div>

            <Link
              href="/profile"
              className="hidden items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-2 py-1.5 transition hover:bg-white/[0.06] md:flex md:px-2 md:pr-3"
            >
              <img
                src={userAvatar}
                alt={userName}
                className="h-8 w-8 rounded-xl object-cover ring-1 ring-cyan-400/15"
              />
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-white lg:inline-block">
                {userName}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="hidden rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06] disabled:opacity-70 lg:inline-flex"
            >
              {signingOut ? t.signingOut : t.logout}
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-[70] flex h-full w-[290px] flex-col overflow-y-auto overscroll-contain border-r border-white/10 bg-[#07111f]/90 p-5 backdrop-blur-2xl shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/10 bg-[linear-gradient(145deg,rgba(10,18,34,0.92),rgba(8,15,28,0.72))] font-bold text-cyan-100 shadow-[0_10px_30px_rgba(34,211,238,0.08)]">
                  F
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">FaceGrem</h2>
                  <p className="text-xs text-slate-400">{t.navigation}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-white transition hover:bg-white/[0.08]"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-2">
              <Link href="/feed" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">🏠 {t.homeFeed}</Link>
              <Link href="/videos" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">🎬 {t.videos}</Link>
              <Link href="/communities" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">👥 {t.communities}</Link>
              <Link href="/groups" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">🫂 {t.groups}</Link>
              <Link href="/messages" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">💬 {t.messages}</Link>
              <Link href="/saved" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">🔖 {t.saved}</Link>
              <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">👤 {t.profile}</Link>
              <button
                type="button"
                onClick={() => {
                  handleJoinOrLeaveCommunity();
                  setIsMenuOpen(false);
                }}
                className={`mobile-menu-primary-action block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold ${
                  isMember
                    ? "border border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                    : "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                }`}
              >
                {isMember ? t.leave : t.join}
              </button>
            </div>

            <div className="mt-8 border-t border-white/10 pt-5">
              <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t.more}
              </p>

              <div className="space-y-2">
                <button className="block w-full rounded-2xl px-4 py-3 text-left text-white transition hover:bg-white/[0.08]">
                  ⚙️ {t.settings}
                </button>

                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-2">
                  <button
                    type="button"
                    onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
                    className="block w-full rounded-2xl px-4 py-3 text-left text-white transition hover:bg-white/[0.08]"
                  >
                    🌐 {t.language}: {languageLabels[selectedLanguage]}
                  </button>

                  {isLanguageMenuOpen && (
                    <div className="mt-2 space-y-1 px-2 pb-2">
                      {(["en", "sw", "fr", "rw"] as TranslationLanguage[]).map((language) => (
                        <button
                          key={language}
                          type="button"
                          onClick={() => handleLanguageChange(language)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                            selectedLanguage === language
                              ? "bg-cyan-400/[0.14] text-cyan-100"
                              : "text-white hover:bg-white/[0.06]"
                          }`}
                        >
                          <span>{languageLabels[language]}</span>
                          {selectedLanguage === language && <span>✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button className="block w-full rounded-2xl px-4 py-3 text-left text-white transition hover:bg-white/[0.08]">
                  🔒 {t.privacy}
                </button>
                <button className="block w-full rounded-2xl px-4 py-3 text-left text-white transition hover:bg-white/[0.08]">
                  ❓ {t.help}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={signingOut}
                  className="block w-full rounded-2xl px-4 py-3 text-left text-red-100 transition hover:bg-red-500/10 disabled:opacity-70"
                >
                  ↩️ {signingOut ? t.signingOut : t.logout}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="hidden xl:block">
          <div className="sticky top-[104px] space-y-4">
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(15,23,42,0.94)_45%,rgba(30,41,59,0.94))] p-4 shadow-[0_20px_60px_rgba(6,182,212,0.10)] backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <img
                  src={creatorAvatar}
                  alt={creatorName}
                  className="object-cover h-14 w-14 rounded-2xl ring-2 ring-cyan-400/20"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{community.name}</p>
                  <p className="text-sm truncate text-slate-400">
                    {community.category || t.communityFallback}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">{t.members}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{membersCount}</p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">{t.posts}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{posts.length}</p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">Status</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {isMember ? t.joined : t.open}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-cyan-200">{t.about}</p>
              </div>

              <div className="mt-4 space-y-4">
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-sm leading-7 text-slate-300">
                    {community.description || t.noBioYet}
                  </p>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-2xl border-white/10 bg-white/5">
                  <img
                    src={creatorAvatar}
                    alt={creatorName}
                    className="object-cover w-10 h-10 rounded-2xl"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{creatorName}</p>
                    <p className="text-xs text-slate-400">{t.creator}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-5 sm:space-y-6">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,47,73,0.95),rgba(15,23,42,0.95)_55%,rgba(30,41,59,0.95))] p-6 shadow-[0_30px_120px_rgba(6,182,212,0.10)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-cyan-200">{t.community}</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {community.name}
                </h2>
                <p className="max-w-xl mt-3 text-sm leading-7 text-slate-300">
                  {community.description ||
                    "A space where people gather, talk, learn, and share together."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:min-w-[320px]">
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">{t.members}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{membersCount}</p>
                </div>
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">{t.posts}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{posts.length}</p>
                </div>
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">Status</p>
                  <p className="mt-2 text-xl font-bold text-white">
                    {isMember ? t.joined : t.open}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.92)_45%,rgba(15,23,42,0.96))] shadow-[0_25px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:rounded-[34px]">
            <div className="px-4 py-4 border-b border-white/10 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-cyan-200">Create post</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Share with people inside this community
                  </p>
                </div>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
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
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-3 sm:rounded-[26px] sm:p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-3 sm:gap-3">
                      <p className="font-medium text-white">{userName}</p>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                        Posting in {community.name}
                      </span>
                    </div>

                    <textarea
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      rows={4}
                      placeholder={
                        isMember
                          ? `What do you want to share with ${community.name}?`
                          : "Join this community to post."
                      }
                      disabled={!isMember}
                      className="w-full resize-none bg-transparent text-[15px] leading-7 text-white placeholder:text-slate-400 outline-none disabled:opacity-60 sm:leading-8"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 mt-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-medium text-white">Image upload</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Add a visual to your community post
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={!isMember}
                    className="mt-4 block w-full rounded-2xl text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500/20 file:px-4 file:py-2.5 file:text-cyan-200 disabled:opacity-60"
                  />

                  {imagePreview && (
                    <div className="mt-4 overflow-hidden rounded-[20px] border border-white/10 sm:rounded-[24px]">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="object-cover w-full max-h-80"
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-medium text-white">Video link</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Paste a YouTube or direct video URL
                  </p>

                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Paste a YouTube or video URL"
                    disabled={!isMember}
                    className="w-full px-4 py-3 mt-4 text-sm text-white transition border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4 mt-5 border-t border-white/10 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                    Community post
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

                <button
                  onClick={handleCreateCommunityPost}
                  disabled={posting || !isMember}
                  className="px-6 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
                >
                  {posting ? "Posting..." : "Post to community"}
                </button>
              </div>
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
              <p className="text-lg font-medium text-white">No posts in this community yet.</p>
              <p className="mt-2 text-sm text-slate-400">
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
                                {community.name}
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
                          onClick={() => handleToggleLike(post.id)}
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

                        <Link
                          href={`/post/${post.id}`}
                          className="px-4 py-3 text-sm font-medium text-center transition border rounded-2xl border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10"
                        >
                          Open
                        </Link>

                        <Link
                          href={`/profile?id=${post.user_id}`}
                          className="px-4 py-3 text-sm font-medium text-center transition border rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        >
                          Author
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
                <p className="text-sm font-semibold text-cyan-200">Creator spotlight</p>
                <p className="mt-1 text-xs text-slate-400">Built by the community creator</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 mt-4 border rounded-2xl border-white/10 bg-white/5">
              <img
                src={creatorAvatar}
                alt={creatorName}
                className="object-cover w-12 h-12 rounded-2xl"
              />
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{creatorName}</p>
                <p className="text-xs truncate text-slate-400">{t.creator}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">Recent members</p>
                <p className="mt-1 text-xs text-slate-400">People joining this space</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {recentMembers.length === 0 ? (
                <p className="text-sm text-slate-400">No members to show yet.</p>
              ) : (
                recentMembers.map((profile) => (
                  <Link
                    key={profile.id}
                    href={`/profile?id=${profile.id}`}
                    className="flex items-center gap-3 p-4 transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
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
                      <p className="font-medium text-white truncate">{profile.full_name}</p>
                      <p className="text-xs truncate text-slate-400">
                        @{profile.username || "member"}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
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
                href="/communities"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Back to communities
              </Link>
              <Link
                href="/feed"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Open feed
              </Link>
              <Link
                href="/messages"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Open messages
              </Link>
              <Link
                href="/profile"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
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