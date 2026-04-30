"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
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

type StoryRecord = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
};

type FollowRecord = {
  id: string;
  follower_id: string;
  following_id: string;
};

type CommunityRecord = {
  id: string;
  creator_id: string;
  name: string;
  category: string | null;
  description: string | null;
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

type VideoRecord = {
  id: string;
  user_id: string;
  created_at: string;
};

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

function CommunitiesIcon({ className = "h-5 w-5" }: IconProps) {
  return <CommunityCircleIcon className={className} />;
}

function GroupsIcon({ className = "h-5 w-5" }: IconProps) {
  return <GroupPeopleIcon className={className} />;
}

function MessageIcon({ className = "h-5 w-5" }: IconProps) {
  return <MessageBubblesIcon className={className} />;
}

function FriendsIcon({ className = "h-5 w-5" }: IconProps) {
  return <FriendsFistIcon className={className} />;
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1 1 0 0 0 .2 1.1l.05.06a1.25 1.25 0 0 1-1.77 1.77l-.06-.05a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.91V19a1.25 1.25 0 0 1-2.5 0v-.09a1 1 0 0 0-.67-.95 1 1 0 0 0-1.04.23l-.06.05a1.25 1.25 0 1 1-1.77-1.77l.05-.06a1 1 0 0 0 .2-1.1 1 1 0 0 0-.91-.6H5a1.25 1.25 0 0 1 0-2.5h.09a1 1 0 0 0 .95-.67 1 1 0 0 0-.23-1.04l-.05-.06a1.25 1.25 0 1 1 1.77-1.77l.06.05a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.91V5a1.25 1.25 0 0 1 2.5 0v.09a1 1 0 0 0 .67.95 1 1 0 0 0 1.04-.23l.06-.05a1.25 1.25 0 0 1 1.77 1.77l-.05.06a1 1 0 0 0-.2 1.1 1 1 0 0 0 .91.6H19a1.25 1.25 0 0 1 0 2.5h-.09a1 1 0 0 0-.95.67 1 1 0 0 0 .23 1.04l.05.06A1 1 0 0 0 19.4 15Z" />
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

function PhotoIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <circle cx="9" cy="10" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 15-4.2-4.2a1 1 0 0 0-1.4 0L9 17" />
    </svg>
  );
}

function VideoPlusIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <rect x="3" y="6" width="12" height="12" rx="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 10 5-3v10l-5-3" />
      <path strokeLinecap="round" d="M9 9v6M6 12h6" />
    </svg>
  );
}

function SmileIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="round" d="M9 10h.01M15 10h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 14.5a4.5 4.5 0 0 0 7 0" />
    </svg>
  );
}

function HeartFilledIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 21s-7.2-4.74-9.5-8.38C.77 9.95 2.13 6 5.92 6c2.02 0 3.16 1.08 4.04 2.28C10.84 7.08 11.98 6 14 6c3.79 0 5.15 3.95 3.42 6.62C19.2 16.26 12 21 12 21Z" />
    </svg>
  );
}

function LikeIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10v10H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3Zm0 10h8.2a2 2 0 0 0 1.96-1.6l1.2-6A2 2 0 0 0 17.4 10H13l.6-3.1A2.5 2.5 0 0 0 11.14 4L8 10Z" />
    </svg>
  );
}

function CommentIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 18.5 3.5 20V6.75A2.75 2.75 0 0 1 6.25 4h11.5A2.75 2.75 0 0 1 20.5 6.75v7.5A2.75 2.75 0 0 1 17.75 17H9.5L7 18.5Z" />
    </svg>
  );
}

function SendIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 3 10 14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 3 14 21l-4-7-7-4L21 3Z" />
    </svg>
  );
}

function BellIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.5h-7.5A2.25 2.25 0 0 1 6 15.25v-3.4a6 6 0 0 1 12 0v3.4a2.25 2.25 0 0 1-2.25 2.25Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20a2.25 2.25 0 0 0 4 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 9.7V8.9A6.75 6.75 0 0 0 12 2.15" />
    </svg>
  );
}

function NavBadge({ count, max = 15 }: { count: number; max?: number }) {
  if (!count || count < 1) return null;

  return (
    <span className="absolute -right-1 -top-1 flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white ring-2 ring-white">
      {count > max ? `${max}+` : count}
    </span>
  );
}

