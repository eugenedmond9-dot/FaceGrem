"use client";

import Link from "next/link";
import { ChangeEvent, Suspense, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "../../components/LanguageProvider";
import LanguageMenu from "../../components/LanguageMenu";
import NotificationDropdown from "../../components/NotificationDropdown";
import FaceGremLogo from "../../components/FaceGremLogo";
import { languageLabels } from "../../lib/language";

type Profile = {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url?: string | null;
};

type FollowRecord = {
  id: string;
  follower_id: string;
  following_id: string;
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


/* Page text now comes from the shared FaceGrem language provider. */

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionUserId, setSessionUserId] = useState("");
  const [sessionUserName, setSessionUserName] = useState("FaceGrem User");
  const [profile, setProfile] = useState<Profile>({
    id: "",
    full_name: "",
    username: "",
    bio: "",
    avatar_url: "",
  });

  const [follows, setFollows] = useState<FollowRecord[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [likes, setLikes] = useState<LikeRecord[]>([]);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [selectedAvatarPreview, setSelectedAvatarPreview] = useState("");
  const [searchText, setSearchText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [translatedPosts, setTranslatedPosts] = useState<Record<string, string>>({});
  const [translatedComments, setTranslatedComments] = useState<Record<string, string>>({});
  const [translatingPosts, setTranslatingPosts] = useState<Record<string, boolean>>({});
  const [translatingComments, setTranslatingComments] = useState<Record<string, boolean>>({});

  const requestedProfileId = searchParams.get("id");
  const { language: selectedLanguage, t } = useLanguage();

  const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=ffffff&bold=true`;

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

  const translateText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return "";

    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: trimmed,
        targetLanguage: selectedLanguage,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || "Could not translate text.");
    }

    return payload.translation as string;
  };

  const handleTogglePostTranslation = async (postId: string, text: string) => {
    if (translatedPosts[postId]) {
      setTranslatedPosts((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      return;
    }

    setTranslatingPosts((prev) => ({ ...prev, [postId]: true }));

    try {
      const translation = await translateText(text);
      setTranslatedPosts((prev) => ({ ...prev, [postId]: translation }));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not translate post.");
    } finally {
      setTranslatingPosts((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleToggleCommentTranslation = async (commentId: string, text: string) => {
    if (translatedComments[commentId]) {
      setTranslatedComments((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
      return;
    }

    setTranslatingComments((prev) => ({ ...prev, [commentId]: true }));

    try {
      const translation = await translateText(text);
      setTranslatedComments((prev) => ({ ...prev, [commentId]: translation }));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not translate comment.");
    } finally {
      setTranslatingComments((prev) => ({ ...prev, [commentId]: false }));
    }
  };


  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/");
  };

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/");
        return;
      }

      const loggedInUserId = session.user.id;
      const loggedInUserName = session.user.user_metadata?.full_name || "FaceGrem User";

      setSessionUserId(loggedInUserId);
      setSessionUserName(loggedInUserName);

      const profileIdToLoad = requestedProfileId || loggedInUserId;

      const [
        { data: profileData, error: profileError },
        { data: followsData },
        { data: postsData },
        { data: likesData },
        { data: commentsData },
        { data: notificationsData },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, username, bio, avatar_url")
          .eq("id", profileIdToLoad)
          .single(),
        supabase.from("follows").select("id, follower_id, following_id"),
        supabase
          .from("posts")
          .select("id, user_id, content, created_at, full_name, avatar_url, image_url, video_url, community_id")
          .eq("user_id", profileIdToLoad)
          .is("community_id", null)
          .order("created_at", { ascending: false }),
        supabase.from("likes").select("id, post_id, user_id"),
        supabase.from("comments").select("id, post_id, user_id, full_name, content, created_at"),
        supabase
          .from("notifications")
          .select("id, user_id, actor_id, type, post_id, actor_name, content, is_read, created_at")
          .eq("user_id", loggedInUserId)
          .order("created_at", { ascending: false }),
      ]);

      if (profileError && profileError.code !== "PGRST116") {
        alert(profileError.message);
        setLoading(false);
        return;
      }

      if (profileData) {
        setProfile(profileData);
      } else if (profileIdToLoad === loggedInUserId) {
        const newProfile = {
          id: loggedInUserId,
          full_name: loggedInUserName,
          username: "",
          bio: "",
          avatar_url: "",
        };

        const { error: insertError } = await supabase.from("profiles").insert([newProfile]);

        if (insertError) {
          alert(insertError.message);
        } else {
          setProfile(newProfile);
        }
      }

      setFollows(followsData || []);
      setPosts(postsData || []);
      setLikes(likesData || []);
      setComments(commentsData || []);
      setNotifications(notificationsData || []);
      setLoading(false);
    };

    void loadProfile();
  }, [router, requestedProfileId]);

  const isOwnProfile = useMemo(() => !!sessionUserId && sessionUserId === profile.id, [sessionUserId, profile.id]);

  const existingFollow = useMemo(() => {
    return follows.find((follow) => follow.follower_id === sessionUserId && follow.following_id === profile.id);
  }, [follows, sessionUserId, profile.id]);

  const followersCount = useMemo(() => follows.filter((follow) => follow.following_id === profile.id).length, [follows, profile.id]);
  const followingCount = useMemo(() => follows.filter((follow) => follow.follower_id === profile.id).length, [follows, profile.id]);

  const filteredPosts = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return posts;

    return posts.filter((post) => {
      const text = `${post.content} ${profile.full_name} ${profile.username}`.toLowerCase();
      return text.includes(term);
    });
  }, [posts, searchText, profile.full_name, profile.username]);

  const unreadNotificationsCount = notifications.filter((notification) => !notification.is_read).length;

  const handleAvatarFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedAvatarFile(file);

    if (!file) {
      setSelectedAvatarPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedAvatarPreview(previewUrl);
  };

  const uploadAvatar = async () => {
    if (!selectedAvatarFile || !profile.id) return null;

    const fileExt = selectedAvatarFile.name.split(".").pop() || "jpg";
    const safeExt = fileExt.toLowerCase();
    const filePath = `${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, selectedAvatarFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!profile.id) {
      alert("Profile not ready yet.");
      return;
    }

    setSaving(true);

    try {
      let avatarUrl = profile.avatar_url || "";

      if (selectedAvatarFile) {
        setAvatarUploading(true);
        const uploadedAvatarUrl = await uploadAvatar();
        avatarUrl = uploadedAvatarUrl || avatarUrl;
        setAvatarUploading(false);
      }

      const trimmedFullName = profile.full_name.trim();
      const trimmedUsername = profile.username.trim();
      const trimmedBio = profile.bio.trim();

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: trimmedFullName,
          username: trimmedUsername,
          bio: trimmedBio,
          avatar_url: avatarUrl,
        })
        .eq("id", profile.id);

      if (profileError) {
        alert(profileError.message);
        setSaving(false);
        return;
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: trimmedFullName || "FaceGrem User",
          avatar_url: avatarUrl,
        },
      });

      if (authError) {
        alert(authError.message);
        setSaving(false);
        return;
      }

      setProfile((prev) => ({
        ...prev,
        full_name: trimmedFullName,
        username: trimmedUsername,
        bio: trimmedBio,
        avatar_url: avatarUrl,
      }));

      setPosts((prev) =>
        prev.map((post) => ({
          ...post,
          full_name: trimmedFullName || post.full_name,
          avatar_url: avatarUrl || post.avatar_url,
        }))
      );

      setSelectedAvatarFile(null);
      setSelectedAvatarPreview("");
      alert("FaceGrem profile updated!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Avatar upload failed.";
      alert(message);
    }

    setAvatarUploading(false);
    setSaving(false);
  };

  const handleToggleFollow = async () => {
    if (!sessionUserId || !profile.id || isOwnProfile) return;

    setFollowLoading(true);

    if (existingFollow) {
      const { error } = await supabase.from("follows").delete().eq("id", existingFollow.id);

      if (error) {
        alert(error.message);
      } else {
        setFollows((prev) => prev.filter((follow) => follow.id !== existingFollow.id));
      }
    } else {
      const { data, error } = await supabase
        .from("follows")
        .insert([{ follower_id: sessionUserId, following_id: profile.id }])
        .select("id, follower_id, following_id");

      if (error) {
        alert(error.message);
      } else if (data && data.length > 0) {
        setFollows((prev) => [...prev, data[0]]);
      }
    }

    setFollowLoading(false);
  };

  const getPostLikesCount = (postId: string) => likes.filter((like) => like.post_id === postId).length;
  const getPostCommentsCount = (postId: string) => comments.filter((comment) => comment.post_id === postId).length;
  const formatTime = (dateString: string) => new Date(dateString).toLocaleString();

  const currentAvatar = selectedAvatarPreview || profile.avatar_url || getAvatarUrl(profile.full_name || "FaceGrem User");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817] text-white">
        {t.loadingProfile}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020817] pb-10 text-white">
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
                <p className="text-xs text-slate-400">{t.profile}</p>
              </div>
            </Link>
          </div>

          <div className="flex-1">
            <div className="mx-auto max-w-xl">
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 backdrop-blur-[22px]">
                <span className="text-sm text-slate-400">⌕</span>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <LanguageMenu compact className="hidden lg:block" />

            {!isOwnProfile && (
              <button
                onClick={handleToggleFollow}
                disabled={followLoading}
                className="rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.10] px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/[0.14] disabled:opacity-70"
              >
                {followLoading ? "Please wait..." : existingFollow ? "Unfollow" : "Follow"}
              </button>
            )}

            <NotificationDropdown
              iconClassName="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-[13px] text-slate-200 transition hover:bg-white/[0.06]"
            />

            <Link
              href="/profile"
              className="hidden items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-2 py-1.5 transition hover:bg-white/[0.06] sm:flex sm:px-2 sm:pr-3"
            >
              <img
                src={currentAvatar}
                alt={profile.full_name || "FaceGrem User"}
                className="h-8 w-8 rounded-xl object-cover ring-1 ring-cyan-400/15"
              />
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-white lg:inline-block">
                {profile.full_name || sessionUserName}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden rounded-xl border border-red-300/10 bg-red-400/[0.07] px-3 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-400/[0.11] lg:inline-flex"
            >
              ↩️ {t.logout}
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
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-2">
              <Link href="/feed" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">
                🏠 {t.homeFeed}
              </Link>
              <Link href="/videos" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">
                🎬 {t.videos}
              </Link>
              <Link href="/communities" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">
                👥 {t.communities}
              </Link>
              <Link href="/groups" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">
                🫂 {t.groups}
              </Link>
              <Link href="/messages" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">
                💬 {t.messages}
              </Link>
              <Link href="/saved" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">
                🔖 {t.saved}
              </Link>
              <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]">
                👤 {t.profile}
              </Link>
            </div>

            <div className="mt-8 border-t border-white/10 pt-5">
              <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t.more}
              </p>

              <div className="space-y-2">
                <Link
                  href="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full rounded-2xl px-4 py-3 text-left text-white transition hover:bg-white/[0.08]"
                >
                  ⚙️ {t.settings}
                </Link>

                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-2">
                  <div className="px-2 py-2">
                    <LanguageMenu />
                  </div>
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
                  className="block w-full rounded-2xl px-4 py-3 text-left text-red-100 transition hover:bg-red-400/[0.10]"
                >
                  ↩️ {t.logout}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="hidden xl:block">
          <div className="sticky top-[104px] space-y-4">
            <div className="overflow-hidden rounded-[30px] border border-white/[0.06] bg-white/[0.028] p-4 backdrop-blur-[28px] shadow-[0_18px_50px_rgba(2,8,23,0.18)]">
              <button type="button" className="flex w-full items-center gap-3 text-left">
                <img src={currentAvatar} alt={profile.full_name || "FaceGrem User"} className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{profile.full_name || "FaceGrem User"}</p>
                  <p className="truncate text-sm text-slate-400">{profile.username ? `@${profile.username}` : "@yourusername"}</p>
                </div>
              </button>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-3 text-center backdrop-blur-[24px] shadow-[0_10px_30px_rgba(2,8,23,0.12)]">
                  <p className="text-[11px] text-slate-400">{"Followers"}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{followersCount}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-3 text-center backdrop-blur-[24px] shadow-[0_10px_30px_rgba(2,8,23,0.12)]">
                  <p className="text-[11px] text-slate-400">{"Following"}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{followingCount}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-3 text-center backdrop-blur-[24px] shadow-[0_10px_30px_rgba(2,8,23,0.12)]">
                  <p className="text-[11px] text-slate-400">{t.posts}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{posts.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.028] p-3 backdrop-blur-[28px] shadow-[0_18px_50px_rgba(2,8,23,0.18)]">
              <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">{t.navigation}</p>
              <div className="space-y-1.5">
                <Link href="/feed" className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-white transition hover:bg-white/[0.08]"><span className="flex items-center gap-3"><span className="text-base">🏠</span>{t.homeFeed}</span><span className="text-slate-500">→</span></Link>
                <Link href="/videos" className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-white transition hover:bg-white/[0.08]"><span className="flex items-center gap-3"><span className="text-base">🎬</span>{t.videos}</span><span className="text-slate-500">→</span></Link>
                <Link href="/communities" className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-white transition hover:bg-white/[0.08]"><span className="flex items-center gap-3"><span className="text-base">👥</span>{t.communities}</span><span className="text-slate-500">→</span></Link>
                <Link href="/messages" className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-white transition hover:bg-white/[0.08]"><span className="flex items-center gap-3"><span className="text-base">💬</span>{t.messages}</span><span className="text-slate-500">→</span></Link>
                <Link href="/profile" className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-white transition hover:bg-white/[0.08]"><span className="flex items-center gap-3"><span className="text-base">👤</span>{t.profile}</span><span className="text-slate-500">→</span></Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.028] p-4 backdrop-blur-[28px] shadow-[0_18px_50px_rgba(2,8,23,0.18)]">
              <p className="text-sm font-semibold text-cyan-200">{"About"}</p>
              <div className="mt-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="text-sm leading-7 text-slate-300">{profile.bio || "No bio yet."}</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-5 sm:space-y-6">
          <div className="overflow-hidden rounded-[32px] border border-white/[0.06] bg-[linear-gradient(135deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015)_38%,rgba(255,255,255,0.025)_100%)] p-6 backdrop-blur-[28px] shadow-[0_24px_80px_rgba(2,8,23,0.14)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-4">
                <img src={currentAvatar} alt={profile.full_name || "FaceGrem User"} className="h-20 w-20 rounded-[28px] object-cover ring-2 ring-cyan-400/20 sm:h-24 sm:w-24" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-cyan-200">{isOwnProfile ? t.profile : t.profile}</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{profile.full_name || "FaceGrem User"}</h2>
                  <p className="mt-2 text-sm text-slate-300">{profile.username ? `@${profile.username}` : "@yourusername"}</p>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">{profile.bio || "No bio yet."}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:min-w-[320px]">
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4"><p className="text-xs text-slate-400">{"Followers"}</p><p className="mt-2 text-2xl font-bold text-white">{followersCount}</p></div>
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4"><p className="text-xs text-slate-400">{"Following"}</p><p className="mt-2 text-2xl font-bold text-white">{followingCount}</p></div>
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4"><p className="text-xs text-slate-400">{t.posts}</p><p className="mt-2 text-2xl font-bold text-white">{posts.length}</p></div>
              </div>
            </div>
          </div>

          {isOwnProfile ? (
            <div className="overflow-hidden rounded-[30px] border border-white/[0.05] bg-white/[0.018] backdrop-blur-[30px] shadow-[0_18px_50px_rgba(2,8,23,0.14)]">
              <div className="border-b border-white/[0.05] px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold tracking-[0.01em] text-cyan-100/90">{t.profile}</p>
                    <p className="mt-1 text-xs text-slate-400/90">{t.profileTagline}</p>
                  </div>

                  <span className="rounded-full border border-cyan-300/10 bg-cyan-400/[0.08] px-3 py-1.5 text-xs text-cyan-100">{t.settings}</span>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-[28px] border border-white/[0.05] bg-white/[0.02] p-4">
                      <img src={currentAvatar} alt={profile.full_name || "FaceGrem User"} className="h-44 w-full rounded-[24px] object-cover" />
                    </div>

                    <div className="rounded-[24px] border border-white/[0.05] bg-white/[0.02] p-4">
                      <label className="text-sm font-medium text-white">{t.photo}</label>
                      <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="mt-3 block w-full rounded-2xl text-sm text-white file:mr-4 file:rounded-xl file:border file:border-white/[0.06] file:bg-white/[0.04] file:px-4 file:py-2.5 file:text-slate-200" />
                      {selectedAvatarPreview && <p className="mt-3 text-xs text-cyan-300">"New avatar selected. Save profile to upload it."</p>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm text-slate-300">{"Full name"}</label>
                        <input type="text" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder={"Enter your full name"} className="mt-2 w-full rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-white placeholder:text-slate-400/90 outline-none transition focus:border-cyan-300/20" />
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">{"Username"}</label>
                        <input type="text" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} placeholder={"yourusername"} className="mt-2 w-full rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-white placeholder:text-slate-400/90 outline-none transition focus:border-cyan-300/20" />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-slate-300">{"Bio"}</label>
                      <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={6} placeholder="Tell FaceGrem who you are..." className="mt-2 w-full rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-white placeholder:text-slate-400/90 outline-none transition focus:border-cyan-300/20" />
                    </div>

                    <div className="flex justify-end">
                      <button onClick={handleSave} disabled={saving || avatarUploading} className="rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.10] px-6 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/[0.14] disabled:opacity-70">
                        {avatarUploading ? t.uploading : saving ? t.sending : "Save profile"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.028] p-6 backdrop-blur-[28px] shadow-[0_18px_50px_rgba(2,8,23,0.18)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-cyan-200">{"About"}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{profile.bio || "No bio yet."}</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleToggleFollow} disabled={followLoading} className="rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.10] px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/[0.14] disabled:opacity-70">
                    {followLoading ? "Please wait..." : existingFollow ? "Unfollow" : "Follow"}
                  </button>

                  <Link href={`/messages?user=${profile.id}`} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-white/[0.045]">
                    {t.message}
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.028] p-5 backdrop-blur-[28px] shadow-[0_18px_50px_rgba(2,8,23,0.18)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">{t.posts}</p>
                <h3 className="mt-1 text-2xl font-bold tracking-tight text-white">{isOwnProfile ? t.posts : `${profile.full_name || "User"} ${t.posts}`}</h3>
              </div>
              <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 text-xs text-slate-300">{filteredPosts.length} {"visible"}</span>
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="rounded-[30px] border border-white/[0.06] bg-white/[0.028] p-8 text-center backdrop-blur-[28px] shadow-[0_18px_50px_rgba(2,8,23,0.18)]">
              <p className="text-lg font-medium text-white">{isOwnProfile ? "You have not posted anything yet." : "This user has not posted anything yet."}</p>
              <p className="mt-2 text-sm text-slate-400">{"Posts from this profile will appear here."}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => {
                const likesCount = getPostLikesCount(post.id);
                const commentsCount = getPostCommentsCount(post.id);

                const latestComments = comments
                  .filter((comment) => comment.post_id === post.id)
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 2);

                return (
                  <article key={post.id} className="overflow-hidden rounded-[32px] border border-white/[0.05] bg-white/[0.018] backdrop-blur-[30px] shadow-[0_18px_50px_rgba(2,8,23,0.14)]">
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <Link href={`/profile?id=${post.user_id}`} className="flex min-w-0 items-center gap-3 hover:opacity-90">
                          <img src={currentAvatar} alt={profile.full_name || "FaceGrem User"} className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/[0.08]" />

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-semibold text-white">{profile.full_name || "FaceGrem User"}</p>
                              {profile.username && <span className="truncate text-sm text-slate-400">@{profile.username}</span>}
                              <span className="hidden h-1 w-1 rounded-full bg-slate-500 sm:block" />
                              <span className="text-xs text-slate-400">{formatTime(post.created_at)}</span>
                            </div>

                            <div className="mt-1 flex items-center gap-2">
                              <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 text-[11px] text-slate-300">{t.public}</span>
                              {post.video_url && <span className="rounded-full border border-cyan-300/10 bg-cyan-400/[0.08] px-2.5 py-1 text-[11px] text-cyan-100">{t.video}</span>}
                              {post.image_url && !post.video_url && <span className="rounded-full border border-fuchsia-300/10 bg-fuchsia-400/[0.08] px-2.5 py-1 text-[11px] text-fuchsia-100">{t.photo}</span>}
                            </div>
                          </div>
                        </Link>
                      </div>

                      {post.content && (
                        <div className="mt-5">
                          <p className="text-[15px] leading-8 text-slate-200/95">{post.content}</p>

                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <button type="button" onClick={() => handleTogglePostTranslation(post.id, post.content)} disabled={translatingPosts[post.id]} className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.045] disabled:opacity-70">
                              {translatingPosts[post.id] ? t.translating : translatedPosts[post.id] ? t.translateShowOriginal : `${t.translate} ${languageLabels[selectedLanguage]}`}
                            </button>

                            {translatedPosts[post.id] && <span className="text-xs text-cyan-200/90">{t.translatedTo} {languageLabels[selectedLanguage]}</span>}
                          </div>

                          {translatedPosts[post.id] && (
                            <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.06] px-4 py-3">
                              <p className="text-[14px] leading-7 text-cyan-50">{translatedPosts[post.id]}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {post.image_url && (
                      <div className="border-y border-white/[0.05] bg-black/10 px-3 pb-3 sm:px-4 sm:pb-4">
                        <div className="overflow-hidden rounded-[28px] border border-white/[0.05]">
                          <img src={post.image_url} alt="Post" className="max-h-[720px] w-full object-cover" />
                        </div>
                      </div>
                    )}

                    {post.video_url && (
                      <div className="border-y border-white/[0.05] bg-black/12 px-3 pb-3 sm:px-4 sm:pb-4">
                        <div className="overflow-hidden rounded-[28px] border border-white/[0.05]">
                          {isYouTubeUrl(post.video_url) ? (
                            <iframe src={getYouTubeEmbedUrl(post.video_url)} title={`profile-video-${post.id}`} className="h-80 w-full md:h-[480px]" allowFullScreen />
                          ) : (
                            <video controls className="h-80 w-full bg-black md:h-[480px]" src={post.video_url} />
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.05] pb-4">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-2 rounded-full border border-white/[0.05] bg-white/[0.022] px-3 py-1.5">
                            <span className="text-base">❤️</span>
                            <span className="text-slate-200">{likesCount} {likesCount === 1 ? t.like : "likes"}</span>
                          </div>

                          <div className="rounded-full border border-white/[0.05] bg-white/[0.022] px-3 py-1.5 text-slate-300">
                            {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
                          </div>
                        </div>

                        <Link href={`/post/${post.id}`} className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">{t.viewDiscussion}</Link>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-center text-sm font-medium text-slate-300">{likesCount} {"likes"}</div>
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-center text-sm font-medium text-slate-300">{commentsCount} {"comments"}</div>
                        <Link href={`/post/${post.id}`} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-center text-sm font-medium text-cyan-100 transition hover:bg-white/[0.045]">{t.open}</Link>
                        <Link href={`/messages?user=${post.user_id}`} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-white/[0.045]">{t.message}</Link>
                      </div>

                      {latestComments.length > 0 && (
                        <div className="mt-5 space-y-3 border-t border-white/[0.05] pt-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{"Recent comments"}</p>
                          {latestComments.map((comment) => {
                            const commentAuthorAvatar = getAvatarUrl(comment.full_name || "FaceGrem User");

                            return (
                              <div key={comment.id} className="flex items-start gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-3 backdrop-blur-[20px]">
                                <img src={commentAuthorAvatar} alt={comment.full_name || "FaceGrem User"} className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/[0.08]" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-white">{comment.full_name || "FaceGrem User"}</p>
                                    <span className="text-[11px] text-slate-400">{formatTime(comment.created_at)}</span>
                                  </div>
                                  <p className="mt-1 text-sm leading-6 text-slate-300/95">{comment.content}</p>

                                  <div className="mt-3 flex flex-wrap items-center gap-3">
                                    <button type="button" onClick={() => handleToggleCommentTranslation(comment.id, comment.content)} disabled={translatingComments[comment.id]} className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.045] disabled:opacity-70">
                                      {translatingComments[comment.id] ? t.translating : translatedComments[comment.id] ? t.translateShowOriginal : `${t.translate} ${languageLabels[selectedLanguage]}`}
                                    </button>
                                    {translatedComments[comment.id] && <span className="text-xs text-cyan-200/90">{t.translatedTo} {languageLabels[selectedLanguage]}</span>}
                                  </div>

                                  {translatedComments[comment.id] && (
                                    <div className="mt-3 rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.06] px-4 py-3">
                                      <p className="text-sm leading-6 text-cyan-50">{translatedComments[comment.id]}</p>
                                    </div>
                                  )}
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
          <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.028] p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-[28px]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">{t.profile}</p>
                <p className="mt-1 text-xs text-slate-400">{"Quick view of this account"}</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="text-xs text-slate-400">{"Full name"}</p>
                <p className="mt-2 font-medium text-white">{profile.full_name || "FaceGrem User"}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="text-xs text-slate-400">{"Username"}</p>
                <p className="mt-2 font-medium text-white">{profile.username ? `@${profile.username}` : "Not set"}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="text-xs text-slate-400">{"Bio"}</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">{profile.bio || "No bio yet."}</p>
              </div>
            </div>
          </div>

          {!isOwnProfile && (
            <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.028] p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-[28px]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-cyan-200">{"Actions"}</p>
                  <p className="mt-1 text-xs text-slate-400">{"Connect with this person"}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <button onClick={handleToggleFollow} disabled={followLoading} className="w-full rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.10] px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/[0.14] disabled:opacity-70">
                  {followLoading ? "Please wait..." : existingFollow ? "Unfollow" : "Follow"}
                </button>
                <Link href={`/messages?user=${profile.id}`} className="block rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-center text-sm font-medium text-cyan-100 transition hover:bg-white/[0.045]">{t.send}</Link>
              </div>
            </div>
          )}

          <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.028] p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-[28px]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">{"Quick links"}</p>
                <p className="mt-1 text-xs text-slate-400">{t.brandTagline}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <Link href="/feed" className="block rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-sm text-white transition hover:bg-white/[0.045]">{t.homeFeed}</Link>
              <Link href="/videos" className="block rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-sm text-white transition hover:bg-white/[0.045]">{t.videos}</Link>
              <Link href="/communities" className="block rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-sm text-white transition hover:bg-white/[0.045]">{t.communities}</Link>
              <Link href="/messages" className="block rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-sm text-white transition hover:bg-white/[0.045]">{t.messages}</Link>
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full rounded-2xl border border-red-300/10 bg-red-400/[0.07] px-4 py-3 text-left text-sm text-red-100 transition hover:bg-red-400/[0.11]"
              >
                ↩️ {t.logout}
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#020817] text-white">Loading FaceGrem profile...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
