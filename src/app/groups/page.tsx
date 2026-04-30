"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../components/LanguageProvider";
import NotificationDropdown from "../../components/NotificationDropdown";
import FaceGremLogo from "../../components/FaceGremLogo";
import { CommunityCircleIcon, FriendsFistIcon, GroupPeopleIcon, MessageBubblesIcon, TranslateLanguageIcon } from "../../components/FaceGremCustomIcons";
import FaceGremHamburgerMenu from "../../components/FaceGremHamburgerMenu";

type GroupRecord = {
  id: string;
  creator_id: string;
  name: string;
  category: string | null;
  description: string | null;
  created_at: string;
};

type GroupMemberRecord = {
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

export default function GroupsPage() {
  const router = useRouter();
  const languageMenuRef = useRef<HTMLDivElement | null>(null);

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");
  const [userAvatar, setUserAvatar] = useState("");
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMemberRecord[]>([]);
  const [groupPosts, setGroupPosts] = useState<PostRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupCategory, setGroupCategory] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
    const loadGroupsPage = async () => {
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
        { data: groupsData },
        { data: groupMembersData },
        { data: groupPostsData },
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
      setGroups(groupsData || []);
      setGroupMembers(groupMembersData || []);
      setGroupPosts(groupPostsData || []);
      setNotifications(notificationsData || []);
      setUserAvatar(
        myProfile?.avatar_url || getAvatarUrl(myProfile?.full_name || currentUserName)
      );
      setLoading(false);
    };

    void loadGroupsPage();
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

  const myGroupIds = useMemo(() => {
    return groupMembers
      .filter((member) => member.user_id === userId)
      .map((member) => member.community_id);
  }, [groupMembers, userId]);

  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return groups;

    return groups.filter((group) => {
      const haystack =
        `${group.name} ${group.category || ""} ${group.description || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [groups, searchTerm]);

  const joinedGroups = useMemo(() => {
    return groups.filter((group) => myGroupIds.includes(group.id)).slice(0, 4);
  }, [groups, myGroupIds]);

  const suggestedGroups = useMemo(() => {
    return groups.filter((group) => !myGroupIds.includes(group.id)).slice(0, 5);
  }, [groups, myGroupIds]);

  const getGroupMembersCount = (groupId: string) => {
    return groupMembers.filter((member) => member.community_id === groupId).length;
  };

  const getGroupPostsCount = (groupId: string) => {
    return groupPosts.filter((post) => post.community_id === groupId).length;
  };

  const isMember = (groupId: string) => {
    return myGroupIds.includes(groupId);
  };

  const handleCreateGroup = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = groupName.trim();
    const trimmedCategory = groupCategory.trim();
    const trimmedDescription = groupDescription.trim();

    if (!trimmedName) {
      alert("Group name is required.");
      return;
    }

    setCreatingGroup(true);

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
      setCreatingGroup(false);
      return;
    }

    if (data && data.length > 0) {
      const createdGroup = data[0];

      const { data: memberData, error: memberError } = await supabase
        .from("community_members")
        .insert([
          {
            community_id: createdGroup.id,
            user_id: userId,
          },
        ])
        .select("id, community_id, user_id, created_at");

      if (memberError) {
        alert(memberError.message);
        setCreatingGroup(false);
        return;
      }

      setGroups((prev) => [createdGroup, ...prev]);
      if (memberData && memberData.length > 0) {
        setGroupMembers((prev) => [...prev, memberData[0]]);
      }

      setGroupName("");
      setGroupCategory("");
      setGroupDescription("");
      setShowCreateForm(false);
    }

    setCreatingGroup(false);
  };

  const handleJoinGroup = async (groupId: string) => {
    if (isMember(groupId)) {
      const existingMember = groupMembers.find(
        (member) => member.community_id === groupId && member.user_id === userId
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

      setGroupMembers((prev) =>
        prev.filter((member) => member.id !== existingMember.id)
      );
      return;
    }

    const { data, error } = await supabase
      .from("community_members")
      .insert([
        {
          community_id: groupId,
          user_id: userId,
        },
      ])
      .select("id, community_id, user_id, created_at");

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setGroupMembers((prev) => [...prev, data[0]]);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5] text-[#050505]">
        {t.loadingGroups}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-[#050505]">
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
                <p className="text-xs text-slate-500">{t.brandTagline}</p>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mx-auto max-w-xl">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition focus-within:border-cyan-400/40 sm:px-4 lg:py-3">
                <span className="text-sm text-slate-500">⌕</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.searchGroups}
                  className="w-full bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="hidden rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-blue-200 sm:inline-flex"
            >
              {showCreateForm ? t.close : t.create}
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
                  src={userAvatar}
                  alt={userName}
                  className="object-cover h-14 w-14 rounded-2xl ring-2 ring-cyan-400/20"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{userName}</p>
                  <p className="text-sm truncate text-slate-500">{t.yourGroupSpace}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="px-3 py-3 text-center border rounded-2xl border-slate-200 bg-white/5">
                  <p className="text-[11px] text-slate-500">{t.joined}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{myGroupIds.length}</p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-slate-200 bg-white/5">
                  <p className="text-[11px] text-slate-500">{t.all}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{groups.length}</p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-slate-200 bg-white/5">
                  <p className="text-[11px] text-slate-500">{t.posts}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{groupPosts.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/5 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-blue-600">{t.yourGroups}</p>
                <Link
                  href="/groups"
                  className="text-xs transition text-cyan-300 hover:text-blue-600"
                >
                  {t.viewAll}
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {joinedGroups.length === 0 ? (
                  <p className="text-sm leading-6 text-slate-500">
                    {t.noJoinedGroups}
                  </p>
                ) : (
                  joinedGroups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/communities/${group.id}`}
                      className="block px-4 py-3 transition border rounded-2xl border-slate-200 bg-white/5 hover:bg-white/10"
                    >
                      <p className="font-medium text-slate-900">{group.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {group.category || t.groupFallback}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-5 sm:space-y-6">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,rgba(8,47,73,0.95),rgba(15,23,42,0.95)_55%,rgba(30,41,59,0.95))] p-6 shadow-[0_30px_120px_rgba(6,182,212,0.10)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-blue-600">{t.discoverBelong}</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#050505] sm:text-4xl">
                  {t.heroTitle}
                </h2>
                <p className="max-w-xl mt-3 text-sm leading-7 text-slate-600">
                  {t.heroText}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:min-w-[320px]">
                <div className="p-4 border rounded-2xl border-slate-200 bg-white/5">
                  <p className="text-xs text-slate-500">{t.joined}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{myGroupIds.length}</p>
                </div>
                <div className="p-4 border rounded-2xl border-slate-200 bg-white/5">
                  <p className="text-xs text-slate-500">{t.groups}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{groups.length}</p>
                </div>
                <div className="p-4 border rounded-2xl border-slate-200 bg-white/5">
                  <p className="text-xs text-slate-500">{t.posts}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{groupPosts.length}</p>
                </div>
              </div>
            </div>
          </div>

          {showCreateForm && (
            <form
              onSubmit={handleCreateGroup}
              className="overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.92)_45%,rgba(15,23,42,0.96))] shadow-[0_25px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:rounded-[34px]"
            >
              <div className="px-4 py-4 border-b border-slate-200 sm:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-blue-600">{t.createGroup}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t.createGroupSubtitle}
                    </p>
                  </div>

                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-blue-600">
                    {t.groupBuilder}
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder={t.groupName}
                    className="w-full px-4 py-3 text-sm text-slate-700 transition border outline-none rounded-2xl border-slate-200 bg-white/5 placeholder:text-slate-500 focus:border-cyan-400/40"
                  />

                  <input
                    type="text"
                    value={groupCategory}
                    onChange={(e) => setGroupCategory(e.target.value)}
                    placeholder={t.categoryOptional}
                    className="w-full px-4 py-3 text-sm text-slate-700 transition border outline-none rounded-2xl border-slate-200 bg-white/5 placeholder:text-slate-500 focus:border-cyan-400/40"
                  />
                </div>

                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  rows={4}
                  placeholder={t.groupDescription}
                  className="w-full px-4 py-3 mt-4 text-sm text-slate-700 transition border outline-none resize-none rounded-2xl border-slate-200 bg-white/5 placeholder:text-slate-500 focus:border-cyan-400/40"
                />

                <div className="flex justify-end mt-5">
                  <button
                    type="submit"
                    disabled={creatingGroup}
                    className="px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg rounded-2xl bg-blue-600 shadow-blue-200 disabled:opacity-70"
                  >
                    {creatingGroup ? t.creating : t.createGroupButton}
                  </button>
                </div>
              </div>
            </form>
          )}

          {filteredGroups.length === 0 ? (
            <div className="rounded-[30px] border border-slate-200 bg-white/5 p-8 text-center backdrop-blur-xl">
              <p className="text-lg font-medium text-slate-900">{t.noGroups}</p>
              <p className="mt-2 text-sm text-slate-500">
                {t.noGroupsSub}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredGroups.map((group) => {
                const memberCount = getGroupMembersCount(group.id);
                const postCount = getGroupPostsCount(group.id);
                const creatorName = getBestNameForUser(group.creator_id);
                const creatorAvatar = getBestAvatarForUser(group.creator_id);
                const joined = isMember(group.id);

                return (
                  <article
                    key={group.id}
                    className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/5 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-blue-600">
                            {group.category || t.groupFallback}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white/5 px-2.5 py-1 text-[11px] text-slate-600">
                            {joined ? t.joined : t.open}
                          </span>
                        </div>

                        <h3 className="mt-4 text-2xl font-bold tracking-tight text-[#050505]">
                          {group.name}
                        </h3>

                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {group.description || "No description yet."}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 mt-5">
                        <img
                          src={creatorAvatar}
                          alt={creatorName}
                          className="object-cover h-11 w-11 rounded-2xl ring-1 ring-white/10"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{creatorName}</p>
                          <p className="text-xs text-slate-500">{t.creator}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-5">
                        <div className="p-4 border rounded-2xl border-slate-200 bg-white/5">
                          <p className="text-xs text-slate-500">{t.members}</p>
                          <p className="mt-2 text-xl font-bold text-slate-900">{memberCount}</p>
                        </div>
                        <div className="p-4 border rounded-2xl border-slate-200 bg-white/5">
                          <p className="text-xs text-slate-500">{t.posts}</p>
                          <p className="mt-2 text-xl font-bold text-slate-900">{postCount}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-5">
                        <button
                          onClick={() => handleJoinGroup(group.id)}
                          className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                            joined
                              ? "border border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                              : "bg-blue-600 text-[#050505] shadow-lg shadow-blue-200"
                          }`}
                        >
                          {joined ? t.leave : t.join}
                        </button>

                        <Link
                          href={`/communities/${group.id}`}
                          className="px-4 py-3 text-sm font-medium text-center transition border rounded-2xl border-slate-200 bg-white/5 text-cyan-300 hover:bg-white/10"
                        >
                          {t.open}
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
          <div className="rounded-[28px] border border-slate-200 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div>
              <p className="text-sm font-semibold text-blue-600">{t.suggestedGroups}</p>
              <p className="mt-1 text-xs text-slate-500">{t.suggestedGroupsSub}</p>
            </div>

            <div className="mt-4 space-y-4">
              {suggestedGroups.length === 0 ? (
                <p className="text-sm text-slate-500">{t.noGroups}</p>
              ) : (
                suggestedGroups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/communities/${group.id}`}
                    className="block p-4 transition border rounded-2xl border-slate-200 bg-white/5 hover:bg-white/10"
                  >
                    <p className="font-medium text-slate-900 truncate">{group.name}</p>
                    <p className="mt-1 text-xs truncate text-slate-500">
                      {group.category || t.groupFallback}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div>
              <p className="text-sm font-semibold text-blue-600">{t.quickLinks}</p>
              <p className="mt-1 text-xs text-slate-500">{t.moveFast}</p>
            </div>

            <div className="mt-4 space-y-3">
              <Link
                href="/feed"
                className="block px-4 py-3 text-sm text-slate-700 transition border rounded-2xl border-slate-200 bg-white/5 hover:bg-white/10"
              >
                {t.backToFeed}
              </Link>
              <Link
                href="/communities"
                className="block px-4 py-3 text-sm text-slate-700 transition border rounded-2xl border-slate-200 bg-white/5 hover:bg-white/10"
              >
                {t.openCommunities}
              </Link>
              <Link
                href="/messages"
                className="block px-4 py-3 text-sm text-slate-700 transition border rounded-2xl border-slate-200 bg-white/5 hover:bg-white/10"
              >
                {t.openMessages}
              </Link>
              <Link
                href="/profile"
                className="block px-4 py-3 text-sm text-slate-700 transition border rounded-2xl border-slate-200 bg-white/5 hover:bg-white/10"
              >
                {t.visitProfile}
              </Link>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
