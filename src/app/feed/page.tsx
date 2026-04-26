"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
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

type TranslationLanguage = "en" | "sw" | "fr" | "rw";

const languageLabels: Record<TranslationLanguage, string> = {
  en: "English",
  sw: "Swahili",
  fr: "French",
  rw: "Kinyarwanda",
};

const quickActions = ["Photo", "Video", "Live", "Story"] as const;
const feedTabs = ["For You", "Following", "Creators", "Videos", "Faith", "Business"] as const;

const glassCard =
  "border border-white/[0.06] bg-white/[0.028] backdrop-blur-[28px] shadow-[0_18px_50px_rgba(2,8,23,0.18)]";
const softCard =
  "border border-white/[0.05] bg-white/[0.02] backdrop-blur-[24px] shadow-[0_10px_30px_rgba(2,8,23,0.12)]";


const uiTranslations = {
  en: {
    loadingFeed: "Loading FaceGrem feed...",
    brandTagline: "Your social world, live now",
    navigation: "Navigation",
    homeFeed: "Home Feed",
    videos: "Videos",
    communities: "Communities",
    groups: "Groups",
    messages: "Messages",
    saved: "Saved",
    profile: "Profile",
    settings: "Settings",
    language: "Language",
    privacy: "Privacy",
    help: "Help",
    logout: "Log out",
    yourCommunities: "Your communities",
    viewAll: "View all",
    joinCommunitiesText: "Join communities to keep your favorite spaces close.",
    communityFallback: "Community",
    quickDetails: "Tap to view quick details",
    savedStat: "Saved",
    alertsStat: "Alerts",
    groupsStat: "Groups",
    openProfile: "Open Profile",
    savedPosts: "Saved Posts",
    welcomeBack: "Welcome back",
    goodToSeeYou: "Good to see you",
    discoverText: "Discover what people are sharing right now across FaceGrem — moments, ideas, videos, conversations, and communities.",
    stories: "Stories",
    storiesSubtitle: "Quick moments from people around you",
    createStory: "Create story",
    uploading: "Uploading...",
    shareQuickMoment: "Share a quick moment",
    yourStory: "Your story",
    createPost: "Create post",
    createPostSubtitle: "Share a thought, photo, story, or video with FaceGrem",
    publicPost: "Public post",
    liveComposer: "Live composer",
    postingToEveryone: "Posting to everyone",
    whatsOnMind: "What’s on your mind today?",
    storyImage: "Story image",
    photoUpload: "Photo upload",
    useCreateStory: "Use the Create story button above to publish a real story",
    addVisual: "Add a strong visual to make your post stand out",
    uploadingStory: "Uploading story...",
    chooseStoryImage: "Choose story image",
    liveStreamLink: "Live stream link",
    videoLink: "Video link",
    pasteVideoHelp: "Paste a YouTube link or direct video URL",
    pasteLivePlaceholder: "Paste a live stream or video URL",
    pasteVideoPlaceholder: "Paste a YouTube or video URL",
    textBadge: "Text",
    imageAttached: "Image attached",
    videoLinked: "Video linked",
    clear: "Clear",
    posting: "Posting...",
    post: "Post",
    noPosts: "No posts found here yet.",
    tryAnotherTab: "Try another feed tab or create the first post.",
    public: "Public",
    videoPost: "Video post",
    photoPost: "Photo post",
    delete: "Delete",
    viewDiscussion: "View discussion",
    like: "Like",
    liked: "Liked",
    translateShowOriginal: "Show original",
    translating: "Translating...",
    translatedTo: "Translated to",
    searchPlaceholder: "Search posts, creators, communities, topics...",
  },
  sw: {
    loadingFeed: "Inapakia FaceGrem...",
    brandTagline: "Dunia yako ya kijamii, moja kwa moja sasa",
    navigation: "Urambazaji",
    homeFeed: "Mkondo Mkuu",
    videos: "Video",
    communities: "Jumuiya",
    groups: "Makundi",
    messages: "Ujumbe",
    saved: "Vilivyohifadhiwa",
    profile: "Wasifu",
    settings: "Mipangilio",
    language: "Lugha",
    privacy: "Faragha",
    help: "Msaada",
    logout: "Toka",
    yourCommunities: "Jumuiya zako",
    viewAll: "Tazama zote",
    joinCommunitiesText: "Jiunge na jumuiya ili kuyaweka maeneo unayopenda karibu.",
    communityFallback: "Jumuiya",
    quickDetails: "Gusa kuona maelezo ya haraka",
    savedStat: "Hifadhi",
    alertsStat: "Arifa",
    groupsStat: "Makundi",
    openProfile: "Fungua Wasifu",
    savedPosts: "Machapisho Yaliyohifadhiwa",
    welcomeBack: "Karibu tena",
    goodToSeeYou: "Vizuri kukuona",
    discoverText: "Gundua watu wanashiriki nini sasa hivi kwenye FaceGrem — matukio, mawazo, video, mazungumzo, na jumuiya.",
    stories: "Hadithi",
    storiesSubtitle: "Matukio ya haraka kutoka kwa watu walio karibu nawe",
    createStory: "Tengeneza hadithi",
    uploading: "Inapakia...",
    shareQuickMoment: "Shiriki tukio la haraka",
    yourStory: "Hadithi yako",
    createPost: "Tengeneza chapisho",
    createPostSubtitle: "Shiriki wazo, picha, hadithi, au video kwenye FaceGrem",
    publicPost: "Chapisho la umma",
    liveComposer: "Muundaji wa moja kwa moja",
    postingToEveryone: "Unachapisha kwa kila mtu",
    whatsOnMind: "Unafikiria nini leo?",
    storyImage: "Picha ya hadithi",
    photoUpload: "Pakia picha",
    useCreateStory: "Tumia kitufe cya Tengeneza hadithi hejuru ushyireho hadithi nyayo",
    addVisual: "Ongeza taswira nziza kugira ngo chapisho ryawe rigaragare",
    uploadingStory: "Inapakia hadithi...",
    chooseStoryImage: "Chagua picha ya hadithi",
    liveStreamLink: "Kiungo cya mubashara",
    videoLink: "Kiungo cya video",
    pasteVideoHelp: "Bandika kiungo cya YouTube cyangwa video ya moja kwa moja",
    pasteLivePlaceholder: "Bandika kiungo cya mubashara cyangwa video",
    pasteVideoPlaceholder: "Bandika kiungo cya YouTube cyangwa video",
    textBadge: "Maandishi",
    imageAttached: "Picha imeambatishwa",
    videoLinked: "Video imeunganishwa",
    clear: "Futa",
    posting: "Inachapisha...",
    post: "Chapisha",
    noPosts: "Hakuna machapisho hapa bado.",
    tryAnotherTab: "Jaribu kichupo kingine au tengeneza chapisho la kwanza.",
    public: "Umma",
    videoPost: "Chapisho la video",
    photoPost: "Chapisho la picha",
    delete: "Futa",
    viewDiscussion: "Tazama mjadala",
    like: "Penda",
    liked: "Umeipenda",
    translateShowOriginal: "Onyesha asili",
    translating: "Inatafsiri...",
    translatedTo: "Imetafsiriwa kwa",
    searchPlaceholder: "Tafuta machapisho, wabunifu, jumuiya, mada...",
  },
  fr: {
    loadingFeed: "Chargement de FaceGrem...",
    brandTagline: "Votre univers social, en direct",
    navigation: "Navigation",
    homeFeed: "Fil d’accueil",
    videos: "Vidéos",
    communities: "Communautés",
    groups: "Groupes",
    messages: "Messages",
    saved: "Enregistrés",
    profile: "Profil",
    settings: "Paramètres",
    language: "Langue",
    privacy: "Confidentialité",
    help: "Aide",
    logout: "Se déconnecter",
    yourCommunities: "Vos communautés",
    viewAll: "Voir tout",
    joinCommunitiesText: "Rejoignez des communautés pour garder vos espaces préférés proches.",
    communityFallback: "Communauté",
    quickDetails: "Touchez pour voir des détails rapides",
    savedStat: "Enregistré",
    alertsStat: "Alertes",
    groupsStat: "Groupes",
    openProfile: "Ouvrir le profil",
    savedPosts: "Publications enregistrées",
    welcomeBack: "Bon retour",
    goodToSeeYou: "Heureux de vous revoir",
    discoverText: "Découvrez ce que les gens partagent en ce moment sur FaceGrem — moments, idées, vidéos, conversations et communautés.",
    stories: "Stories",
    storiesSubtitle: "Moments rapides des personnes autour de vous",
    createStory: "Créer une story",
    uploading: "Téléchargement...",
    shareQuickMoment: "Partagez un moment rapide",
    yourStory: "Votre story",
    createPost: "Créer une publication",
    createPostSubtitle: "Partagez une pensée, une photo, une story ou une vidéo sur FaceGrem",
    publicPost: "Publication publique",
    liveComposer: "Éditeur en direct",
    postingToEveryone: "Publication pour tout le monde",
    whatsOnMind: "À quoi pensez-vous aujourd’hui ?",
    storyImage: "Image de story",
    photoUpload: "Téléverser une photo",
    useCreateStory: "Utilisez le bouton Créer une story ci-dessus pour publier une vraie story",
    addVisual: "Ajoutez un visuel fort pour faire ressortir votre publication",
    uploadingStory: "Téléchargement de la story...",
    chooseStoryImage: "Choisir l’image de la story",
    liveStreamLink: "Lien de diffusion en direct",
    videoLink: "Lien vidéo",
    pasteVideoHelp: "Collez un lien YouTube ou une URL vidéo directe",
    pasteLivePlaceholder: "Collez un lien live ou vidéo",
    pasteVideoPlaceholder: "Collez un lien YouTube ou vidéo",
    textBadge: "Texte",
    imageAttached: "Image jointe",
    videoLinked: "Vidéo liée",
    clear: "Effacer",
    posting: "Publication...",
    post: "Publier",
    noPosts: "Aucune publication ici pour le moment.",
    tryAnotherTab: "Essayez un autre onglet ou créez la première publication.",
    public: "Public",
    videoPost: "Publication vidéo",
    photoPost: "Publication photo",
    delete: "Supprimer",
    viewDiscussion: "Voir la discussion",
    like: "J’aime",
    liked: "Aimé",
    translateShowOriginal: "Afficher l’original",
    translating: "Traduction...",
    translatedTo: "Traduit en",
    searchPlaceholder: "Rechercher des publications, créateurs, communautés, sujets...",
  },
  rw: {
    loadingFeed: "FaceGrem iri gufungura...",
    brandTagline: "Isi yawe y’imbuga nkoranyambaga, aka kanya",
    navigation: "Igenzura",
    homeFeed: "Urupapuro nyamukuru",
    videos: "Amashusho",
    communities: "Imiryango",
    groups: "Amatsinda",
    messages: "Ubutumwa",
    saved: "Byabitswe",
    profile: "Umwirondoro",
    settings: "Igenamiterere",
    language: "Ururimi",
    privacy: "Ubwirinzi bwite",
    help: "Ubufasha",
    logout: "Sohoka",
    yourCommunities: "Imiryango yawe",
    viewAll: "Reba byose",
    joinCommunitiesText: "Injira mu miryango kugira ngo ahantu ukunda habe hafi yawe.",
    communityFallback: "Umuryango",
    quickDetails: "Kanda urebe ibisobanuro byihuse",
    savedStat: "Byabitswe",
    alertsStat: "Amamenyesha",
    groupsStat: "Amatsinda",
    openProfile: "Fungura umwirondoro",
    savedPosts: "Ibyanditswe byabitswe",
    welcomeBack: "Murakaza neza nanone",
    goodToSeeYou: "Byiza kongera kukubona",
    discoverText: "Reba ibyo abantu basangiza ubu kuri FaceGrem — ibihe, ibitekerezo, amashusho, ibiganiro n’imiryango.",
    stories: "Inkuru",
    storiesSubtitle: "Ibihe byihuse by’abantu bakwegereye",
    createStory: "Kora inkuru",
    uploading: "Birimo koherezwa...",
    shareQuickMoment: "Sangiza akanya kihuse",
    yourStory: "Inkuru yawe",
    createPost: "Kora inyandiko",
    createPostSubtitle: "Sangiza igitekerezo, ifoto, inkuru cyangwa amashusho kuri FaceGrem",
    publicPost: "Inyandiko ya bose",
    liveComposer: "Gukora aka kanya",
    postingToEveryone: "Ubiherereza bose",
    whatsOnMind: "Uri gutekereza iki uyu munsi?",
    storyImage: "Ifoto y’inkuru",
    photoUpload: "Ohereza ifoto",
    useCreateStory: "Koresha buto ya Kora inkuru iri hejuru ushyireho inkuru nyayo",
    addVisual: "Ongeraho ishusho nziza kugira ngo inyandiko yawe igaragare",
    uploadingStory: "Inkuru irimo koherezwa...",
    chooseStoryImage: "Hitamo ifoto y’inkuru",
    liveStreamLink: "Ihuza rya live",
    videoLink: "Ihuza ry’amashusho",
    pasteVideoHelp: "Shyiramo link ya YouTube cyangwa video y’umwimerere",
    pasteLivePlaceholder: "Shyiramo link ya live cyangwa video",
    pasteVideoPlaceholder: "Shyiramo link ya YouTube cyangwa video",
    textBadge: "Inyandiko",
    imageAttached: "Ifoto yometseho",
    videoLinked: "Video yometseho",
    clear: "Siba",
    posting: "Birimo gutangazwa...",
    post: "Tangaza",
    noPosts: "Nta nyandiko zirimo hano ubu.",
    tryAnotherTab: "Gerageza indi tab cyangwa ukore inyandiko ya mbere.",
    public: "Rubanda",
    videoPost: "Inyandiko ya video",
    photoPost: "Inyandiko y’ifoto",
    delete: "Siba",
    viewDiscussion: "Reba ikiganiro",
    like: "Kunda",
    liked: "Wakunze",
    translateShowOriginal: "Erekana umwimerere",
    translating: "Birimo guhindurwa...",
    translatedTo: "Byahinduwe mu",
    searchPlaceholder: "Shakisha inyandiko, abahanzi, imiryango, insanganyamatsiko...",
  },
} as const;