const feedPageText = {
  en: {
    search: "Search FaceGrem",
    menu: "Menu",
    viewProfile: "View your profile",
    homeFeed: "Home Feed",
    videos: "Videos",
    communities: "Communities",
    groups: "Groups",
    messages: "Messages",
    saved: "Saved",
    settings: "Settings",
    logout: "Log out",
    friends: "Friends",
    yourCommunities: "Your communities",
    whatsMind: "What's on your mind",
    friend: "Friend",
    sharePlaceholder: "Share something with FaceGrem...",
    videoPlaceholder: "Paste video link...",
    posting: "Posting...",
    post: "Post",
    photo: "Photo",
    video: "Video",
    feeling: "Feeling",
    stories: "Stories",
    storySub: "Quick moments from your people",
    createStory: "Create story",
    storyCaption: "Story caption...",
    creatingStory: "Creating story...",
    shareStory: "Share story",
    noPosts: "No posts found.",
    noPostsSub: "Try a different search or create the first post.",
    like: "like",
    likes: "likes",
    comment: "comment",
    comments: "comments",
    save: "Save",
    send: "Send",
    writeComment: "Write a comment...",
    friendRequests: "Friend requests",
    seeAll: "See all",
    noSuggestions: "No new suggestions right now.",
    confirm: "Confirm",
    delete: "Delete",
    contacts: "Contacts",
    online: "Online",
    suggestedCommunities: "Suggested communities",
    communityFallback: "Community on FaceGrem",
  },
  sw: {
    search: "Tafuta FaceGrem",
    menu: "Menyu",
    viewProfile: "Tazama wasifu wako",
    homeFeed: "Feed ya nyumbani",
    videos: "Video",
    communities: "Jumuiya",
    groups: "Makundi",
    messages: "Ujumbe",
    saved: "Zilizohifadhiwa",
    settings: "Mipangilio",
    logout: "Toka",
    friends: "Marafiki",
    yourCommunities: "Jumuiya zako",
    whatsMind: "Unafikiria nini",
    friend: "Rafiki",
    sharePlaceholder: "Shiriki kitu kwenye FaceGrem...",
    videoPlaceholder: "Bandika kiungo cha video...",
    posting: "Inachapisha...",
    post: "Chapisha",
    photo: "Picha",
    video: "Video",
    feeling: "Hisia",
    stories: "Hadithi",
    storySub: "Matukio ya haraka kutoka kwa watu wako",
    createStory: "Tengeneza hadithi",
    storyCaption: "Maelezo ya hadithi...",
    creatingStory: "Inatengeneza hadithi...",
    shareStory: "Shiriki hadithi",
    noPosts: "Hakuna machapisho yaliyopatikana.",
    noPostsSub: "Jaribu utafutaji mwingine au tengeneza chapisho la kwanza.",
    like: "like",
    likes: "likes",
    comment: "comment",
    comments: "comments",
    save: "Hifadhi",
    send: "Tuma",
    writeComment: "Andika comment...",
    friendRequests: "Maombi ya urafiki",
    seeAll: "Ona yote",
    noSuggestions: "Hakuna mapendekezo mapya kwa sasa.",
    confirm: "Thibitisha",
    delete: "Futa",
    contacts: "Wasiliani",
    online: "Mtandaoni",
    suggestedCommunities: "Jumuiya zinazopendekezwa",
    communityFallback: "Jumuiya kwenye FaceGrem",
  },
  fr: {
    search: "Rechercher sur FaceGrem",
    menu: "Menu",
    viewProfile: "Voir votre profil",
    homeFeed: "Fil d’accueil",
    videos: "Vidéos",
    communities: "Communautés",
    groups: "Groupes",
    messages: "Messages",
    saved: "Enregistrés",
    settings: "Paramètres",
    logout: "Se déconnecter",
    friends: "Amis",
    yourCommunities: "Vos communautés",
    whatsMind: "Quoi de neuf",
    friend: "Ami",
    sharePlaceholder: "Partagez quelque chose sur FaceGrem...",
    videoPlaceholder: "Collez un lien vidéo...",
    posting: "Publication...",
    post: "Publier",
    photo: "Photo",
    video: "Vidéo",
    feeling: "Humeur",
    stories: "Stories",
    storySub: "Moments rapides de vos proches",
    createStory: "Créer une story",
    storyCaption: "Légende de la story...",
    creatingStory: "Création de la story...",
    shareStory: "Partager la story",
    noPosts: "Aucune publication trouvée.",
    noPostsSub: "Essayez une autre recherche ou créez la première publication.",
    like: "j’aime",
    likes: "j’aime",
    comment: "commentaire",
    comments: "commentaires",
    save: "Enregistrer",
    send: "Envoyer",
    writeComment: "Écrire un commentaire...",
    friendRequests: "Demandes d’amis",
    seeAll: "Voir tout",
    noSuggestions: "Aucune nouvelle suggestion pour le moment.",
    confirm: "Confirmer",
    delete: "Supprimer",
    contacts: "Contacts",
    online: "En ligne",
    suggestedCommunities: "Communautés suggérées",
    communityFallback: "Communauté sur FaceGrem",
  },
  rw: {
    search: "Shaka kuri FaceGrem",
    menu: "Menyu",
    viewProfile: "Reba umwirondoro wawe",
    homeFeed: "Feed y’ahabanza",
    videos: "Video",
    communities: "Imiryango",
    groups: "Amatsinda",
    messages: "Ubutumwa",
    saved: "Ibyabitswe",
    settings: "Igenamiterere",
    logout: "Sohoka",
    friends: "Inshuti",
    yourCommunities: "Imiryango yawe",
    whatsMind: "Urimo gutekereza iki",
    friend: "Nshuti",
    sharePlaceholder: "Sangiza ikintu kuri FaceGrem...",
    videoPlaceholder: "Shyiramo link ya video...",
    posting: "Birimo gutangazwa...",
    post: "Tangaza",
    photo: "Ifoto",
    video: "Video",
    feeling: "Uko wiyumva",
    stories: "Inkuru",
    storySub: "Ibihe byihuse by’abantu bawe",
    createStory: "Kora inkuru",
    storyCaption: "Amagambo y’inkuru...",
    creatingStory: "Birimo gukora inkuru...",
    shareStory: "Sangiza inkuru",
    noPosts: "Nta nyandiko zabonetse.",
    noPostsSub: "Gerageza gushaka ukundi cyangwa ukore inyandiko ya mbere.",
    like: "like",
    likes: "likes",
    comment: "comment",
    comments: "comments",
    save: "Bika",
    send: "Ohereza",
    writeComment: "Andika comment...",
    friendRequests: "Ubusabe bw’ubucuti",
    seeAll: "Reba byose",
    noSuggestions: "Nta byifuzo bishya bihari ubu.",
    confirm: "Emeza",
    delete: "Siba",
    contacts: "Abantu",
    online: "Ari online",
    suggestedCommunities: "Imiryango usabwa",
    communityFallback: "Umuryango kuri FaceGrem",
  },
} as const;

