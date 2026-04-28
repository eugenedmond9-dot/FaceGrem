"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../components/LanguageProvider";
import NotificationDropdown from "../../components/NotificationDropdown";

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


export default function CommunitiesPage() {
  const router = useRouter();
  const languageMenuRef = useRef<HTMLDivElement | null>(null);

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");
  const [userAvatar, setUserAvatar] = useState("");
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [communities, setCommunities] = useState<CommunityRecord[]>([]);
  const [communityMembers, setCommunityMembers] = useState<CommunityMemberRecord[]>([]);
  const [communityPosts, setCommunityPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingCommunity, setCreatingCommunity] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [communityCategory, setCommunityCategory] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { language: selectedLanguage, setLanguage: setSelectedLanguage, t } = useLanguage();

  const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=0f172a&color=ffffff&bold=true`;

  const getProfileById = (profileId?: string) => {
    if (!profileId) return undefined;
    return profiles.find((profile) => profile.id === profileId);
  };

  const getBestNameForUser = (uid?: string) => {
    const profile = getProfileById(uid);
    return profile?.full_name || "FaceGrem User";
  };

  const getBestAvatarForUser = (uid?: string) => {
    const profile = getProfileById(uid);
    return profile?.avatar_url || getAvatarUrl(profile?.full_name || "FaceGrem User");
  };

  useEffect(() => {
    const loadCommunitiesPage = async () => {
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
        { data: profilesData },
        { data: communitiesData },
        { data: communityMembersData },
        { data: communityPostsData },
        { data: notificationsData },
      ] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, bio, avatar_url"),
        supabase
          .from("communities")
          .select("id, creator_id, name, category, description, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("community_members")
          .select("id, community_id, user_id, created_at"),
        supabase
          .from("posts")
          .select(
            "id, user_id, content, created_at, full_name, avatar_url, image_url, video_url, community_id"
          )
          .not("community_id", "is", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("notifications")
          .select("id, user_id, actor_id, type, post_id, actor_name, content, is_read, created_at")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false }),
      ]);

      const allProfiles = profilesData || [];
      const myProfile = allProfiles.find((profile) => profile.id === currentUserId);

      setProfiles(allProfiles);
      setCommunities(communitiesData || []);
      setCommunityMembers(communityMembersData || []);
      setCommunityPosts(communityPostsData || []);
      setNotifications(notificationsData || []);
      setUserAvatar(
        myProfile?.avatar_url || getAvatarUrl(myProfile?.full_name || currentUserName)
      );
      setLoading(false);
    };

    void loadCommunitiesPage();
  }, [router]);
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

  const myCommunityIds = useMemo(() => {
    return communityMembers
      .filter((member) => member.user_id === userId)
      .map((member) => member.community_id);
  }, [communityMembers, userId]);

  const filteredCommunities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return communities;

    return communities.filter((community) => {
      const haystack =
        `${community.name} ${community.category || ""} ${community.description || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [communities, searchTerm]);


  const joinedCommunities = useMemo(() => {
    return communities.filter((community) => myCommunityIds.includes(community.id)).slice(0, 4);
  }, [communities, myCommunityIds]);

  const suggestedCommunities = useMemo(() => {
    return communities.filter((community) => !myCommunityIds.includes(community.id)).slice(0, 4);
  }, [communities, myCommunityIds]);

  const creatorSpotlight = useMemo(() => {
    const creatorIds = Array.from(new Set(communities.map((community) => community.creator_id)));
    return creatorIds.slice(0, 4).map((id) => getProfileById(id)).filter(Boolean) as ProfileRecord[];
  }, [communities, profiles]);

  const getCommunityMembersCount = (communityId: string) => {
    return communityMembers.filter((member) => member.community_id === communityId).length;
  };

  const getCommunityPostsCount = (communityId: string) => {
    return communityPosts.filter((post) => post.community_id === communityId).length;
  };

  const isMember = (communityId: string) => {
    return myCommunityIds.includes(communityId);
  };

  const handleCreateCommunity = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = communityName.trim();
    const trimmedCategory = communityCategory.trim();
    const trimmedDescription = communityDescription.trim();

    if (!trimmedName) {
      alert("Community name is required.");
      return;
    }

    setCreatingCommunity(true);

    const { data, error } = await supabase
      .from("communities")
      .insert([
        {
          creator_id: userId,
          name: trimmedName,
          category: trimmedCategory || null,
          description: trimmedDescription || null,
        },
      ])
      .select("id, creator_id, name, category, description, created_at");

    if (error) {
      alert(error.message);
      setCreatingCommunity(false);
      return;
    }

    if (data && data.length > 0) {
      const createdCommunity = data[0];

      const { data: memberData, error: memberError } = await supabase
        .from("community_members")
        .insert([
          {
            community_id: createdCommunity.id,
            user_id: userId,
          },
        ])
        .select("id, community_id, user_id, created_at");

      if (memberError) {
        alert(memberError.message);
        setCreatingCommunity(false);
        return;
      }

      setCommunities((prev) => [createdCommunity, ...prev]);
      if (memberData && memberData.length > 0) {
        setCommunityMembers((prev) => [...prev, memberData[0]]);
      }

      setCommunityName("");
      setCommunityCategory("");
      setCommunityDescription("");
      setShowCreateForm(false);
    }

    setCreatingCommunity(false);
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (isMember(communityId)) {
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817] text-white">
        Loading communities...
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
                <p className="text-xs text-slate-400">{t.communities}</p>
              </div>
            </Link>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mx-auto max-w-xl">
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 shadow-[0_10px_35px_rgba(15,23,42,0.14)] transition focus-within:border-cyan-400/40 sm:px-4 lg:py-3">
                <span className="text-sm text-slate-400">⌕</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.searchCommunities}
                  className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-400 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="hidden rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 sm:inline-flex"
            >
              {showCreateForm ? t.close : t.create}
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

            <NotificationDropdown
              iconClassName="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-[13px] text-slate-200 transition hover:bg-white/[0.06]"
            />

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
                  setShowCreateForm((prev) => !prev);
                  setIsMenuOpen(false);
                }}
                className="mobile-menu-primary-action block w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 text-left text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
              >
                {showCreateForm ? t.close : t.create}
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
                  src={userAvatar}
                  alt={userName}
                  className="object-cover h-14 w-14 rounded-2xl ring-2 ring-cyan-400/20"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{userName}</p>
                  <p className="text-sm truncate text-slate-400">{t.community}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">{t.joined}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{myCommunityIds.length}</p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">{t.all}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{communities.length}</p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">{t.posts}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{communityPosts.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-cyan-200">{t.yourCommunities}</p>
                <Link
                  href="/communities"
                  className="text-xs transition text-cyan-300 hover:text-cyan-200"
                >
                  View all
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {joinedCommunities.length === 0 ? (
                  <p className="text-sm leading-6 text-slate-400">
                    Join communities to keep your favorite spaces close.
                  </p>
                ) : (
                  joinedCommunities.map((community) => (
                    <Link
                      key={community.id}
                      href={`/communities/${community.id}`}
                      className="block px-4 py-3 transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                    >
                      <p className="font-medium text-white">{community.name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {community.category || t.communityFallback}
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
                <p className="text-sm font-semibold text-cyan-200">Discover & belong</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Find communities built around shared interests.
                </h2>
                <p className="max-w-xl mt-3 text-sm leading-7 text-slate-300">
                  Join spaces where people learn, share ideas, post updates, and grow
                  together across FaceGrem.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:min-w-[320px]">
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">{t.joined}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{myCommunityIds.length}</p>
                </div>
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">Communities</p>
                  <p className="mt-2 text-2xl font-bold text-white">{communities.length}</p>
                </div>
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">{t.posts}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{communityPosts.length}</p>
                </div>
              </div>
            </div>
          </div>

          {showCreateForm && (
            <form
              onSubmit={handleCreateCommunity}
              className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.92)_45%,rgba(15,23,42,0.96))] shadow-[0_25px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:rounded-[34px]"
            >
              <div className="px-4 py-4 border-b border-white/10 sm:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-cyan-200">Create community</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Start a new space for people to gather around shared interests
                    </p>
                  </div>

                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">
                    Community builder
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    value={communityName}
                    onChange={(e) => setCommunityName(e.target.value)}
                    placeholder="Community name"
                    className="w-full px-4 py-3 text-sm text-white transition border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                  />

                  <input
                    type="text"
                    value={communityCategory}
                    onChange={(e) => setCommunityCategory(e.target.value)}
                    placeholder="Category (optional)"
                    className="w-full px-4 py-3 text-sm text-white transition border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                  />
                </div>

                <textarea
                  value={communityDescription}
                  onChange={(e) => setCommunityDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe your community"
                  className="w-full px-4 py-3 mt-4 text-sm text-white transition border outline-none resize-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                />

                <div className="flex justify-end mt-5">
                  <button
                    type="submit"
                    disabled={creatingCommunity}
                    className="px-6 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
                  >
                    {creatingCommunity ? "Creating..." : "Create community"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {filteredCommunities.length === 0 ? (
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
              <p className="text-lg font-medium text-white">No communities found here yet.</p>
              <p className="mt-2 text-sm text-slate-400">
                Try a different search or create the first community.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredCommunities.map((community) => {
                const memberCount = getCommunityMembersCount(community.id);
                const postCount = getCommunityPostsCount(community.id);
                const creatorName = getBestNameForUser(community.creator_id);
                const creatorAvatar = getBestAvatarForUser(community.creator_id);
                const joined = isMember(community.id);

                return (
                  <article
                    key={community.id}
                    className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-200">
                              {community.category || t.communityFallback}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                              {joined ? "Joined" : "Open"}
                            </span>
                          </div>

                          <h3 className="mt-4 text-2xl font-bold tracking-tight text-white">
                            {community.name}
                          </h3>

                          <p className="mt-3 text-sm leading-7 text-slate-300">
                            {community.description || "No description yet."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-5">
                        <img
                          src={creatorAvatar}
                          alt={creatorName}
                          className="object-cover h-11 w-11 rounded-2xl ring-1 ring-white/10"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">{creatorName}</p>
                          <p className="text-xs text-slate-400">{t.creator}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-5">
                        <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                          <p className="text-xs text-slate-400">{t.members}</p>
                          <p className="mt-2 text-xl font-bold text-white">{memberCount}</p>
                        </div>
                        <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                          <p className="text-xs text-slate-400">{t.posts}</p>
                          <p className="mt-2 text-xl font-bold text-white">{postCount}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-5">
                        <button
                          onClick={() => handleJoinCommunity(community.id)}
                          className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                            joined
                              ? "border border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                              : "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                          }`}
                        >
                          {joined ? "Leave" : "Join"}
                        </button>

                        <Link
                          href={`/communities/${community.id}`}
                          className="px-4 py-3 text-sm font-medium text-center transition border rounded-2xl border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10"
                        >
                          Open
                        </Link>
                      </div>
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
                  const memberCount = getCommunityMembersCount(community.id);

                  return (
                    <Link
                      key={community.id}
                      href={`/communities/${community.id}`}
                      className="block p-4 transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                    >
                      <p className="font-medium text-white">{community.name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {community.category || t.communityFallback} • {memberCount} members
                      </p>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">Creator spotlight</p>
                <p className="mt-1 text-xs text-slate-400">People building communities</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {creatorSpotlight.length === 0 ? (
                <p className="text-sm text-slate-400">No creators to show yet.</p>
              ) : (
                creatorSpotlight.map((profile) => (
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
                        @{profile.username || "creator"}
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
                href="/feed"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Back to feed
              </Link>
              <Link
                href="/videos"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Open videos
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