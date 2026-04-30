"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../components/LanguageProvider";
import LanguageMenu from "../../components/LanguageMenu";
import NotificationDropdown from "../../components/NotificationDropdown";
import FaceGremLogo from "../../components/FaceGremLogo";
import { CommunityCircleIcon, FriendsFistIcon, GroupPeopleIcon, MessageBubblesIcon, TranslateLanguageIcon } from "../../components/FaceGremCustomIcons";

type ProfileRecord = {
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
  created_at?: string | null;
};

type FriendTab = "suggestions" | "following" | "followers";

const friendsPageText = {
  en: {
    title: "Friends",
    subtitle: "Find people, manage your connections, and grow your FaceGrem circle.",
    search: "Search people...",
    menu: "Menu",
    homeFeed: "Home Feed",
    videos: "Videos",
    communities: "Communities",
    groups: "Groups",
    messages: "Messages",
    saved: "Saved",
    settings: "Settings",
    logout: "Log out",
    suggestions: "Suggestions",
    following: "Following",
    followers: "Followers",
    follow: "Follow",
    followingButton: "Following",
    unfollow: "Unfollow",
    message: "Message",
    viewProfile: "View Profile",
    noPeople: "No people found.",
    noPeopleSub: "Try another search or check again later.",
    peopleYouMayKnow: "People you may know",
    yourNetwork: "Your network",
    quickLinks: "Quick links",
    onlineFriends: "Active people",
    online: "Online",
    profile: "Profile",
    loading: "Loading friends...",
    statsSuggestions: "Suggestions",
    statsFollowing: "Following",
    statsFollowers: "Followers",
    alreadyConnected: "Already connected",
    connectMore: "Connect with more people",
  },
  sw: {
    title: "Marafiki",
    subtitle: "Tafuta watu, simamia miunganisho yako, na ukuze mzunguko wako wa FaceGrem.",
    search: "Tafuta watu...",
    menu: "Menyu",
    homeFeed: "Feed ya nyumbani",
    videos: "Video",
    communities: "Jumuiya",
    groups: "Makundi",
    messages: "Ujumbe",
    saved: "Zilizohifadhiwa",
    settings: "Mipangilio",
    logout: "Toka",
    suggestions: "Mapendekezo",
    following: "Unafuata",
    followers: "Wanaokufuata",
    follow: "Fuata",
    followingButton: "Unafuata",
    unfollow: "Acha kufuata",
    message: "Ujumbe",
    viewProfile: "Tazama wasifu",
    noPeople: "Hakuna watu waliopatikana.",
    noPeopleSub: "Jaribu utafutaji mwingine au angalia tena baadaye.",
    peopleYouMayKnow: "Watu unaoweza kuwajua",
    yourNetwork: "Mtandao wako",
    quickLinks: "Viungo vya haraka",
    onlineFriends: "Watu walio active",
    online: "Mtandaoni",
    profile: "Wasifu",
    loading: "Inapakia marafiki...",
    statsSuggestions: "Mapendekezo",
    statsFollowing: "Unafuata",
    statsFollowers: "Wanaokufuata",
    alreadyConnected: "Mmeunganishwa tayari",
    connectMore: "Ungana na watu zaidi",
  },
  fr: {
    title: "Amis",
    subtitle: "Trouvez des personnes, gérez vos connexions et développez votre cercle FaceGrem.",
    search: "Rechercher des personnes...",
    menu: "Menu",
    homeFeed: "Fil d’accueil",
    videos: "Vidéos",
    communities: "Communautés",
    groups: "Groupes",
    messages: "Messages",
    saved: "Enregistrés",
    settings: "Paramètres",
    logout: "Se déconnecter",
    suggestions: "Suggestions",
    following: "Abonnements",
    followers: "Abonnés",
    follow: "Suivre",
    followingButton: "Suivi",
    unfollow: "Ne plus suivre",
    message: "Message",
    viewProfile: "Voir le profil",
    noPeople: "Aucune personne trouvée.",
    noPeopleSub: "Essayez une autre recherche ou revenez plus tard.",
    peopleYouMayKnow: "Personnes que vous connaissez peut-être",
    yourNetwork: "Votre réseau",
    quickLinks: "Liens rapides",
    onlineFriends: "Personnes actives",
    online: "En ligne",
    profile: "Profil",
    loading: "Chargement des amis...",
    statsSuggestions: "Suggestions",
    statsFollowing: "Abonnements",
    statsFollowers: "Abonnés",
    alreadyConnected: "Déjà connecté",
    connectMore: "Connectez-vous avec plus de personnes",
  },
  rw: {
    title: "Inshuti",
    subtitle: "Shaka abantu, cunga abo muhuza, kandi wagure umuryango wawe kuri FaceGrem.",
    search: "Shaka abantu...",
    menu: "Menyu",
    homeFeed: "Feed y’ahabanza",
    videos: "Video",
    communities: "Imiryango",
    groups: "Amatsinda",
    messages: "Ubutumwa",
    saved: "Ibyabitswe",
    settings: "Igenamiterere",
    logout: "Sohoka",
    suggestions: "Abo usabwa",
    following: "Abo ukurikira",
    followers: "Abagukurikira",
    follow: "Kurikira",
    followingButton: "Urakurikira",
    unfollow: "Reka gukurikira",
    message: "Ubutumwa",
    viewProfile: "Reba umwirondoro",
    noPeople: "Nta bantu babonetse.",
    noPeopleSub: "Gerageza gushaka ukundi cyangwa uzongere nyuma.",
    peopleYouMayKnow: "Abantu ushobora kuba uzi",
    yourNetwork: "Urusobe rwawe",
    quickLinks: "Links zihuse",
    onlineFriends: "Abantu bari active",
    online: "Ari online",
    profile: "Umwirondoro",
    loading: "Birimo gupakira inshuti...",
    statsSuggestions: "Abo usabwa",
    statsFollowing: "Abo ukurikira",
    statsFollowers: "Abagukurikira",
    alreadyConnected: "Mwaramaze guhuzwa",
    connectMore: "Huza n’abantu benshi",
  },
} as const;

