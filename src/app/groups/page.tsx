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
  const [groupVisibility, setGroupVisibility] = useState<"public" | "private">("public");
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
      setGroupVisibility("public");
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-700 shadow-sm transition hover:bg-slate-200"
              aria-label="Open menu"
            >
              ≡
            </button>

            <FaceGremLogo
              href="/feed"
              showWordmark={false}
              markClassName="h-10 w-10 rounded-2xl ring-0 shadow-sm sm:h-11 sm:w-11"
            />

            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight text-slate-950">FaceGrem</h1>
              <p className="text-xs text-slate-500">{t.groups}</p>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mx-auto max-w-xl">
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 shadow-sm transition focus-within:border-blue-300 focus-within:bg-white">
                <span className="text-sm text-slate-500">🔎</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.searchGroups}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="hidden rounded-full bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 sm:inline-flex"
            >
              {showCreateForm ? t.close : t.create}
            </button>

            <div ref={languageMenuRef} className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
                className="inline-flex h-10 items-center rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-200"
                aria-label="Language"
                title="Language"
              >
                <TranslateLanguageIcon className="mr-2 h-4 w-4" /> {languageLabels[selectedLanguage]}
              </button>

              {isLanguageMenuOpen && (
                <div className="absolute right-0 top-12 z-[90] w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                  {(["en", "sw", "fr", "rw"] as TranslationLanguage[]).map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => handleLanguageChange(language)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                        selectedLanguage === language
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-700 hover:bg-slate-100"
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
              iconClassName="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[13px] text-slate-700 shadow-sm transition hover:bg-slate-200"
            />

            <Link
              href="/profile"
              className="hidden items-center gap-2 rounded-full bg-slate-100 px-2 py-1.5 transition hover:bg-slate-200 md:flex md:px-2 md:pr-3"
            >
              <img
                src={userAvatar}
                alt={userName}
                className="h-8 w-8 rounded-full object-cover"
              />
              <span className="hidden max-w-[120px] truncate text-sm font-semibold text-slate-700 lg:inline-block">
                {userName}
              </span>
            </Link>
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

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:py-8 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <aside className="hidden xl:block">
          <div className="sticky top-[96px] space-y-4">
            <section className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="h-14 w-14 rounded-2xl object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-950">{userName}</p>
                  <p className="truncate text-sm text-slate-500">{t.yourGroupSpace}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-blue-50 px-3 py-3 text-center">
                  <p className="text-[11px] font-semibold text-blue-600">{t.joined}</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{myGroupIds.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
                  <p className="text-[11px] font-semibold text-slate-500">{t.all}</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{groups.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
                  <p className="text-[11px] font-semibold text-slate-500">{t.posts}</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{groupPosts.length}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-950">{t.yourGroups}</p>
                <Link href="/groups" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                  {t.viewAll}
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {joinedGroups.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                    {t.noJoinedGroups}
                  </p>
                ) : (
                  joinedGroups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/communities/${group.id}`}
                      className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50"
                    >
                      <p className="truncate font-semibold text-slate-950">{group.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {group.category || t.groupFallback}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-[34px] bg-white shadow-sm ring-1 ring-slate-200">
            <div className="grid gap-6 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                  {t.discoverBelong}
                </p>
                <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  {t.heroTitle}
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                  {t.heroText}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white">
                    Public groups visible to members
                  </span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                    Clean cards
                  </span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                    Better discovery
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[24px] bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-semibold text-slate-500">{t.joined}</p>
                  <p className="mt-2 text-3xl font-black text-blue-600">{myGroupIds.length}</p>
                </div>
                <div className="rounded-[24px] bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-semibold text-slate-500">{t.groups}</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{groups.length}</p>
                </div>
                <div className="rounded-[24px] bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-semibold text-slate-500">{t.posts}</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{groupPosts.length}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 rounded-[26px] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-950">Group visibility</p>
              <p className="mt-1 text-sm text-slate-500">
                Groups are shown with clear public visibility labels so people know what they can open and join.
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              {showCreateForm ? t.close : t.createGroup}
            </button>
          </div>

          {showCreateForm && (
            <form
              onSubmit={handleCreateGroup}
              className="overflow-hidden rounded-[30px] bg-white shadow-sm ring-1 ring-slate-200"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-blue-600">{t.createGroup}</p>
                    <p className="mt-1 text-sm text-slate-500">{t.createGroupSubtitle}</p>
                  </div>

                  <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
                    {t.groupBuilder}
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Group name
                    </span>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder={t.groupName}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Category
                    </span>
                    <input
                      type="text"
                      value={groupCategory}
                      onChange={(e) => setGroupCategory(e.target.value)}
                      placeholder={t.categoryOptional}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Visibility
                  </span>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {(["public", "private"] as const).map((visibility) => (
                      <button
                        key={visibility}
                        type="button"
                        onClick={() => setGroupVisibility(visibility)}
                        className={`rounded-2xl border px-4 py-4 text-left transition ${
                          groupVisibility === visibility
                            ? "border-blue-300 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <p className="font-bold capitalize">{visibility}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {visibility === "public"
                            ? "Anyone can discover and request to join this group."
                            : "Private visibility UI is ready; database privacy can be added later."}
                        </p>
                      </button>
                    ))}
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Description
                  </span>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    rows={4}
                    placeholder={t.groupDescription}
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white"
                  />
                </label>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={creatingGroup}
                    className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-70"
                  >
                    {creatingGroup ? t.creating : t.createGroupButton}
                  </button>
                </div>
              </div>
            </form>
          )}

          {filteredGroups.length === 0 ? (
            <div className="rounded-[30px] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-lg font-bold text-slate-950">{t.noGroups}</p>
              <p className="mt-2 text-sm text-slate-500">{t.noGroupsSub}</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {filteredGroups.map((group) => {
                const memberCount = getGroupMembersCount(group.id);
                const postCount = getGroupPostsCount(group.id);
                const creatorName = getBestNameForUser(group.creator_id);
                const creatorAvatar = getBestAvatarForUser(group.creator_id);
                const joined = isMember(group.id);

                return (
                  <article
                    key={group.id}
                    className="overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="h-24 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400" />

                    <div className="p-5 sm:p-6">
                      <div className="-mt-14 mb-4 flex items-end justify-between gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white text-2xl shadow-sm ring-4 ring-white">
                          <GroupPeopleIcon className="h-8 w-8 text-blue-600" />
                        </div>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700 shadow-sm ring-1 ring-blue-100">
                          Public
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">
                          {group.category || t.groupFallback}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                            joined
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {joined ? t.joined : t.open}
                        </span>
                      </div>

                      <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
                        {group.name}
                      </h3>

                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                        {group.description || "No description yet."}
                      </p>

                      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                        <img
                          src={creatorAvatar}
                          alt={creatorName}
                          className="h-10 w-10 rounded-2xl object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">{creatorName}</p>
                          <p className="text-xs text-slate-500">{t.creator}</p>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold text-slate-500">{t.members}</p>
                          <p className="mt-2 text-2xl font-black text-slate-950">{memberCount}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold text-slate-500">{t.posts}</p>
                          <p className="mt-2 text-2xl font-black text-slate-950">{postCount}</p>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleJoinGroup(group.id)}
                          className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                            joined
                              ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                          }`}
                        >
                          {joined ? t.leave : t.join}
                        </button>

                        <Link
                          href={`/communities/${group.id}`}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-100"
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

        <aside className="space-y-5">
          <section className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div>
              <p className="text-sm font-bold text-slate-950">{t.suggestedGroups}</p>
              <p className="mt-1 text-xs text-slate-500">{t.suggestedGroupsSub}</p>
            </div>

            <div className="mt-4 space-y-3">
              {suggestedGroups.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">{t.noGroups}</p>
              ) : (
                suggestedGroups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/communities/${group.id}`}
                    className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                        <GroupPeopleIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-950">{group.name}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {group.category || t.groupFallback}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div>
              <p className="text-sm font-bold text-slate-950">{t.quickLinks}</p>
              <p className="mt-1 text-xs text-slate-500">{t.moveFast}</p>
            </div>

            <div className="mt-4 space-y-3">
              <Link
                href="/feed"
                className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm">⌂</span>
                {t.backToFeed}
              </Link>
              <Link
                href="/communities"
                className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <CommunityCircleIcon className="h-5 w-5 text-blue-600" />
                {t.openCommunities}
              </Link>
              <Link
                href="/messages"
                className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <MessageBubblesIcon className="h-5 w-5 text-blue-600" />
                {t.openMessages}
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <FriendsFistIcon className="h-5 w-5 text-blue-600" />
                {t.visitProfile}
              </Link>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