const quickActionLabels: Record<TranslationLanguage, Record<typeof quickActions[number], string>> = {
  en: { Photo: "Photo", Video: "Video", Live: "Live", Story: "Story" },
  sw: { Photo: "Picha", Video: "Video", Live: "Mubashara", Story: "Hadithi" },
  fr: { Photo: "Photo", Video: "Vidéo", Live: "Direct", Story: "Story" },
  rw: { Photo: "Ifoto", Video: "Video", Live: "Live", Story: "Inkuru" },
};

const feedTabLabels: Record<TranslationLanguage, Record<typeof feedTabs[number], string>> = {
  en: { "For You": "For You", Following: "Following", Creators: "Creators", Videos: "Videos", Faith: "Faith", Business: "Business" },
  sw: { "For You": "Kwa Ajili Yako", Following: "Unaowafuata", Creators: "Waundaji", Videos: "Video", Faith: "Imani", Business: "Biashara" },
  fr: { "For You": "Pour vous", Following: "Abonnements", Creators: "Créateurs", Videos: "Vidéos", Faith: "Foi", Business: "Business" },
  rw: { "For You": "Bikubereye", Following: "Ukurikira", Creators: "Abahanzi", Videos: "Amashusho", Faith: "Ukwizera", Business: "Ubucuruzi" },
};