type IconProps = { className?: string };

function HomeIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.75 12 4l9 6.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 9.75V20h13V9.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 20v-5.5h5V20" />
    </svg>
  );
}

function VideoIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <rect x="3" y="6" width="13" height="12" rx="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m16 10 5-3v10l-5-3" />
    </svg>
  );
}

function PeopleIcon({ className = "h-5 w-5" }: IconProps) {
  return <FriendsFistIcon className={className} />;
}

function CommunityIcon({ className = "h-5 w-5" }: IconProps) {
  return <CommunityCircleIcon className={className} />;
}

function GroupsIcon({ className = "h-5 w-5" }: IconProps) {
  return <GroupPeopleIcon className={className} />;
}

function MessageIcon({ className = "h-5 w-5" }: IconProps) {
  return <MessageBubblesIcon className={className} />;
}

function BookmarkIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5V20l-6.5-4-6.5 4V6A1.5 1.5 0 0 1 7 4.5Z" />
    </svg>
  );
}

function SettingsIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <circle cx="12" cy="12" r="3.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.2 14.7a1.2 1.2 0 0 0 .25 1.32l.03.03a1.45 1.45 0 0 1-2.05 2.05l-.03-.03a1.2 1.2 0 0 0-1.32-.25 1.2 1.2 0 0 0-.72 1.1V19a1.45 1.45 0 0 1-2.9 0v-.08a1.2 1.2 0 0 0-.8-1.14 1.2 1.2 0 0 0-1.25.28l-.04.04a1.45 1.45 0 1 1-2.05-2.05l.04-.04a1.2 1.2 0 0 0 .25-1.32 1.2 1.2 0 0 0-1.1-.72H5a1.45 1.45 0 0 1 0-2.9h.08a1.2 1.2 0 0 0 1.14-.8 1.2 1.2 0 0 0-.28-1.25l-.04-.04A1.45 1.45 0 1 1 7.95 6.9l.04.04a1.2 1.2 0 0 0 1.32.25 1.2 1.2 0 0 0 .72-1.1V6a1.45 1.45 0 0 1 2.9 0v.08a1.2 1.2 0 0 0 .8 1.14 1.2 1.2 0 0 0 1.25-.28l.04-.04a1.45 1.45 0 0 1 2.05 2.05l-.04.04a1.2 1.2 0 0 0-.25 1.32 1.2 1.2 0 0 0 1.1.72H19a1.45 1.45 0 0 1 0 2.9h-.08a1.2 1.2 0 0 0-1.14.8Z" />
    </svg>
  );
}

function SearchIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="11" cy="11" r="6" />
      <path strokeLinecap="round" d="m20 20-4.35-4.35" />
    </svg>
  );
}

function MenuIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function LogoutIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 7V5.75A1.75 1.75 0 0 0 12.25 4H6.75A1.75 1.75 0 0 0 5 5.75v12.5C5 19.22 5.78 20 6.75 20h5.5A1.75 1.75 0 0 0 14 18.25V17" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 12h10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m17 8 4 4-4 4" />
    </svg>
  );
}

export default function FriendsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const ft = friendsPageText[language] || friendsPageText.en;

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");
  const [userAvatar, setUserAvatar] = useState("");
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [follows, setFollows] = useState<FollowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<FriendTab>("suggestions");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [busyProfileId, setBusyProfileId] = useState("");

  const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || "FaceGrem User"
    )}&background=0f172a&color=ffffff&bold=true`;

  const myFollowingIds = useMemo(
    () =>
      new Set(
        follows
          .filter((follow) => follow.follower_id === userId)
          .map((follow) => follow.following_id)
      ),
    [follows, userId]
  );

  const myFollowerIds = useMemo(
    () =>
      new Set(
        follows
          .filter((follow) => follow.following_id === userId)
          .map((follow) => follow.follower_id)
      ),
    [follows, userId]
  );

  const followingProfiles = useMemo(
    () => profiles.filter((profile) => myFollowingIds.has(profile.id)),
    [profiles, myFollowingIds]
  );

  const followerProfiles = useMemo(
    () => profiles.filter((profile) => myFollowerIds.has(profile.id)),
    [profiles, myFollowerIds]
  );

  const suggestionProfiles = useMemo(
    () =>
      profiles.filter(
        (profile) => profile.id !== userId && !myFollowingIds.has(profile.id)
      ),
    [profiles, myFollowingIds, userId]
  );

  const visibleProfiles = useMemo(() => {
    const base =
      activeTab === "following"
        ? followingProfiles
        : activeTab === "followers"
        ? followerProfiles
        : suggestionProfiles;

    const term = searchText.trim().toLowerCase();

    if (!term) return base;

    return base.filter((profile) => {
      const text = `${profile.full_name} ${profile.username} ${profile.bio}`.toLowerCase();
      return text.includes(term);
    });
  }, [
    activeTab,
    followingProfiles,
    followerProfiles,
    suggestionProfiles,
    searchText,
  ]);

  const activePeople = useMemo(
    () => profiles.filter((profile) => profile.id !== userId).slice(0, 8),
    [profiles, userId]
  );

  useEffect(() => {
    const loadFriendsPage = async () => {
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

      const [{ data: profilesData }, { data: followsData }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, bio, avatar_url"),
        supabase.from("follows").select("id, follower_id, following_id, created_at"),
      ]);

      const allProfiles = profilesData || [];
      const myProfile = allProfiles.find((profile) => profile.id === currentUserId);

      setProfiles(allProfiles);
      setFollows(followsData || []);
      setUserAvatar(
        myProfile?.avatar_url || getAvatarUrl(myProfile?.full_name || currentUserName)
      );
      setLoading(false);
    };

    void loadFriendsPage();
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    const followsChannel = supabase
      .channel(`friends-follows-live-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "follows",
        },
        (payload) => {
          const newFollow = payload.new as FollowRecord;

          setFollows((prev) => {
            if (prev.some((follow) => follow.id === newFollow.id)) return prev;
            return [newFollow, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "follows",
        },
        (payload) => {
          const deletedFollow = payload.old as Partial<FollowRecord>;

          setFollows((prev) =>
            prev.filter((follow) => follow.id !== deletedFollow.id)
          );
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel("friends-profiles-live")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          const updatedProfile = payload.new as ProfileRecord;

          setProfiles((prev) =>
            prev.map((profile) =>
              profile.id === updatedProfile.id ? updatedProfile : profile
            )
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(followsChannel);
      void supabase.removeChannel(profilesChannel);
    };
  }, [userId]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/");
  };

  const handleToggleFollow = async (profileId: string) => {
    if (!userId || profileId === userId) return;

    setBusyProfileId(profileId);

    const existingFollow = follows.find(
      (follow) => follow.follower_id === userId && follow.following_id === profileId
    );

    if (existingFollow) {
      const { error } = await supabase.from("follows").delete().eq("id", existingFollow.id);

      if (error) {
        alert(error.message);
        setBusyProfileId("");
        return;
      }

      setFollows((prev) => prev.filter((follow) => follow.id !== existingFollow.id));
      setBusyProfileId("");
      return;
    }

    const { data, error } = await supabase
      .from("follows")
      .insert([{ follower_id: userId, following_id: profileId }])
      .select("id, follower_id, following_id, created_at");

    if (error) {
      alert(error.message);
      setBusyProfileId("");
      return;
    }

    if (data && data.length > 0) {
      setFollows((prev) => [data[0], ...prev]);
    }

    setBusyProfileId("");
  };

  const menuItems = [
    { href: "/feed", label: ft.homeFeed, icon: <HomeIcon className="h-5 w-5 text-slate-500" /> },
    { href: "/videos", label: ft.videos, icon: <VideoIcon className="h-5 w-5 text-slate-500" /> },
    { href: "/communities", label: ft.communities, icon: <CommunityIcon className="h-5 w-5 text-slate-500" /> },
    { href: "/groups", label: ft.groups, icon: <GroupsIcon className="h-5 w-5 text-slate-500" /> },
    { href: "/messages", label: ft.messages, icon: <MessageIcon className="h-5 w-5 text-slate-500" /> },
    { href: "/saved", label: ft.saved, icon: <BookmarkIcon className="h-5 w-5 text-slate-500" /> },
    { href: "/settings", label: ft.settings, icon: <SettingsIcon className="h-5 w-5 text-slate-500" /> },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5] text-slate-700">
        {ft.loading}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-[#050505]">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
          <FaceGremLogo
            href="/feed"
            showWordmark={false}
            markClassName="h-10 w-10 rounded-full ring-0 shadow-none"
          />

          <div className="hidden w-[300px] items-center gap-2 rounded-full bg-slate-100 px-4 py-2 md:flex">
            <SearchIcon className="h-4 w-4 text-slate-500" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder={ft.search}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
            />
          </div>

          <nav className="mx-auto hidden h-full items-center gap-2 lg:flex">
            <Link href="/feed" className="flex h-12 w-24 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              <HomeIcon className="h-6 w-6" />
            </Link>
            <Link href="/friends" className="flex h-12 w-24 items-center justify-center border-b-4 border-blue-600 text-blue-600">
              <PeopleIcon className="h-6 w-6" />
            </Link>
            <Link href="/videos" className="flex h-12 w-24 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              <VideoIcon className="h-6 w-6" />
            </Link>
            <Link href="/communities" className="flex h-12 w-24 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              <CommunityIcon className="h-6 w-6" />
            </Link>
            <Link href="/messages" className="flex h-12 w-24 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              <MessageIcon className="h-6 w-6" />
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-sm transition hover:bg-slate-200 hover:text-slate-900"
              aria-label={ft.menu}
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            <LanguageMenu compact />

            <NotificationDropdown
              iconClassName="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-sm transition hover:bg-slate-200 hover:text-slate-900"
            />

            <Link href="/profile" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100">
              <img
                src={userAvatar || getAvatarUrl(userName)}
                alt={userName}
                className="h-full w-full object-cover"
              />
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-100 px-3 py-2 md:hidden">
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
            <SearchIcon className="h-4 w-4 text-slate-500" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder={ft.search}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
            />
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/35"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-[90] flex h-full w-[320px] max-w-[88vw] flex-col overflow-y-auto bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{ft.menu}</h2>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-sm transition hover:bg-slate-200 hover:text-slate-900"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-3">
              <Link
                href="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl p-2 hover:bg-white"
              >
                <img
                  src={userAvatar || getAvatarUrl(userName)}
                  alt={userName}
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">{userName}</p>
                  <p className="text-xs text-slate-500">{ft.viewProfile}</p>
                </div>
              </Link>
            </div>

            <div className="mt-4 grid gap-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl p-3 text-left font-medium text-red-600 hover:bg-red-50"
              >
                <span className="inline-flex items-center gap-3">
                  <LogoutIcon className="h-5 w-5" />
                  {ft.logout}
                </span>
              </button>
            </div>
          </aside>
        </>
      )}

      <main className="mx-auto grid max-w-[1460px] gap-5 px-3 py-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="hidden lg:block">
          <div className="sticky top-[72px] space-y-2">
            <Link href="/profile" className="flex items-center gap-3 rounded-xl p-3 hover:bg-white">
              <img
                src={userAvatar || getAvatarUrl(userName)}
                alt={userName}
                className="h-9 w-9 rounded-full object-cover"
              />
              <span className="font-medium">{userName}</span>
            </Link>

            <Link href="/feed" className="flex items-center gap-3 rounded-xl p-3 text-slate-700 transition hover:bg-white hover:text-slate-900">
              <HomeIcon className="h-5 w-5 text-slate-500" />
              {ft.homeFeed}
            </Link>
            <Link href="/friends" className="flex items-center gap-3 rounded-xl bg-white p-3 font-semibold text-blue-600 shadow-sm">
              <PeopleIcon className="h-5 w-5" />
              {ft.title}
            </Link>
            <Link href="/saved" className="flex items-center gap-3 rounded-xl p-3 text-slate-700 transition hover:bg-white hover:text-slate-900">
              <BookmarkIcon className="h-5 w-5 text-slate-500" />
              {ft.saved}
            </Link>
            <Link href="/groups" className="flex items-center gap-3 rounded-xl p-3 text-slate-700 transition hover:bg-white hover:text-slate-900">
              <GroupsIcon className="h-5 w-5 text-slate-500" />
              {ft.groups}
            </Link>
            <Link href="/communities" className="flex items-center gap-3 rounded-xl p-3 text-slate-700 transition hover:bg-white hover:text-slate-900">
              <CommunityIcon className="h-5 w-5 text-slate-500" />
              {ft.communities}
            </Link>
            <Link href="/videos" className="flex items-center gap-3 rounded-xl p-3 text-slate-700 transition hover:bg-white hover:text-slate-900">
              <VideoIcon className="h-5 w-5 text-slate-500" />
              {ft.videos}
            </Link>
            <Link href="/settings" className="flex items-center gap-3 rounded-xl p-3 text-slate-700 transition hover:bg-white hover:text-slate-900">
              <SettingsIcon className="h-5 w-5 text-slate-500" />
              {ft.settings}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-red-600 hover:bg-red-50"
            >
              <LogoutIcon className="h-5 w-5" />
              {ft.logout}
            </button>
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-2xl bg-white p-5 shadow-sm">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
              <div>
                <p className="text-sm font-semibold text-blue-600">FaceGrem</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  {ft.title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  {ft.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-xs text-slate-500">{ft.statsSuggestions}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {suggestionProfiles.length}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-xs text-slate-500">{ft.statsFollowing}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {followingProfiles.length}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-xs text-slate-500">{ft.statsFollowers}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {followerProfiles.length}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "suggestions" as const, label: ft.suggestions },
                  { id: "following" as const, label: ft.following },
                  { id: "followers" as const, label: ft.followers },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 sm:w-[280px]">
                <SearchIcon className="h-4 w-4 text-slate-500" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder={ft.search}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
                />
              </div>
            </div>
          </section>

          {visibleProfiles.length === 0 ? (
            <section className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-semibold text-slate-950">{ft.noPeople}</p>
              <p className="mt-2 text-sm text-slate-500">{ft.noPeopleSub}</p>
            </section>
          ) : (
            <section className="grid gap-4 md:grid-cols-2">
              {visibleProfiles.map((profile) => {
                const isFollowing = myFollowingIds.has(profile.id);
                const isFollower = myFollowerIds.has(profile.id);
                const isBusy = busyProfileId === profile.id;

                return (
                  <article key={profile.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="h-24 bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-500" />

                    <div className="-mt-10 px-5 pb-5">
                      <div className="flex items-end justify-between gap-3">
                        <img
                          src={profile.avatar_url || getAvatarUrl(profile.full_name)}
                          alt={profile.full_name}
                          className="h-20 w-20 rounded-3xl border-4 border-white object-cover shadow-md"
                        />

                        <div className="flex gap-2 pb-1">
                          <Link
                            href={`/messages?user=${profile.id}`}
                            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                          >
                            {ft.message}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleToggleFollow(profile.id)}
                            disabled={isBusy}
                            className={`rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                              isFollowing
                                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            {isFollowing ? ft.unfollow : ft.follow}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Link href={`/profile?id=${profile.id}`} className="group">
                          <h2 className="truncate text-lg font-bold text-slate-950 group-hover:text-blue-600">
                            {profile.full_name}
                          </h2>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            @{profile.username || "facegrem"}
                          </p>
                        </Link>

                        <p className="mt-3 line-clamp-3 min-h-[60px] text-sm leading-6 text-slate-600">
                          {profile.bio || ft.connectMore}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {isFollowing && (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                              {ft.followingButton}
                            </span>
                          )}
                          {isFollower && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                              {ft.followers}
                            </span>
                          )}
                          {isFollowing && isFollower && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                              {ft.alreadyConnected}
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/profile?id=${profile.id}`}
                          className="mt-4 block rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          {ft.viewProfile}
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-[72px] space-y-4">
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-semibold text-slate-700">{ft.peopleYouMayKnow}</p>
              <div className="mt-4 space-y-3">
                {suggestionProfiles.slice(0, 4).map((profile) => (
                  <div key={profile.id} className="flex items-center gap-3">
                    <img
                      src={profile.avatar_url || getAvatarUrl(profile.full_name)}
                      alt={profile.full_name}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{profile.full_name}</p>
                      <p className="truncate text-xs text-slate-500">
                        @{profile.username || "facegrem"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(profile.id)}
                      disabled={busyProfileId === profile.id}
                      className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {ft.follow}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-semibold text-slate-700">{ft.yourNetwork}</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">{ft.following}</p>
                  <p className="mt-1 text-xl font-bold">{followingProfiles.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">{ft.followers}</p>
                  <p className="mt-1 text-xl font-bold">{followerProfiles.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">{ft.suggestions}</p>
                  <p className="mt-1 text-xl font-bold">{suggestionProfiles.length}</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-slate-700">{ft.onlineFriends}</p>
                <span className="text-sm text-slate-400">{ft.online}</span>
              </div>

              <div className="space-y-1">
                {activePeople.map((profile) => (
                  <Link
                    key={profile.id}
                    href={`/messages?user=${profile.id}`}
                    className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                  >
                    <div className="relative">
                      <img
                        src={profile.avatar_url || getAvatarUrl(profile.full_name)}
                        alt={profile.full_name}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                    </div>
                    <span className="truncate text-sm font-medium">{profile.full_name}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-semibold text-slate-700">{ft.quickLinks}</p>
              <div className="mt-4 space-y-2">
                {menuItems.slice(0, 6).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </main>
    </div>
  );
}