export default function FeedPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const ft = feedPageText[language] || feedPageText.en;

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");
  const [userAvatar, setUserAvatar] = useState("");

  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [likes, setLikes] = useState<LikeRecord[]>([]);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPostRecord[]>([]);
  const [stories, setStories] = useState<StoryRecord[]>([]);
  const [follows, setFollows] = useState<FollowRecord[]>([]);
  const [communities, setCommunities] = useState<CommunityRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [videos, setVideos] = useState<VideoRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [commentingPostId, setCommentingPostId] = useState("");
  const [savingStory, setSavingStory] = useState(false);
  const [followingUserId, setFollowingUserId] = useState("");

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [postText, setPostText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyPreview, setStoryPreview] = useState("");
  const [storyCaption, setStoryCaption] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [searchText, setSearchText] = useState("");

  const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || "FaceGrem User"
    )}&background=0f172a&color=ffffff&bold=true`;

  const getProfileById = (profileId?: string) =>
    profiles.find((profile) => profile.id === profileId);

  const getBestNameForUser = (profileId?: string, fallbackName?: string | null) => {
    const profile = getProfileById(profileId);
    return profile?.full_name || fallbackName || "FaceGrem User";
  };

  const getBestAvatarForUser = (
    profileId?: string,
    fallbackName?: string | null,
    fallbackAvatarUrl?: string | null
  ) => {
    const profile = getProfileById(profileId);
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

      const currentUserId = session.user.id;
      const currentUserName =
        session.user.user_metadata?.full_name || "FaceGrem User";
      const nowIso = new Date().toISOString();

      setUserId(currentUserId);
      setUserName(currentUserName);

      const [
        { data: profilesData },
        { data: postsData },
        { data: likesData },
        { data: commentsData },
        { data: savedPostsData },
        { data: storiesData },
        { data: followsData },
        { data: communitiesData },
        { data: notificationsData },
        { data: videosData },
      ] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, bio, avatar_url"),
        supabase
          .from("posts")
          .select(
            "id, user_id, content, created_at, full_name, avatar_url, image_url, video_url, community_id"
          )
          .order("created_at", { ascending: false })
          .limit(80),
        supabase.from("likes").select("id, post_id, user_id"),
        supabase
          .from("comments")
          .select("id, post_id, user_id, full_name, content, created_at")
          .order("created_at", { ascending: true }),
        supabase.from("saved_posts").select("id, user_id, post_id"),
        supabase
          .from("stories")
          .select("id, user_id, image_url, caption, created_at, expires_at")
          .gt("expires_at", nowIso)
          .order("created_at", { ascending: false })
          .limit(24),
        supabase.from("follows").select("id, follower_id, following_id"),
        supabase
          .from("communities")
          .select("id, creator_id, name, category, description, created_at")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("notifications")
          .select("id, user_id, actor_id, type, post_id, actor_name, content, is_read, created_at")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false })
          .limit(80),
        supabase
          .from("videos")
          .select("id, user_id, created_at")
          .order("created_at", { ascending: false })
          .limit(80),
      ]);

      const allProfiles = profilesData || [];
      const currentProfile = allProfiles.find((profile) => profile.id === currentUserId);

      setProfiles(allProfiles);
      setPosts(postsData || []);
      setLikes(likesData || []);
      setComments(commentsData || []);
      setSavedPosts(savedPostsData || []);
      setStories(storiesData || []);
      setFollows(followsData || []);
      setCommunities(communitiesData || []);
      setNotifications(notificationsData || []);
      setVideos(videosData || []);
      setUserAvatar(
        currentProfile?.avatar_url || getAvatarUrl(currentProfile?.full_name || currentUserName)
      );
      setLoading(false);
    };

    void loadFeed();
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    const sortNewest = (items: PostRecord[]) =>
      [...items].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    const postsChannel = supabase
      .channel("facegrem-feed-posts-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          const newPost = payload.new as PostRecord;
          setPosts((prev) => {
            if (prev.some((post) => post.id === newPost.id)) return prev;
            return sortNewest([newPost, ...prev]);
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        (payload) => {
          const updatedPost = payload.new as PostRecord;
          setPosts((prev) =>
            sortNewest(
              prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        (payload) => {
          const deletedPost = payload.old as Partial<PostRecord>;
          setPosts((prev) => prev.filter((post) => post.id !== deletedPost.id));
        }
      )
      .subscribe();

    const likesChannel = supabase
      .channel("facegrem-feed-likes-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "likes" },
        (payload) => {
          const newLike = payload.new as LikeRecord;
          setLikes((prev) => {
            if (prev.some((like) => like.id === newLike.id)) return prev;
            return [...prev, newLike];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "likes" },
        (payload) => {
          const deletedLike = payload.old as Partial<LikeRecord>;
          setLikes((prev) => prev.filter((like) => like.id !== deletedLike.id));
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel("facegrem-feed-comments-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        (payload) => {
          const newComment = payload.new as CommentRecord;
          setComments((prev) => {
            if (prev.some((comment) => comment.id === newComment.id)) return prev;
            return [...prev, newComment].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );
          });
        }
      )
      .subscribe();

    const savedChannel = supabase
      .channel("facegrem-feed-saved-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "saved_posts" },
        (payload) => {
          const newSaved = payload.new as SavedPostRecord;
          setSavedPosts((prev) => {
            if (prev.some((saved) => saved.id === newSaved.id)) return prev;
            return [...prev, newSaved];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "saved_posts" },
        (payload) => {
          const deletedSaved = payload.old as Partial<SavedPostRecord>;
          setSavedPosts((prev) => prev.filter((saved) => saved.id !== deletedSaved.id));
        }
      )
      .subscribe();

    const notificationsChannel = supabase
      .channel(`facegrem-feed-notifications-live-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as NotificationRecord;
          setNotifications((prev) => {
            if (prev.some((notification) => notification.id === newNotification.id)) {
              return prev;
            }

            return [newNotification, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedNotification = payload.new as NotificationRecord;
          setNotifications((prev) =>
            prev.map((notification) =>
              notification.id === updatedNotification.id
                ? updatedNotification
                : notification
            )
          );
        }
      )
      .subscribe();

    const videosChannel = supabase
      .channel("facegrem-feed-videos-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "videos" },
        (payload) => {
          const newVideo = payload.new as VideoRecord;
          setVideos((prev) => {
            if (prev.some((video) => video.id === newVideo.id)) return prev;
            return [newVideo, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(postsChannel);
      void supabase.removeChannel(likesChannel);
      void supabase.removeChannel(commentsChannel);
      void supabase.removeChannel(savedChannel);
      void supabase.removeChannel(notificationsChannel);
      void supabase.removeChannel(videosChannel);
    };
  }, [userId]);

  const filteredPosts = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return posts;

    return posts.filter((post) => {
      const author = getBestNameForUser(post.user_id, post.full_name);
      const text = `${post.content} ${author}`.toLowerCase();
      return text.includes(term);
    });
  }, [posts, searchText, profiles]);

  const suggestedProfiles = useMemo(() => {
    const followedIds = new Set(
      follows
        .filter((follow) => follow.follower_id === userId)
        .map((follow) => follow.following_id)
    );

    return profiles
      .filter((profile) => profile.id !== userId && !followedIds.has(profile.id))
      .slice(0, 4);
  }, [profiles, follows, userId]);

  const onlineProfiles = useMemo(() => {
    return profiles.filter((profile) => profile.id !== userId).slice(0, 8);
  }, [profiles, userId]);

  const myStories = useMemo(() => {
    return stories.filter((story) => story.user_id === userId);
  }, [stories, userId]);

  const getPostLikesCount = (postId: string) =>
    likes.filter((like) => like.post_id === postId).length;

  const getPostComments = (postId: string) =>
    comments.filter((comment) => comment.post_id === postId);

  const getPostCommentsCount = (postId: string) => getPostComments(postId).length;

  const getSavedRecord = (postId: string) =>
    savedPosts.find((saved) => saved.post_id === postId && saved.user_id === userId);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "now";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/");
  };

  const handlePostImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);

    if (!file) {
      setImagePreview("");
      return;
    }

    setImagePreview(URL.createObjectURL(file));
  };

  const handleStoryImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setStoryFile(file);

    if (!file) {
      setStoryPreview("");
      return;
    }

    setStoryPreview(URL.createObjectURL(file));
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

  const uploadStoryImage = async () => {
    if (!storyFile || !userId) return null;

    const fileExt = storyFile.name.split(".").pop() || "jpg";
    const filePath = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt.toLowerCase()}`;

    const { error: uploadError } = await supabase.storage
      .from("stories")
      .upload(filePath, storyFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("stories").getPublicUrl(filePath);
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
      let uploadedImageUrl: string | null = null;

      if (imageFile) {
        uploadedImageUrl = await uploadPostImage();
      }

      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            user_id: userId,
            content: trimmedContent,
            full_name: userName,
            avatar_url: userAvatar,
            image_url: uploadedImageUrl,
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
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not create post.");
    }

    setPosting(false);
  };

  const handleCreateStory = async () => {
    if (!userId || !storyFile) {
      alert("Choose a story image first.");
      return;
    }

    setSavingStory(true);

    try {
      const uploadedStoryUrl = await uploadStoryImage();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("stories")
        .insert([
          {
            user_id: userId,
            image_url: uploadedStoryUrl,
            caption: storyCaption.trim() || null,
            expires_at: expiresAt,
          },
        ])
        .select("id, user_id, image_url, caption, created_at, expires_at");

      if (error) {
        alert(error.message);
        setSavingStory(false);
        return;
      }

      if (data && data.length > 0) {
        setStories((prev) => [data[0], ...prev]);
      }

      setStoryFile(null);
      setStoryPreview("");
      setStoryCaption("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not create story.");
    }

    setSavingStory(false);
  };

  const handleToggleLike = async (postId: string) => {
    if (!userId) return;

    const existingLike = likes.find(
      (like) => like.post_id === postId && like.user_id === userId
    );

    if (existingLike) {
      const { error } = await supabase.from("likes").delete().eq("id", existingLike.id);

      if (error) {
        alert(error.message);
        return;
      }

      setLikes((prev) => prev.filter((like) => like.id !== existingLike.id));
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

  const handleToggleSave = async (postId: string) => {
    if (!userId) return;

    const existingSaved = getSavedRecord(postId);

    if (existingSaved) {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("id", existingSaved.id);

      if (error) {
        alert(error.message);
        return;
      }

      setSavedPosts((prev) => prev.filter((saved) => saved.id !== existingSaved.id));
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

  const handleAddComment = async (event: FormEvent, postId: string) => {
    event.preventDefault();

    const content = (commentDrafts[postId] || "").trim();

    if (!content) return;

    setCommentingPostId(postId);

    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          post_id: postId,
          user_id: userId,
          full_name: userName,
          content,
        },
      ])
      .select("id, post_id, user_id, full_name, content, created_at");

    setCommentingPostId("");

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setComments((prev) => [...prev, data[0]]);
    }

    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
  };

  const handleToggleFollow = async (profileId: string) => {
    if (!userId || userId === profileId) return;

    setFollowingUserId(profileId);

    const existingFollow = follows.find(
      (follow) => follow.follower_id === userId && follow.following_id === profileId
    );

    if (existingFollow) {
      const { error } = await supabase.from("follows").delete().eq("id", existingFollow.id);

      if (!error) {
        setFollows((prev) => prev.filter((follow) => follow.id !== existingFollow.id));
      }

      setFollowingUserId("");
      return;
    }

    const { data, error } = await supabase
      .from("follows")
      .insert([{ follower_id: userId, following_id: profileId }])
      .select("id, follower_id, following_id");

    if (!error && data && data.length > 0) {
      setFollows((prev) => [...prev, data[0]]);
    }

    setFollowingUserId("");
  };

  const recentActivityCutoff = useMemo(() => Date.now() - 24 * 60 * 60 * 1000, []);

  const homeBadgeCount = useMemo(() => {
    return posts.filter(
      (post) =>
        post.user_id !== userId &&
        new Date(post.created_at).getTime() >= recentActivityCutoff
    ).length;
  }, [posts, userId, recentActivityCutoff]);

  const videoBadgeCount = useMemo(() => {
    return videos.filter(
      (video) =>
        video.user_id !== userId &&
        new Date(video.created_at).getTime() >= recentActivityCutoff
    ).length;
  }, [videos, userId, recentActivityCutoff]);

  const messageBadgeCount = useMemo(() => {
    return notifications.filter(
      (notification) => !notification.is_read && notification.type === "message"
    ).length;
  }, [notifications]);

  const notificationBadgeCount = useMemo(() => {
    return notifications.filter((notification) => !notification.is_read).length;
  }, [notifications]);

  const friendBadgeCount = suggestedProfiles.length;
  const communityBadgeCount = suggestedProfiles.length > 0 ? Math.min(communities.length, 15) : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817] text-white">
        {t.loadingFeed}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-[#050505]">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <FaceGremLogo
              href="/feed"
              showWordmark={false}
              markClassName="h-10 w-10 rounded-full ring-0 shadow-none"
            />
            <Link href="/feed" className="hidden text-2xl font-extrabold tracking-tight text-blue-600 sm:block md:hidden">
              FaceGrem
            </Link>
          </div>

          <div className="hidden w-[280px] items-center gap-2 rounded-full bg-slate-100 px-4 py-2 md:flex">
            <SearchIcon className="h-4 w-4 text-slate-500" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder={ft.search}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
            />
          </div>

          <nav className="mx-auto hidden h-full items-center gap-2 lg:flex">
            <Link href="/feed" className="relative flex h-12 w-24 items-center justify-center border-b-4 border-blue-600 text-blue-600">
              <HomeIcon className="h-6 w-6" />
              <NavBadge count={homeBadgeCount} />
            </Link>
            <Link href="/friends" className="relative flex h-12 w-24 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              <FriendsIcon className="h-6 w-6" />
              <NavBadge count={friendBadgeCount} />
            </Link>
            <Link href="/messages" className="relative flex h-12 w-24 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              <MessageIcon className="h-6 w-6" />
              <NavBadge count={messageBadgeCount} />
            </Link>
            <Link href="/videos" className="relative flex h-12 w-24 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              <VideoIcon className="h-6 w-6" />
              <NavBadge count={videoBadgeCount} />
            </Link>
            <Link href="/communities" className="relative flex h-12 w-24 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              <CommunitiesIcon className="h-6 w-6" />
              <NavBadge count={communityBadgeCount} />
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-sm transition hover:bg-slate-200 hover:text-slate-900"
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            <LanguageMenu compact />

            <NotificationDropdown
              iconClassName="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-base transition hover:bg-slate-200"
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

        <div className="grid grid-cols-6 border-t border-slate-100 bg-white px-2 py-1 md:hidden">
          <Link href="/feed" className="relative flex h-11 items-center justify-center text-blue-600">
            <HomeIcon className="h-6 w-6" />
            <NavBadge count={homeBadgeCount} />
          </Link>
          <Link href="/friends" className="relative flex h-11 items-center justify-center text-slate-600">
            <FriendsIcon className="h-6 w-6" />
            <NavBadge count={friendBadgeCount} />
          </Link>
          <Link href="/messages" className="relative flex h-11 items-center justify-center text-slate-600">
            <MessageIcon className="h-6 w-6" />
            <NavBadge count={messageBadgeCount} />
          </Link>
          <Link href="/videos" className="relative flex h-11 items-center justify-center text-slate-600">
            <VideoIcon className="h-6 w-6" />
            <NavBadge count={videoBadgeCount} />
          </Link>
          <Link href="/notifications" className="relative flex h-11 items-center justify-center text-slate-600">
            <BellIcon className="h-6 w-6" />
            <NavBadge count={notificationBadgeCount} max={20} />
          </Link>
          <Link href="/communities" className="relative flex h-11 items-center justify-center text-slate-600">
            <CommunitiesIcon className="h-6 w-6" />
            <NavBadge count={communityBadgeCount} />
          </Link>
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

            <div className="mt-4 space-y-5">
              <section>
                <p className="px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Main
                </p>
                <div className="mt-2 grid gap-1">
                  <Link href="/feed" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <HomeIcon className="h-5 w-5 text-slate-500" /> {ft.homeFeed}
                  </Link>
                  <Link href="/friends" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <FriendsIcon className="h-5 w-5 text-slate-500" /> {ft.friends}
                  </Link>
                  <Link href="/messages" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <MessageIcon className="h-5 w-5 text-slate-500" /> {ft.messages}
                  </Link>
                  <Link href="/videos" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <VideoIcon className="h-5 w-5 text-slate-500" /> {ft.videos}
                  </Link>
                  <Link href="/notifications" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <span className="inline-flex items-center gap-3">
                      <BellIcon className="h-5 w-5 text-slate-500" /> Notifications
                    </span>
                    <NavBadge count={notificationBadgeCount} max={20} />
                  </Link>
                  <Link href="/communities" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <CommunitiesIcon className="h-5 w-5 text-slate-500" /> {ft.communities}
                  </Link>
                  <Link href="/groups" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <GroupsIcon className="h-5 w-5 text-slate-500" /> {ft.groups}
                  </Link>
                  <Link href="/saved" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <BookmarkIcon className="h-5 w-5 text-slate-500" /> {ft.saved}
                  </Link>
                  <Link href="/settings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <SettingsIcon className="h-5 w-5 text-slate-500" /> {ft.settings}
                  </Link>
                </div>
              </section>

              <section>
                <p className="px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Privacy & legal
                </p>
                <div className="mt-2 grid gap-1">
                  <Link href="/privacy" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <span className="flex h-5 w-5 items-center justify-center text-slate-500">🔒</span> Privacy
                  </Link>
                  <Link href="/privacy-centre" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <span className="flex h-5 w-5 items-center justify-center text-slate-500">🛡️</span> Privacy Centre
                  </Link>
                  <Link href="/terms" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <span className="flex h-5 w-5 items-center justify-center text-slate-500">📄</span> Terms
                  </Link>
                  <Link href="/cookies" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <span className="flex h-5 w-5 items-center justify-center text-slate-500">🍪</span> Cookies
                  </Link>
                  <Link href="/ad-choices" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <span className="flex h-5 w-5 items-center justify-center text-slate-500">🎯</span> AdChoices
                  </Link>
                </div>
              </section>

              <section>
                <p className="px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Create & explore
                </p>
                <div className="mt-2 grid gap-1">
                  <Link href="/create-page" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <span className="flex h-5 w-5 items-center justify-center text-slate-500">➕</span> Create Page
                  </Link>
                  <Link href="/create-ad" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <span className="flex h-5 w-5 items-center justify-center text-slate-500">📣</span> Create Ad
                  </Link>
                  <Link href="/threads" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <MessageIcon className="h-5 w-5 text-slate-500" /> Threads
                  </Link>
                </div>
              </section>

              <section>
                <p className="px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Support & company
                </p>
                <div className="mt-2 grid gap-1">
                  <Link href="/help" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <span className="flex h-5 w-5 items-center justify-center text-slate-500">❓</span> Help
                  </Link>
                  <Link href="/about" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <span className="flex h-5 w-5 items-center justify-center text-slate-500">ℹ️</span> About FaceGrem
                  </Link>
                  <Link href="/careers" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <span className="flex h-5 w-5 items-center justify-center text-slate-500">💼</span> Careers
                  </Link>
                  <Link href="/developers" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 hover:bg-slate-100">
                    <span className="flex h-5 w-5 items-center justify-center text-slate-500">⌘</span> Developers
                  </Link>
                </div>
              </section>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-xl p-3 text-left font-medium text-red-600 hover:bg-red-50"
              >
                <span className="inline-flex items-center gap-3"><LogoutIcon className="h-5 w-5" /> {ft.logout}</span>
              </button>
            </div>
          </aside>
        </>
      )}

      <main className="mx-auto grid max-w-[1460px] gap-5 px-3 py-4 lg:grid-cols-[280px_minmax(0,680px)_320px]">
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
            <Link href="/friends" className="flex items-center gap-3 rounded-xl p-3 text-slate-700 transition hover:bg-white hover:text-slate-900"><FriendsIcon className="h-5 w-5 text-slate-500" /> {ft.friends}</Link>
            <Link href="/saved" className="flex items-center gap-3 rounded-xl p-3 text-slate-700 transition hover:bg-white hover:text-slate-900"><BookmarkIcon className="h-5 w-5 text-slate-500" /> {ft.saved}</Link>
            <Link href="/groups" className="flex items-center gap-3 rounded-xl p-3 text-slate-700 transition hover:bg-white hover:text-slate-900"><GroupsIcon className="h-5 w-5 text-slate-500" /> {ft.groups}</Link>
            <Link href="/communities" className="flex items-center gap-3 rounded-xl p-3 text-slate-700 transition hover:bg-white hover:text-slate-900"><CommunitiesIcon className="h-5 w-5 text-slate-500" /> {ft.communities}</Link>
            <Link href="/videos" className="flex items-center gap-3 rounded-xl p-3 text-slate-700 transition hover:bg-white hover:text-slate-900"><VideoIcon className="h-5 w-5 text-slate-500" /> {ft.videos}</Link>
            <Link href="/settings" className="flex items-center gap-3 rounded-xl p-3 text-slate-700 transition hover:bg-white hover:text-slate-900"><SettingsIcon className="h-5 w-5 text-slate-500" /> {ft.settings}</Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-red-600 hover:bg-red-50"
            >
              <LogoutIcon className="h-5 w-5" /> {ft.logout}
            </button>

            <div className="mt-4 border-t border-slate-300 pt-4">
              <p className="px-3 text-sm font-semibold text-slate-600">{ft.yourCommunities}</p>
              <div className="mt-2 space-y-1">
                {communities.slice(0, 4).map((community) => (
                  <Link
                    key={community.id}
                    href={`/communities/${community.id}`}
                    className="block truncate rounded-xl px-3 py-2 text-sm hover:bg-white"
                  >
                    # {community.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex gap-3">
              <Link href="/profile" className="shrink-0">
                <img
                  src={userAvatar || getAvatarUrl(userName)}
                  alt={userName}
                  className="h-11 w-11 rounded-full object-cover"
                />
              </Link>
              <button
                type="button"
                onClick={() => document.getElementById("feed-composer-textarea")?.focus()}
                className="flex-1 rounded-full bg-slate-100 px-4 text-left text-slate-500 hover:bg-slate-200"
              >
                {ft.whatsMind}, {userName.split(" ")[0] || ft.friend}?
              </button>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <textarea
                id="feed-composer-textarea"
                value={postText}
                onChange={(event) => setPostText(event.target.value)}
                placeholder={ft.sharePlaceholder}
                rows={3}
                className="w-full resize-none rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />

              {imagePreview && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                  <img src={imagePreview} alt="Preview" className="max-h-[420px] w-full object-cover" />
                </div>
              )}

              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                  placeholder={ft.videoPlaceholder}
                  className="rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />

                <button
                  type="button"
                  onClick={handleCreatePost}
                  disabled={posting}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {posting ? ft.posting : ft.post}
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                <PhotoIcon className="h-5 w-5 text-emerald-500" /> {ft.photo}
                <input type="file" accept="image/*" onChange={handlePostImageChange} className="hidden" />
              </label>
              <button
                type="button"
                onClick={() => setVideoUrl((prev) => prev || "https://")}
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <span className="inline-flex items-center gap-2"><VideoPlusIcon className="h-5 w-5 text-rose-500" /> {ft.video}</span>
              </button>
              <button
                type="button"
                onClick={handleCreatePost}
                disabled={posting}
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-2"><SmileIcon className="h-5 w-5 text-amber-500" /> {ft.feeling}</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">{ft.stories}</p>
                <p className="text-sm text-slate-500">{ft.storySub}</p>
              </div>
              <label className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold hover:bg-slate-200">
                {ft.createStory}
                <input type="file" accept="image/*" onChange={handleStoryImageChange} className="hidden" />
              </label>
            </div>

            {storyPreview && (
              <div className="mb-3 rounded-2xl border border-blue-100 bg-blue-50 p-3">
                <img src={storyPreview} alt="Story preview" className="h-40 w-full rounded-xl object-cover" />
                <input
                  value={storyCaption}
                  onChange={(event) => setStoryCaption(event.target.value)}
                  placeholder={ft.storyCaption}
                  className="mt-3 w-full rounded-xl bg-white px-3 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateStory}
                  disabled={savingStory}
                  className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {savingStory ? ft.creatingStory : ft.shareStory}
                </button>
              </div>
            )}

            <div className="flex gap-3 overflow-x-auto pb-1">
              <div className="relative h-48 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-900 text-white">
                <img src={userAvatar || getAvatarUrl(userName)} alt={userName} className="h-32 w-full object-cover opacity-80" />
                <div className="absolute left-1/2 top-[112px] flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-xl">+</div>
                <p className="absolute bottom-3 left-2 right-2 text-center text-sm font-semibold">{ft.createStory}</p>
              </div>

              {stories.map((story) => (
                <Link
                  key={story.id}
                  href={`/profile?id=${story.user_id}`}
                  className="relative h-48 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-900 text-white"
                >
                  <img src={story.image_url} alt={story.caption || "Story"} className="h-full w-full object-cover opacity-90" />
                  <img
                    src={getBestAvatarForUser(story.user_id)}
                    alt={getBestNameForUser(story.user_id)}
                    className="absolute left-2 top-2 h-9 w-9 rounded-full border-4 border-blue-600 object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-10">
                    <p className="line-clamp-2 text-xs font-semibold">
                      {story.caption || getBestNameForUser(story.user_id)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-semibold">{ft.noPosts}</p>
              <p className="mt-2 text-sm text-slate-500">{ft.noPostsSub}</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const authorName = getBestNameForUser(post.user_id, post.full_name);
              const authorAvatar = getBestAvatarForUser(
                post.user_id,
                post.full_name,
                post.avatar_url
              );
              const postLikesCount = getPostLikesCount(post.id);
              const postComments = getPostComments(post.id);
              const isLiked = likes.some(
                (like) => like.post_id === post.id && like.user_id === userId
              );
              const isSaved = !!getSavedRecord(post.id);

              return (
                <article key={post.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/profile?id=${post.user_id}`} className="flex min-w-0 items-center gap-3">
                        <img src={authorAvatar} alt={authorName} className="h-11 w-11 rounded-full object-cover" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{authorName}</p>
                          <p className="text-xs text-slate-500">{formatTime(post.created_at)} · 🌍</p>
                        </div>
                      </Link>

                      <Link href={`/post/${post.id}`} className="rounded-full px-3 py-1 text-xl text-slate-500 hover:bg-slate-100">…</Link>
                    </div>

                    {post.content && (
                      <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-slate-800">{post.content}</p>
                    )}
                  </div>

                  {post.image_url && (
                    <img src={post.image_url} alt="Post" className="max-h-[720px] w-full object-cover" />
                  )}

                  {post.video_url && (
                    <div className="bg-black">
                      {isYouTubeUrl(post.video_url) ? (
                        <iframe
                          src={getYouTubeEmbedUrl(post.video_url)}
                          title={`post-video-${post.id}`}
                          className="h-80 w-full md:h-[460px]"
                          allowFullScreen
                        />
                      ) : (
                        <video controls src={post.video_url} className="h-80 w-full bg-black md:h-[460px]" />
                      )}
                    </div>
                  )}

                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-2"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"><HeartFilledIcon className="h-3.5 w-3.5" /></span>{postLikesCount} {postLikesCount === 1 ? ft.like : ft.likes}</span>
                      <Link href={`/post/${post.id}`} className="hover:underline">
                        {postComments.length} {postComments.length === 1 ? ft.comment : ft.comments}
                      </Link>
                    </div>

                    <div className="grid grid-cols-4 gap-1 border-b border-slate-100 py-1">
                      <button
                        type="button"
                        onClick={() => handleToggleLike(post.id)}
                        className={`rounded-lg px-2 py-2 text-sm font-semibold hover:bg-slate-50 ${
                          isLiked ? "text-blue-600" : "text-slate-600"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2"><LikeIcon className="h-4.5 w-4.5" /> {ft.like}</span>
                      </button>
                      <Link href={`/post/${post.id}`} className="rounded-lg px-2 py-2 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        <span className="inline-flex items-center justify-center gap-2"><CommentIcon className="h-4.5 w-4.5" /> {ft.comment}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggleSave(post.id)}
                        className={`rounded-lg px-2 py-2 text-sm font-semibold hover:bg-slate-50 ${
                          isSaved ? "text-blue-600" : "text-slate-600"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2"><BookmarkIcon className="h-4.5 w-4.5" /> {ft.save}</span>
                      </button>
                      <Link href={`/messages?user=${post.user_id}`} className="rounded-lg px-2 py-2 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        <span className="inline-flex items-center justify-center gap-2"><SendIcon className="h-4.5 w-4.5" /> {ft.send}</span>
                      </Link>
                    </div>

                    <div className="mt-3 space-y-3">
                      {postComments.slice(-2).map((comment) => {
                        const commentAuthorName = getBestNameForUser(
                          comment.user_id,
                          comment.full_name
                        );

                        return (
                          <div key={comment.id} className="flex gap-2">
                            <img
                              src={getBestAvatarForUser(comment.user_id, comment.full_name)}
                              alt={commentAuthorName}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            <div className="rounded-2xl bg-slate-100 px-3 py-2">
                              <p className="text-xs font-semibold">{commentAuthorName}</p>
                              <p className="text-sm text-slate-700">{comment.content}</p>
                            </div>
                          </div>
                        );
                      })}

                      <form onSubmit={(event) => handleAddComment(event, post.id)} className="flex gap-2">
                        <img
                          src={userAvatar || getAvatarUrl(userName)}
                          alt={userName}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <input
                          value={commentDrafts[post.id] || ""}
                          onChange={(event) =>
                            setCommentDrafts((prev) => ({
                              ...prev,
                              [post.id]: event.target.value,
                            }))
                          }
                          placeholder={ft.writeComment}
                          className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <button
                          type="submit"
                          disabled={commentingPostId === post.id}
                          className="rounded-full bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {commentingPostId === post.id ? "..." : ft.post}
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-[72px] space-y-4">
            <section className="rounded-xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-slate-600">{ft.friendRequests}</p>
                <Link href="/friends" className="text-sm text-blue-600">{ft.seeAll}</Link>
              </div>

              {suggestedProfiles.length === 0 ? (
                <p className="text-sm text-slate-500">{ft.noSuggestions}</p>
              ) : (
                <div className="space-y-3">
                  {suggestedProfiles.slice(0, 2).map((profile) => (
                    <div key={profile.id} className="flex gap-3">
                      <img
                        src={profile.avatar_url || getAvatarUrl(profile.full_name)}
                        alt={profile.full_name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{profile.full_name}</p>
                        <p className="text-xs text-slate-500">@{profile.username || "facegrem"}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleFollow(profile.id)}
                            disabled={followingUserId === profile.id}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {ft.confirm}
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                          >
                            {ft.delete}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-slate-600">{ft.contacts}</p>
                <span className="text-sm text-slate-400">{ft.online}</span>
              </div>

              <div className="space-y-1">
                {onlineProfiles.map((profile) => (
                  <Link
                    key={profile.id}
                    href={`/messages?user=${profile.id}`}
                    className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50"
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

            <section className="rounded-xl bg-white p-4 shadow-sm">
              <p className="mb-3 font-semibold text-slate-600">{ft.suggestedCommunities}</p>
              <div className="space-y-2">
                {communities.slice(0, 4).map((community) => (
                  <Link
                    key={community.id}
                    href={`/communities/${community.id}`}
                    className="block rounded-xl bg-slate-50 p-3 hover:bg-slate-100"
                  >
                    <p className="truncate text-sm font-semibold">{community.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {community.description || community.category || ft.communityFallback}
                    </p>
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