export default function FeedPage() {
  const router = useRouter();
  const storyInputRef = useRef<HTMLInputElement | null>(null);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);

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
  const [stories, setStories] = useState<StoryRecord[]>([]);
  const [follows, setFollows] = useState<FollowRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedLanguage, setSelectedLanguage] = useState<TranslationLanguage>("en");
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [translatedPosts, setTranslatedPosts] = useState<Record<string, string>>({});
  const [translatedComments, setTranslatedComments] = useState<Record<string, string>>({});
  const [translatingPosts, setTranslatingPosts] = useState<Record<string, boolean>>({});
  const [translatingComments, setTranslatingComments] = useState<Record<string, boolean>>({});

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

  const [storyUploading, setStoryUploading] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [activeStoryUserId, setActiveStoryUserId] = useState("");
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(false);

  const [activeRightPanel, setActiveRightPanel] = useState<
    "friends" | "communities" | "messages" | "videos"
  >("friends");
  const [activeFriendsTab, setActiveFriendsTab] = useState<
    "online" | "suggestions" | "your_friends"
  >("online");

  const t = uiTranslations[selectedLanguage];

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

  const handleLanguageChange = (language: TranslationLanguage) => {
    setSelectedLanguage(language);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("facegrem_language", language);
    }
    setIsLanguageMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      setUserId(currentUserId);
      setUserName(currentUserName);

      const nowIso = new Date().toISOString();

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
        { data: storiesData },
        { data: followsData },
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
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false }),
        supabase
          .from("stories")
          .select("id, user_id, image_url, caption, created_at, expires_at")
          .gt("expires_at", nowIso)
          .order("created_at", { ascending: false }),
        supabase.from("follows").select("id, follower_id, following_id"),
      ]);

      const allProfiles = profilesData || [];
      const myProfile = allProfiles.find((profile) => profile.id === currentUserId);

      setProfiles(allProfiles);
      setPosts(postsData || []);
      setLikes(likesData || []);
      setComments(commentsData || []);
      setSavedPosts(savedPostsData || []);
      setCommunities(communitiesData || []);
      setCommunityMembers(communityMembersData || []);
      setVideos(videosData || []);
      setNotifications(notificationsData || []);
      setStories(storiesData || []);
      setFollows(followsData || []);
      setUserAvatar(
        myProfile?.avatar_url || getAvatarUrl(myProfile?.full_name || currentUserName)
      );
      setLoading(false);
    };

    void loadFeed();
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedLanguage = window.localStorage.getItem("facegrem_language");
    if (
      storedLanguage === "en" ||
      storedLanguage === "sw" ||
      storedLanguage === "fr" ||
      storedLanguage === "rw"
    ) {
      setSelectedLanguage(storedLanguage);
    }

    const handleStorage = () => {
      const latest = window.localStorage.getItem("facegrem_language");
      if (
        latest === "en" ||
        latest === "sw" ||
        latest === "fr" ||
        latest === "rw"
      ) {
        setSelectedLanguage(latest);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const isFollowingUser = (targetUserId: string) =>
    follows.some(
      (follow) =>
        follow.follower_id === userId && follow.following_id === targetUserId
    );

  const myCommunityIds = useMemo(() => {
    return communityMembers
      .filter((member) => member.user_id === userId)
      .map((member) => member.community_id);
  }, [communityMembers, userId]);

  const unreadNotificationsCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const suggestedPeople = useMemo(() => {
    return profiles
      .filter((profile) => profile.id !== userId && !isFollowingUser(profile.id))
      .slice(0, 6);
  }, [profiles, userId, follows]);

  const onlinePeople = useMemo(() => {
    const followedIds = follows
      .filter((follow) => follow.follower_id === userId)
      .map((follow) => follow.following_id);

    return profiles
      .filter((profile) => followedIds.includes(profile.id))
      .slice(0, 6);
  }, [profiles, follows, userId]);

  const yourFriends = useMemo(() => {
    const relatedIds = new Set<string>();

    follows.forEach((follow) => {
      if (follow.follower_id === userId) relatedIds.add(follow.following_id);
      if (follow.following_id === userId) relatedIds.add(follow.follower_id);
    });

    return profiles.filter((profile) => relatedIds.has(profile.id)).slice(0, 8);
  }, [profiles, follows, userId]);

  const suggestedCommunities = useMemo(() => {
    return communities
      .filter((community) => !myCommunityIds.includes(community.id))
      .slice(0, 5);
  }, [communities, myCommunityIds]);

  const latestVideoCards = useMemo(() => videos.slice(0, 4), [videos]);
  const latestActivity = useMemo(() => notifications.slice(0, 5), [notifications]);

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    switch (activeFeedTab) {
      case "Following":
        result = result.filter((post) => isFollowingUser(post.user_id));
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
          return (
            text.includes("faith") ||
            text.includes("jesus") ||
            text.includes("church") ||
            text.includes("gospel")
          );
        });
        break;
      case "Business":
        result = result.filter((post) => {
          const text = `${post.content} ${post.full_name || ""}`.toLowerCase();
          return (
            text.includes("business") ||
            text.includes("money") ||
            text.includes("brand") ||
            text.includes("market")
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
  }, [activeFeedTab, posts, searchText, profiles, follows, userId]);

  const storyGroups = useMemo(() => {
    const grouped = new Map<string, StoryRecord[]>();

    for (const story of stories) {
      if (!grouped.has(story.user_id)) grouped.set(story.user_id, []);
      grouped.get(story.user_id)?.push(story);
    }

    const items = Array.from(grouped.entries()).map(([storyUserId, userStories]) => ({
      userId: storyUserId,
      stories: userStories
        .slice()
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      latestCreatedAt: userStories
        .slice()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]?.created_at,
    }));

    items.sort((a, b) => {
      if (a.userId === userId) return -1;
      if (b.userId === userId) return 1;
      return (
        new Date(b.latestCreatedAt || 0).getTime() -
        new Date(a.latestCreatedAt || 0).getTime()
      );
    });

    return items;
  }, [stories, userId]);

  const highlightedProfiles = useMemo(() => {
    const storyUserIds = new Set(storyGroups.map((group) => group.userId));
    return profiles
      .filter((profile) => profile.id !== userId && !storyUserIds.has(profile.id))
      .slice(0, 6);
  }, [profiles, userId, storyGroups]);

  const activeStoryGroup = useMemo(() => {
    if (!activeStoryUserId) return null;
    return storyGroups.find((group) => group.userId === activeStoryUserId) || null;
  }, [activeStoryUserId, storyGroups]);

  const activeStory = useMemo(() => {
    if (!activeStoryGroup) return null;
    return activeStoryGroup.stories[activeStoryIndex] || null;
  }, [activeStoryGroup, activeStoryIndex]);

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

  const uploadStoryImage = async (file: File) => {
    if (!userId) return null;

    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt.toLowerCase()}`;

    const { error: uploadError } = await supabase.storage
      .from("stories")
      .upload(filePath, file, {
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

  const handleCreateStory = async (file: File) => {
    if (!userId) return;

    setStoryUploading(true);

    try {
      const imageUrl = await uploadStoryImage(file);

      if (!imageUrl) {
        throw new Error("Could not upload story image.");
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("stories")
        .insert([
          {
            user_id: userId,
            image_url: imageUrl,
            caption: "",
            expires_at: expiresAt,
          },
        ])
        .select("id, user_id, image_url, caption, created_at, expires_at");

      if (error) {
        alert(error.message);
        setStoryUploading(false);
        return;
      }

      if (data && data.length > 0) {
        setStories((prev) => [data[0], ...prev]);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not create story.");
    }

    setStoryUploading(false);
  };

  const handleStoryInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await handleCreateStory(file);
    e.target.value = "";
  };

  const handleOpenStoryCreator = () => {
    if (storyUploading) return;
    storyInputRef.current?.click();
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

  const handleToggleFollow = async (targetUserId: string) => {
    const existingFollow = follows.find(
      (follow) =>
        follow.follower_id === userId && follow.following_id === targetUserId
    );

    if (existingFollow) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("id", existingFollow.id);

      if (error) {
        alert(error.message);
        return;
      }

      setFollows((prev) => prev.filter((follow) => follow.id !== existingFollow.id));
      return;
    }

    const { data, error } = await supabase
      .from("follows")
      .insert([
        {
          follower_id: userId,
          following_id: targetUserId,
        },
      ])
      .select("id, follower_id, following_id");

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setFollows((prev) => [...prev, data[0]]);
    }
  };

  const getPostLikesCount = (postId: string) =>
    likes.filter((like) => like.post_id === postId).length;

  const getPostCommentsCount = (postId: string) =>
    comments.filter((comment) => comment.post_id === postId).length;

  const isSaved = (postId: string) =>
    savedPosts.some((saved) => saved.user_id === userId && saved.post_id === postId);

  const isLiked = (postId: string) =>
    likes.some((like) => like.user_id === userId && like.post_id === postId);

  const openStoryViewer = (storyUserId: string) => {
    setActiveStoryUserId(storyUserId);
    setActiveStoryIndex(0);
    setStoryViewerOpen(true);
  };

  const closeStoryViewer = () => {
    setStoryViewerOpen(false);
    setActiveStoryUserId("");
    setActiveStoryIndex(0);
  };

  const goToNextStory = () => {
    if (!activeStoryGroup) return;

    if (activeStoryIndex < activeStoryGroup.stories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      return;
    }

    const currentGroupIndex = storyGroups.findIndex(
      (group) => group.userId === activeStoryGroup.userId
    );

    if (currentGroupIndex >= 0 && currentGroupIndex < storyGroups.length - 1) {
      setActiveStoryUserId(storyGroups[currentGroupIndex + 1].userId);
      setActiveStoryIndex(0);
      return;
    }

    closeStoryViewer();
  };

  const goToPreviousStory = () => {
    if (!activeStoryGroup) return;

    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
      return;
    }

    const currentGroupIndex = storyGroups.findIndex(
      (group) => group.userId === activeStoryGroup.userId
    );

    if (currentGroupIndex > 0) {
      const prevGroup = storyGroups[currentGroupIndex - 1];
      setActiveStoryUserId(prevGroup.userId);
      setActiveStoryIndex(prevGroup.stories.length - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817] text-white">
        {t.loadingFeed}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020817] pb-24 text-white xl:pb-0">
      <style jsx>{`
        @keyframes blobFloatA {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(34px, -24px, 0) scale(1.08);
          }
        }

        @keyframes blobFloatB {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(-28px, 28px, 0) scale(1.06);
          }
        }

        @keyframes blobFloatC {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(18px, 20px, 0) scale(1.05);
          }
        }

        @keyframes ambientPulse {
          0%,
          100% {
            opacity: 0.55;
          }
          50% {
            opacity: 0.85;
          }
        }

        .blob-a {
          animation: blobFloatA 18s ease-in-out infinite;
        }

        .blob-b {
          animation: blobFloatB 22s ease-in-out infinite;
        }

        .blob-c {
          animation: blobFloatC 20s ease-in-out infinite;
        }

        .ambient-pulse {
          animation: ambientPulse 10s ease-in-out infinite;
        }
      `}</style>

      <input
        ref={storyInputRef}
        type="file"
        accept="image/*"
        onChange={handleStoryInputChange}
        className="hidden"
      />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#020817_0%,#03101f_38%,#020817_100%)]" />

        <div className="absolute inset-0 opacity-70 ambient-pulse bg-[radial-gradient(circle_at_12%_18%,rgba(34,211,238,0.09),transparent_24%),radial-gradient(circle_at_85%_14%,rgba(59,130,246,0.08),transparent_22%),radial-gradient(circle_at_50%_82%,rgba(168,85,247,0.07),transparent_20%)]" />

        <div className="absolute blob-a -left-24 top-10 h-[24rem] w-[24rem] rounded-full bg-cyan-400/[0.08] blur-[110px]" />
        <div className="absolute blob-b right-[-7rem] top-[-2rem] h-[26rem] w-[26rem] rounded-full bg-blue-500/[0.08] blur-[120px]" />
        <div className="absolute blob-c bottom-[-7rem] left-1/3 h-[22rem] w-[22rem] rounded-full bg-fuchsia-500/[0.06] blur-[110px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:120px_120px] opacity-[0.08]" />

        <div className="absolute inset-0 bg-black/10" />
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
                <p className="text-xs text-slate-400">{t.brandTagline}</p>
              </div>
            </Link>
          </div>

          <div className="hidden flex-1 lg:block">
            <div className="mx-auto max-w-xl">
              <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${softCard}`}>
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

            <button
              type="button"
              onClick={handleLogout}
              className="hidden rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/[0.06] lg:inline-flex"
            >
              ↩️ {t.logout}
            </button>

            <Link
              href="/profile"
              className="hidden items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-2 py-1.5 transition hover:bg-white/[0.06] sm:flex sm:px-2 sm:pr-3"
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
              <Link
                href="/feed"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]"
              >
                🏠 {t.homeFeed}
              </Link>
              <Link
                href="/videos"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]"
              >
                🎬 {t.videos}
              </Link>
              <Link
                href="/communities"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]"
              >
                👥 {t.communities}
              </Link>
              <Link
                href="/groups"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]"
              >
                🫂 {t.groups}
              </Link>
              <Link
                href="/messages"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]"
              >
                💬 {t.messages}
              </Link>
              <Link
                href="/saved"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]"
              >
                🔖 {t.saved}
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-2xl px-4 py-3 text-white transition hover:bg-white/[0.08]"
              >
                👤 {t.profile}
              </Link>
            </div>

            <div className="pt-5 mt-8 border-t border-white/10">
              <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                More
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
                  className="block w-full rounded-2xl px-4 py-3 text-left text-rose-100 transition hover:bg-rose-400/[0.10]"
                >
                  ↩️ {t.logout}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        <aside className="hidden xl:block">
          <div className="sticky top-[104px] space-y-4">
            <div className={`overflow-hidden rounded-[30px] p-4 ${glassCard}`}>
              <button
                type="button"
                onClick={() => setIsProfileCardOpen(!isProfileCardOpen)}
                className="flex items-center w-full gap-3 text-left"
              >
                <img
                  src={userAvatar}
                  alt={userName}
                  className="object-cover h-14 w-14 rounded-2xl ring-1 ring-white/10"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{userName}</p>
                  <p className="text-sm truncate text-slate-400">{t.quickDetails}</p>
                </div>
                <div className="text-xl text-white">{isProfileCardOpen ? "−" : "+"}</div>
              </button>

              {isProfileCardOpen && (
                <div className="pt-4 mt-4 space-y-3 border-t border-white/10">
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`rounded-2xl px-3 py-3 text-center ${softCard}`}>
                      <p className="text-[11px] text-slate-400">{t.savedStat}</p>
                      <p className="mt-1 text-sm font-semibold text-white">{savedPosts.length}</p>
                    </div>
                    <div className={`rounded-2xl px-3 py-3 text-center ${softCard}`}>
                      <p className="text-[11px] text-slate-400">{t.alertsStat}</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {unreadNotificationsCount}
                      </p>
                    </div>
                    <div className={`rounded-2xl px-3 py-3 text-center ${softCard}`}>
                      <p className="text-[11px] text-slate-400">{t.groupsStat}</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {myCommunityIds.length}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/profile"
                      className={`rounded-2xl px-4 py-3 text-center text-sm text-white transition hover:bg-white/[0.08] ${softCard}`}
                    >
                      {t.openProfile}
                    </Link>
                    <Link
                      href="/saved"
                      className={`rounded-2xl px-4 py-3 text-center text-sm text-white transition hover:bg-white/[0.08] ${softCard}`}
                    >
                      {t.savedPosts}
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`w-full rounded-2xl px-4 py-3 text-center text-sm text-rose-100 transition hover:bg-rose-400/[0.10] ${softCard}`}
                  >
                    ↩️ {t.logout}
                  </button>
                </div>
              )}
            </div>

            <div className={`rounded-[28px] p-4 ${glassCard}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-cyan-200">{t.yourCommunities}</p>
                <Link
                  href="/communities"
                  className="text-xs transition text-cyan-300 hover:text-cyan-200"
                >
                  {t.viewAll}
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {communities.filter((community) => myCommunityIds.includes(community.id))
                  .length === 0 ? (
                  <p className="text-sm leading-7 text-slate-400">
                    {t.joinCommunitiesText}
                  </p>
                ) : (
                  communities
                    .filter((community) => myCommunityIds.includes(community.id))
                    .slice(0, 4)
                    .map((community) => (
                      <Link
                        key={community.id}
                        href={`/communities/${community.id}`}
                        className={`block rounded-2xl px-4 py-3 transition hover:bg-white/[0.08] ${softCard}`}
                      >
                        <p className="font-medium text-white">{community.name}</p>
                        <p className="mt-1 text-xs text-slate-400/90">
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
          <div className="overflow-hidden rounded-[32px] border border-white/[0.06] bg-[linear-gradient(135deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015)_38%,rgba(255,255,255,0.025)_100%)] p-6 backdrop-blur-[28px] shadow-[0_24px_80px_rgba(2,8,23,0.14)]">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-cyan-200">{t.welcomeBack}</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-5xl">
                {t.goodToSeeYou}, {userName.split(" ")[0]}.
              </h2>
              <p className="max-w-xl mt-4 text-sm leading-8 text-slate-300 sm:text-base">
                {t.discoverText}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[30px] border border-white/[0.05] bg-white/[0.018] p-3 backdrop-blur-[30px] shadow-[0_18px_50px_rgba(2,8,23,0.14)] sm:rounded-[32px] sm:p-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.01em] text-cyan-100/90">{t.stories}</p>
                <p className="text-xs text-slate-400/90">{t.storiesSubtitle}</p>
              </div>

              <button
                type="button"
                onClick={handleOpenStoryCreator}
                disabled={storyUploading}
                className="rounded-full border border-white/[0.06] bg-white/[0.025] px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.045] disabled:opacity-70"
              >
                {storyUploading ? t.uploading : t.createStory}
              </button>
            </div>

            <div className="flex gap-3 min-w-max sm:gap-4">
              <button
                type="button"
                onClick={handleOpenStoryCreator}
                disabled={storyUploading}
                className="group relative h-48 w-28 shrink-0 overflow-hidden rounded-[28px] border border-white/[0.06] bg-white/[0.022] p-1 text-left backdrop-blur-[24px] transition duration-300 hover:-translate-y-1 disabled:opacity-70 sm:h-52 sm:w-36"
              >
                <div className="relative h-full overflow-hidden rounded-[24px] bg-[#0b1220]/42">
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="absolute inset-0 h-full w-full object-cover opacity-24"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-[#020817]/20 to-transparent" />

                  <div className="relative flex flex-col justify-between h-full p-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.08] text-2xl font-semibold text-white shadow-[0_10px_26px_rgba(2,8,23,0.16)]">
                      +
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        {storyUploading ? t.uploading : t.createStory}
                      </p>
                      <p className="mt-1 text-xs text-white/75">{t.shareQuickMoment}</p>
                    </div>
                  </div>
                </div>
              </button>

              {storyGroups.map((group, index) => {
                const storyProfile = getProfileById(group.userId);
                const storyUserName = storyProfile?.full_name || "FaceGrem User";
                const storyUserAvatar =
                  storyProfile?.avatar_url || getAvatarUrl(storyUserName);
                const previewStory =
                  group.stories[group.stories.length - 1] || group.stories[0];

                return (
                  <button
                    key={group.userId}
                    type="button"
                    onClick={() => openStoryViewer(group.userId)}
                    className="group relative h-48 w-28 shrink-0 overflow-hidden rounded-[28px] border border-white/[0.06] bg-white/[0.022] p-1 text-left backdrop-blur-[24px] transition duration-300 hover:-translate-y-1 sm:h-52 sm:w-36"
                  >
                    <div className="relative h-full overflow-hidden rounded-[24px] bg-[#0b1220]/40">
                      <img
                        src={previewStory.image_url}
                        alt={storyUserName}
                        className="absolute inset-0 h-full w-full object-cover opacity-72 transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020817]/88 via-[#020817]/10 to-transparent" />

                      <div className="relative flex flex-col justify-between h-full p-4">
                        <img
                          src={storyUserAvatar}
                          alt={storyUserName}
                          className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/12 shadow-[0_8px_20px_rgba(2,8,23,0.16)]"
                        />

                        <div>
                          <p className="text-sm font-semibold text-white line-clamp-2">
                            {storyUserName}
                          </p>
                          <p className="mt-1 text-xs text-white/75">
                            {group.userId === userId
                              ? t.yourStory
                              : `@${storyProfile?.username || "member"}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {highlightedProfiles.map((profile, index) => (
                <Link
                  key={profile.id}
                  href={`/profile?id=${profile.id}`}
                  className="group relative h-48 w-28 shrink-0 overflow-hidden rounded-[28px] border border-white/[0.06] bg-white/[0.022] p-1 backdrop-blur-[24px] transition duration-300 hover:-translate-y-1 sm:h-52 sm:w-36"
                >
                  <div className="relative h-full overflow-hidden rounded-[24px] bg-[#0b1220]/40">
                    <img
                      src={
                        profile.avatar_url ||
                        getAvatarUrl(profile.full_name || "FaceGrem User")
                      }
                      alt={profile.full_name}
                      className="absolute inset-0 h-full w-full object-cover opacity-72 transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020817]/88 via-[#020817]/10 to-transparent" />

                    <div className="relative flex flex-col justify-between h-full p-4">
                      <img
                        src={
                          profile.avatar_url ||
                          getAvatarUrl(profile.full_name || "FaceGrem User")
                        }
                        alt={profile.full_name}
                        className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/12 shadow-[0_8px_20px_rgba(2,8,23,0.16)]"
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
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-white/[0.05] bg-white/[0.018] backdrop-blur-[30px] shadow-[0_18px_50px_rgba(2,8,23,0.14)]">
            <div className="border-b border-white/[0.05] px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold tracking-[0.01em] text-cyan-100/90">{t.createPost}</p>
                  <p className="mt-1 text-xs text-slate-400/90">
                    {t.createPostSubtitle}
                  </p>
                </div>

                <div className="items-center hidden gap-2 sm:flex">
                  <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 text-xs text-slate-300">
                    Public post
                  </span>
                  <span className="rounded-full border border-cyan-300/10 bg-cyan-400/[0.08] px-3 py-1.5 text-xs text-cyan-100">
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
                  className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/[0.08] sm:h-14 sm:w-14"
                />

                <div className="flex-1 min-w-0">
                  <div className="rounded-[24px] border border-white/[0.05] bg-white/[0.02] p-4 backdrop-blur-[22px]">
                    <div className="flex flex-wrap items-center gap-2 mb-3 sm:gap-3">
                      <p className="font-medium text-white">{userName}</p>
                      <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 text-[11px] text-slate-300">
                        Posting to everyone
                      </span>
                    </div>

                    <textarea
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      rows={4}
                      placeholder={t.whatsOnMind}
                      className="w-full resize-none bg-transparent text-[15px] leading-7 text-white placeholder:text-slate-400/90 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-5 sm:gap-3">
                {quickActions.map((action) => (
                  <button
                    key={quickActionLabels[selectedLanguage][action]}
                    type="button"
                    onClick={() => {
                      setActiveComposerAction(action);
                      if (action === "Story") handleOpenStoryCreator();
                    }}
                    className={`rounded-full px-4 py-2.5 text-sm font-medium transition sm:px-5 sm:py-3 ${
                      activeComposerAction === action
                        ? "border border-cyan-300/10 bg-cyan-400/[0.10] text-cyan-100 shadow-[0_6px_20px_rgba(34,211,238,0.08)]"
                        : "border border-white/[0.06] bg-white/[0.025] text-slate-300 hover:bg-white/[0.045]"
                    }`}
                  >
                    {quickActionLabels[selectedLanguage][action]}
                  </button>
                ))}
              </div>

              {(activeComposerAction === "Photo" || activeComposerAction === "Story") && (
                <div className="mt-5 rounded-[24px] border border-white/[0.05] bg-white/[0.02] p-4 backdrop-blur-[22px]">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {activeComposerAction === "Story" ? t.storyImage : t.photoUpload}
                    </p>
                    <p className="mt-1 text-xs text-slate-400/90">
                      {activeComposerAction === "Story"
                        ? t.useCreateStory
                        : t.addVisual}
                    </p>
                  </div>

                  {activeComposerAction === "Photo" && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mt-4 block w-full rounded-2xl text-sm text-white file:mr-4 file:rounded-xl file:border file:border-white/[0.06] file:bg-white/[0.04] file:px-4 file:py-2.5 file:text-slate-200"
                      />

                      {imagePreview && (
                        <div className="mt-4 overflow-hidden rounded-[20px] border border-white/10">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="object-cover w-full max-h-96"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {activeComposerAction === "Story" && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={handleOpenStoryCreator}
                        disabled={storyUploading}
                        className="rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.08] px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/[0.12] disabled:opacity-70"
                      >
                        {storyUploading ? t.uploadingStory : t.chooseStoryImage}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {(activeComposerAction === "Video" || activeComposerAction === "Live") && (
                <div className="mt-5 rounded-[24px] border border-white/[0.05] bg-white/[0.02] p-4 backdrop-blur-[22px]">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {activeComposerAction === "Live" ? t.liveStreamLink : t.videoLink}
                    </p>
                    <p className="mt-1 text-xs text-slate-400/90">
                      {t.pasteVideoHelp}
                    </p>
                  </div>

                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder={
                      activeComposerAction === "Live"
                        ? t.pasteLivePlaceholder
                        : t.pasteVideoPlaceholder
                    }
                    className="mt-4 w-full rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-sm text-white placeholder:text-slate-400/90 outline-none transition focus:border-cyan-300/20"
                  />
                </div>
              )}

              <div className="mt-5 flex flex-col gap-4 border-t border-white/[0.05] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 text-xs text-slate-300">
                    Text
                  </span>
                  {imagePreview && (
                    <span className="rounded-full border border-fuchsia-300/10 bg-fuchsia-400/[0.08] px-3 py-1.5 text-xs text-fuchsia-100">
                      Image attached
                    </span>
                  )}
                  {videoUrl.trim() && (
                    <span className="rounded-full border border-cyan-300/10 bg-cyan-400/[0.08] px-3 py-1.5 text-xs text-cyan-100">
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
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.045]"
                  >
                    Clear
                  </button>

                  <button
                    onClick={handleCreatePost}
                    disabled={posting}
                    className="rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.10] px-6 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/[0.14] disabled:opacity-70"
                  >
                    {posting ? t.posting : t.post}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {feedTabs.map((tab) => (
              <button
                key={feedTabLabels[selectedLanguage][tab]}
                type="button"
                onClick={() => {
                  setActiveFeedTab(tab);
                  if (tab === "Videos") router.push("/videos");
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeFeedTab === tab
                    ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                    : "border border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.08]"
                }`}
              >
                {feedTabLabels[selectedLanguage][tab]}
              </button>
            ))}
          </div>

          {filteredPosts.length === 0 ? (
            <div className={`rounded-[30px] p-8 text-center ${glassCard}`}>
              <p className="text-lg font-medium text-white">{t.noPosts}</p>
              <p className="mt-2 text-sm text-slate-400">
                {t.tryAnotherTab}
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
                    className="overflow-hidden rounded-[32px] border border-white/[0.05] bg-white/[0.018] backdrop-blur-[30px] shadow-[0_18px_50px_rgba(2,8,23,0.14)]"
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
                            className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/[0.08]"
                          />

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-white truncate">{authorName}</p>

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
                              <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 text-[11px] text-slate-300">
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
                            className="rounded-2xl border border-red-300/10 bg-red-400/[0.07] px-4 py-2 text-xs text-red-100 transition hover:bg-red-400/[0.11]"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      {post.content && (
                        <div className="mt-5">
                          <p className="text-[15px] leading-8 text-slate-200/95">{post.content}</p>

                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleTogglePostTranslation(post.id, post.content)}
                              disabled={translatingPosts[post.id]}
                              className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.045] disabled:opacity-70"
                            >
                              {translatingPosts[post.id]
                                ? t.translating
                                : translatedPosts[post.id]
                                ? t.translateShowOriginal
                                : `Translate to ${languageLabels[selectedLanguage]}`}
                            </button>

                            {translatedPosts[post.id] && (
                              <span className="text-xs text-cyan-200/90">
                                {t.translatedTo} {languageLabels[selectedLanguage]}
                              </span>
                            )}
                          </div>

                          {translatedPosts[post.id] && (
                            <div className="mt-3 rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.06] px-4 py-3">
                              <p className="text-[15px] leading-8 text-cyan-50">
                                {translatedPosts[post.id]}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {post.image_url && (
                      <div className="border-y border-white/[0.05] bg-black/10 px-3 pb-3 sm:px-4 sm:pb-4">
                        <div className="overflow-hidden rounded-[28px] border border-white/[0.05]">
                          <img
                            src={post.image_url}
                            alt="Post"
                            className="max-h-[720px] w-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {post.video_url && (
                      <div className="border-y border-white/[0.05] bg-black/12 px-3 pb-3 sm:px-4 sm:pb-4">
                        <div className="overflow-hidden rounded-[28px] border border-white/[0.05]">
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
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.05] pb-4">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-2 rounded-full border border-white/[0.05] bg-white/[0.022] px-3 py-1.5">
                            <span className="text-base">❤️</span>
                            <span className="text-slate-200">
                              {likesCount} {likesCount === 1 ? "like" : "likes"}
                            </span>
                          </div>

                          <div className="rounded-full border border-white/[0.05] bg-white/[0.022] px-3 py-1.5 text-slate-300">
                            {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
                          </div>
                        </div>

                        <Link
                          href={`/post/${post.id}`}
                          className="text-sm font-medium transition text-cyan-300 hover:text-cyan-200"
                        >
                          {t.viewDiscussion}
                        </Link>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                        <button
                          onClick={() => handleToggleLike(post.id, post.user_id)}
                          className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                            isLiked(post.id)
                              ? "border border-cyan-300/10 bg-cyan-400/[0.10] text-cyan-100 shadow-[0_6px_20px_rgba(34,211,238,0.08)]"
                              : "border border-white/[0.06] bg-white/[0.025] text-slate-300 hover:bg-white/[0.045]"
                          }`}
                        >
                          {isLiked(post.id) ? t.liked : t.like}
                        </button>

                        <Link
                          href={`/post/${post.id}`}
                          className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-white/[0.08]"
                        >
                          Comment
                        </Link>

                        <button
                          onClick={() => handleToggleSave(post.id)}
                          className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                            isSaved(post.id)
                              ? "border border-cyan-300/10 bg-cyan-400/[0.10] text-cyan-100 shadow-[0_6px_20px_rgba(34,211,238,0.08)]"
                              : "border border-white/[0.06] bg-white/[0.025] text-slate-300 hover:bg-white/[0.045]"
                          }`}
                        >
                          {isSaved(post.id) ? "Saved" : "Save"}
                        </button>

                        <Link
                          href={`/post/${post.id}`}
                          className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-center text-sm font-medium text-cyan-300 transition hover:bg-white/[0.08]"
                        >
                          Open
                        </Link>
                      </div>

                      {latestComments.length > 0 && (
                        <div className="mt-5 space-y-3 border-t border-white/[0.05] pt-4">
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
                                className="flex items-start gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-3 backdrop-blur-[20px]"
                              >
                                <img
                                  src={commentAuthorAvatar}
                                  alt={commentAuthorName}
                                  className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/[0.08]"
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

                                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-300/95">
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

        <aside className="space-y-5">
          <div className="rounded-[30px] border border-white/[0.05] bg-white/[0.018] p-5 backdrop-blur-[30px] shadow-[0_18px_50px_rgba(2,8,23,0.14)]">
            {activeRightPanel === "friends" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold tracking-[0.01em] text-cyan-100/90">Friends</p>
                  <p className="mt-1 text-xs text-slate-400/90">
                    Online, suggestions, and your friends
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFriendsTab("online")}
                    className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                      activeFriendsTab === "online"
                        ? "border border-cyan-300/10 bg-cyan-400/[0.10] text-cyan-100 shadow-[0_6px_20px_rgba(34,211,238,0.08)]"
                        : "border border-white/[0.06] bg-white/[0.025] text-slate-300 hover:bg-white/[0.045]"
                    }`}
                  >
                    Online
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFriendsTab("suggestions")}
                    className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                      activeFriendsTab === "suggestions"
                        ? "border border-cyan-300/10 bg-cyan-400/[0.10] text-cyan-100 shadow-[0_6px_20px_rgba(34,211,238,0.08)]"
                        : "border border-white/[0.06] bg-white/[0.025] text-slate-300 hover:bg-white/[0.045]"
                    }`}
                  >
                    Suggestions
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFriendsTab("your_friends")}
                    className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                      activeFriendsTab === "your_friends"
                        ? "border border-cyan-300/10 bg-cyan-400/[0.10] text-cyan-100 shadow-[0_6px_20px_rgba(34,211,238,0.08)]"
                        : "border border-white/[0.06] bg-white/[0.025] text-slate-300 hover:bg-white/[0.045]"
                    }`}
                  >
                    Your Friends
                  </button>
                </div>

                {activeFriendsTab === "online" && (
                  <div className="space-y-4">
                    {onlinePeople.length === 0 ? (
                      <p className="text-sm text-slate-400">No online friends to show yet.</p>
                    ) : (
                      onlinePeople.map((person) => (
                        <div key={person.id} className="rounded-[24px] border border-white/[0.05] bg-white/[0.022] p-4 backdrop-blur-[24px] shadow-[0_10px_28px_rgba(2,8,23,0.10)]">
                          <Link href={`/profile?id=${person.id}`} className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={
                                  person.avatar_url ||
                                  getAvatarUrl(person.full_name || "FaceGrem User")
                                }
                                alt={person.full_name}
                                className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/10"
                              />
                              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#08111d] bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.35)]" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white truncate">{person.full_name}</p>
                              <p className="truncate text-xs text-slate-400/85">
                                @{person.username || "member"} • online
                              </p>
                            </div>
                          </Link>

                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <Link
                              href={`/messages?user=${person.id}`}
                              className="rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.10] px-4 py-2.5 text-center text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/[0.14]"
                            >
                              Message
                            </Link>

                            <Link
                              href={`/profile?id=${person.id}`}
                              className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-2.5 text-center text-sm text-slate-300 transition hover:bg-white/[0.045]"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeFriendsTab === "suggestions" && (
                  <div className="space-y-4">
                    {suggestedPeople.length === 0 ? (
                      <p className="text-sm text-slate-400">No suggestions yet.</p>
                    ) : (
                      suggestedPeople.map((person) => {
                        const following = isFollowingUser(person.id);

                        return (
                          <div key={person.id} className="rounded-[24px] border border-white/[0.05] bg-white/[0.022] p-4 backdrop-blur-[24px] shadow-[0_10px_28px_rgba(2,8,23,0.10)]">
                            <Link href={`/profile?id=${person.id}`} className="flex items-center gap-3">
                              <img
                                src={
                                  person.avatar_url ||
                                  getAvatarUrl(person.full_name || "FaceGrem User")
                                }
                                alt={person.full_name}
                                className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/10"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{person.full_name}</p>
                                <p className="truncate text-xs text-slate-400/85">
                                  @{person.username || "member"}
                                </p>
                              </div>
                            </Link>

                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleToggleFollow(person.id)}
                                className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                                  following
                                    ? "border border-cyan-400/20 bg-cyan-500/20 text-cyan-200"
                                    : "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                                }`}
                              >
                                {following ? "Following" : "Follow"}
                              </button>

                              <Link
                                href={`/profile?id=${person.id}`}
                                className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.08]"
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {activeFriendsTab === "your_friends" && (
                  <div className="space-y-4">
                    {yourFriends.length === 0 ? (
                      <p className="text-sm text-slate-400">You have no friends to show yet.</p>
                    ) : (
                      yourFriends.map((person) => (
                        <div key={person.id} className="rounded-[24px] border border-white/[0.05] bg-white/[0.022] p-4 backdrop-blur-[24px] shadow-[0_10px_28px_rgba(2,8,23,0.10)]">
                          <Link href={`/profile?id=${person.id}`} className="flex items-center gap-3">
                            <img
                              src={
                                person.avatar_url ||
                                getAvatarUrl(person.full_name || "FaceGrem User")
                              }
                              alt={person.full_name}
                              className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/10"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white truncate">{person.full_name}</p>
                              <p className="truncate text-xs text-slate-400/85">
                                @{person.username || "member"}
                              </p>
                            </div>
                          </Link>

                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <Link
                              href={`/messages?user=${person.id}`}
                              className="rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.10] px-4 py-2.5 text-center text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/[0.14]"
                            >
                              Message
                            </Link>

                            <Link
                              href={`/profile?id=${person.id}`}
                              className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-2.5 text-center text-sm text-slate-300 transition hover:bg-white/[0.045]"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {activeRightPanel === "communities" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-cyan-200">Communities</p>
                  <p className="mt-1 text-xs text-slate-400/90">
                    Discover and open communities
                  </p>
                </div>

                {suggestedCommunities.length === 0 ? (
                  <p className="text-sm text-slate-400">No communities to show yet.</p>
                ) : (
                  suggestedCommunities.map((community) => {
                    const memberCount = communityMembers.filter(
                      (member) => member.community_id === community.id
                    ).length;

                    return (
                      <Link
                        key={community.id}
                        href={`/communities/${community.id}`}
                        className={`block rounded-2xl p-4 transition hover:bg-white/[0.08] ${softCard}`}
                      >
                        <p className="font-medium text-white">{community.name}</p>
                        <p className="mt-1 text-xs text-slate-400/90">
                          {community.category || t.communityFallback} • {memberCount} members
                        </p>
                      </Link>
                    );
                  })
                )}

                <Link
                  href="/communities"
                  className="block px-4 py-3 text-sm font-medium text-center text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20"
                >
                  Open communities page
                </Link>
              </div>
            )}

            {activeRightPanel === "messages" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-cyan-200">Messages</p>
                  <p className="mt-1 text-xs text-slate-400/90">
                    Recent activity and quick access
                  </p>
                </div>

                {latestActivity.length === 0 ? (
                  <p className="text-sm text-slate-400">No activity yet.</p>
                ) : (
                  latestActivity.map((notification) => (
                    <div key={notification.id} className={`rounded-2xl px-4 py-3 ${softCard}`}>
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

                <Link
                  href="/messages"
                  className="block px-4 py-3 text-sm font-medium text-center text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20"
                >
                  Open messages
                </Link>
              </div>
            )}

            {activeRightPanel === "videos" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-cyan-200">Videos</p>
                  <p className="mt-1 text-xs text-slate-400/90">
                    Trending and recent videos
                  </p>
                </div>

                {latestVideoCards.length === 0 ? (
                  <p className="text-sm text-slate-400">No videos published yet.</p>
                ) : (
                  latestVideoCards.map((video) => (
                    <Link
                      key={video.id}
                      href="/videos"
                      className={`block rounded-2xl p-4 transition hover:bg-white/[0.08] ${softCard}`}
                    >
                      <p className="font-medium text-white">{video.title}</p>
                      <p className="mt-1 text-xs text-slate-400/90">
                        {(video.views_count || 0).toLocaleString()} views
                      </p>
                    </Link>
                  ))
                )}

                <Link
                  href="/videos"
                  className="block px-4 py-3 text-sm font-medium text-center text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20"
                >
                  Open videos page
                </Link>
              </div>
            )}
          </div>
        </aside>
      </main>

      {storyViewerOpen && activeStory && activeStoryGroup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
          <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-[#07111f] shadow-2xl">
            <div className="absolute inset-x-0 top-0 z-10 flex gap-1 px-4 pt-4">
              {activeStoryGroup.stories.map((story, index) => (
                <div key={story.id} className="flex-1 h-1 rounded-full bg-white/20">
                  <div
                    className={`h-1 rounded-full ${
                      index <= activeStoryIndex ? "bg-white" : "bg-transparent"
                    }`}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={closeStoryViewer}
              className="absolute z-20 px-3 py-1 text-sm text-white border rounded-full right-4 top-6 border-white/10 bg-black/30"
            >
              ✕
            </button>

            <div className="relative">
              <img
                src={activeStory.image_url}
                alt={getBestNameForUser(activeStory.user_id)}
                className="h-[72vh] w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

              <button
                type="button"
                onClick={goToPreviousStory}
                className="absolute top-0 left-0 w-1/3 h-full"
                aria-label="Previous story"
              />
              <button
                type="button"
                onClick={goToNextStory}
                className="absolute top-0 right-0 w-1/3 h-full"
                aria-label="Next story"
              />

              <div className="absolute z-10 flex items-center gap-3 pt-4 left-4 top-6">
                <img
                  src={getBestAvatarForUser(activeStory.user_id)}
                  alt={getBestNameForUser(activeStory.user_id)}
                  className="object-cover border h-11 w-11 rounded-2xl border-white/20"
                />
                <div>
                  <p className="font-medium text-white">
                    {getBestNameForUser(activeStory.user_id)}
                  </p>
                  <p className="text-xs text-white/75">
                    {new Date(activeStory.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {activeStory.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-sm leading-7 text-white">{activeStory.caption}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}