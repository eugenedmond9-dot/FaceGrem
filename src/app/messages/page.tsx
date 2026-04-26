"use client";

import Link from "next/link";
import {
  FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

type ProfileRecord = {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url?: string | null;
};

type ConversationRecord = {
  id: string;
  user_one: string;
  user_two: string;
  created_at: string;
  updated_at: string;
};

type MessageRecord = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
};

type ConversationDisplayUser = {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url?: string | null;
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

const uiTranslations = {
  en: {
    loadingMessages: "{t.loadingMessages}",
    brandTagline: "Messages",
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
    signingOut: "Signing out...",
    searchConversations: "Search conversations...",
    searchPeople: "Search people",
    privateChats: "Private chats",
    chats: "Chats",
    focus: "Focus",
    open: "Open",
    idle: "Idle",
    peopleToMessage: "People to message",
    peopleEmpty: "{t.peopleEmpty}",
    conversations: "Conversations",
    activeChats: "active chats",
    noConversations: "{t.noConversations}",
    openConversation: "{t.openConversation}",
    selectConversation: "Select a conversation",
    selectConversationHelp: "{t.selectConversationHelp}",
    openProfile: "Open profile",
    member: "member",
    noMessages: "{t.noMessages}",
    message: "Message",
    writeFirst: "Write a message first.",
    selectFirst: "Select a conversation first.",
    sending: "Sending...",
    send: "Send",
  },
  sw: {
    loadingMessages: "Inapakia ujumbe...",
    brandTagline: "Ujumbe",
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
    logout: "Ondoka",
    signingOut: "Inatoka...",
    searchConversations: "Tafuta mazungumzo...",
    searchPeople: "Tafuta watu",
    privateChats: "Mazungumzo binafsi",
    chats: "Mazungumzo",
    focus: "Umakini",
    open: "Imefunguliwa",
    idle: "Kimya",
    peopleToMessage: "Watu wa kuwatumia ujumbe",
    peopleEmpty: "Anza kuzungumza na watu kutoka kwenye ukurasa wao wa wasifu.",
    conversations: "Mazungumzo",
    activeChats: "mazungumzo hai",
    noConversations: "Hakuna mazungumzo bado.",
    openConversation: "Fungua mazungumzo",
    selectConversation: "Chagua mazungumzo",
    selectConversationHelp: "Fungua chat upande wa kushoto kusoma ujumbe na kuanza mazungumzo.",
    openProfile: "Fungua wasifu",
    member: "mwanachama",
    noMessages: "Hakuna ujumbe bado. Anza mazungumzo.",
    message: "Tuma ujumbe",
    writeFirst: "Andika ujumbe kwanza.",
    selectFirst: "Chagua mazungumzo kwanza.",
    sending: "Inatuma...",
    send: "Tuma",
  },
  fr: {
    loadingMessages: "Chargement des messages...",
    brandTagline: "Messages",
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
    signingOut: "Déconnexion...",
    searchConversations: "Rechercher des conversations...",
    searchPeople: "Rechercher des personnes",
    privateChats: "Chats privés",
    chats: "Chats",
    focus: "Focus",
    open: "Ouvert",
    idle: "Inactif",
    peopleToMessage: "Personnes à contacter",
    peopleEmpty: "Commencez à discuter avec des personnes depuis leur profil.",
    conversations: "Conversations",
    activeChats: "chats actifs",
    noConversations: "Aucune conversation pour le moment.",
    openConversation: "Ouvrir la conversation",
    selectConversation: "Sélectionnez une conversation",
    selectConversationHelp: "Ouvrez un chat à gauche pour lire les messages et commencer la conversation.",
    openProfile: "Ouvrir le profil",
    member: "membre",
    noMessages: "Aucun message pour le moment. Commencez la conversation.",
    message: "Message",
    writeFirst: "Écrivez d’abord un message.",
    selectFirst: "Sélectionnez d’abord une conversation.",
    sending: "Envoi...",
    send: "Envoyer",
  },
  rw: {
    loadingMessages: "Ubutumwa burimo gufunguka...",
    brandTagline: "Ubutumwa",
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
    signingOut: "Birimo gusohoka...",
    searchConversations: "Shakisha ibiganiro...",
    searchPeople: "Shakisha abantu",
    privateChats: "Ibiganiro byihariye",
    chats: "Ibiganiro",
    focus: "Icyerekezo",
    open: "Bifunguye",
    idle: "Biratuje",
    peopleToMessage: "Abantu woherereza ubutumwa",
    peopleEmpty: "Tangira kuganira n’abantu uhereye kuri profile zabo.",
    conversations: "Ibiganiro",
    activeChats: "ibiganiro bikora",
    noConversations: "Nta biganiro birimo ubu.",
    openConversation: "Fungura ikiganiro",
    selectConversation: "Hitamo ikiganiro",
    selectConversationHelp: "Fungura chat ibumoso usome ubutumwa utangire kuganira.",
    openProfile: "Fungura umwirondoro",
    member: "umunyamuryango",
    noMessages: "Nta butumwa burimo ubu. Tangira ikiganiro.",
    message: "Ubutumwa",
    writeFirst: "Banza wandike ubutumwa.",
    selectFirst: "Banza uhitemo ikiganiro.",
    sending: "Birimo koherezwa...",
    send: "Ohereza",
  },
} as const;

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const conversationsRef = useRef<ConversationRecord[]>([]);
  const userIdRef = useRef("");

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");
  const [userAvatar, setUserAvatar] = useState("");
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<TranslationLanguage>("en");
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedUserId = searchParams.get("user") || "";
  const t = uiTranslations[selectedLanguage];

  const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=0f172a&color=ffffff&bold=true`;

  const getProfileById = (profileId?: string) => {
    if (!profileId) return undefined;
    return profiles.find((profile) => profile.id === profileId);
  };

  const getBestAvatarForUser = (uid?: string) => {
    const profile = getProfileById(uid);
    return profile?.avatar_url || getAvatarUrl(profile?.full_name || "FaceGrem User");
  };

  const getConversationPartnerId = (
    conversation: ConversationRecord,
    currentUserId: string
  ) => (conversation.user_one === currentUserId ? conversation.user_two : conversation.user_one);

  const getConversationDisplayUser = (uid: string): ConversationDisplayUser => {
    const profile = getProfileById(uid);

    if (profile) {
      return {
        id: profile.id,
        full_name: profile.full_name || "FaceGrem User",
        username: profile.username || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || null,
      };
    }

    return {
      id: uid,
      full_name: "FaceGrem User",
      username: "",
      bio: "",
      avatar_url: null,
    };
  };

  const sortConversationsByUpdatedAt = (items: ConversationRecord[]) =>
    [...items].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

  const upsertConversation = (conversation: ConversationRecord) => {
    setConversations((prev) => {
      const exists = prev.some((item) => item.id === conversation.id);
      const next = exists
        ? prev.map((item) => (item.id === conversation.id ? conversation : item))
        : [conversation, ...prev];

      return sortConversationsByUpdatedAt(next);
    });
  };

  const upsertMessage = (message: MessageRecord) => {
    setMessages((prev) => {
      const exists = prev.some((item) => item.id === message.id);
      if (exists) return prev;

      return [...prev].concat(message).sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  };

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    const loadMessagesPage = async () => {
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
        { data: profilesData, error: profilesError },
        { data: conversationsData, error: conversationsError },
        { data: notificationsData },
      ] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, bio, avatar_url"),
        supabase
          .from("conversations")
          .select("id, user_one, user_two, created_at, updated_at")
          .or(`user_one.eq.${currentUserId},user_two.eq.${currentUserId}`)
          .order("updated_at", { ascending: false }),
        supabase
          .from("notifications")
          .select("id, user_id, actor_id, type, post_id, actor_name, content, is_read, created_at")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false }),
      ]);

      if (profilesError) {
        alert(profilesError.message);
        setLoading(false);
        return;
      }

      if (conversationsError) {
        alert(conversationsError.message);
        setLoading(false);
        return;
      }

      const allProfiles = profilesData || [];
      const allConversations = conversationsData || [];
      const myProfile = allProfiles.find((profile) => profile.id === currentUserId);

      setProfiles(allProfiles);
      setConversations(sortConversationsByUpdatedAt(allConversations));
      setNotifications(notificationsData || []);

      const conversationIds = allConversations.map((conversation) => conversation.id);

      if (conversationIds.length > 0) {
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select("id, conversation_id, sender_id, content, created_at, is_read")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: true });

        if (messagesError) {
          alert(messagesError.message);
          setLoading(false);
          return;
        }

        setMessages(messagesData || []);
      } else {
        setMessages([]);
      }

      setUserAvatar(
        myProfile?.avatar_url || getAvatarUrl(myProfile?.full_name || currentUserName)
      );
      setLoading(false);
    };

    void loadMessagesPage();
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

  useEffect(() => {
    if (!userId) return;

    const messagesChannel = supabase
      .channel(`messages-realtime-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new as MessageRecord;
          const currentUserId = userIdRef.current;
          const currentConversations = conversationsRef.current;

          const knownConversation = currentConversations.find(
            (conversation) => conversation.id === newMessage.conversation_id
          );

          if (knownConversation) {
            upsertMessage(newMessage);
            upsertConversation({
              ...knownConversation,
              updated_at: newMessage.created_at,
            });
            return;
          }

          const { data: fetchedConversation, error } = await supabase
            .from("conversations")
            .select("id, user_one, user_two, created_at, updated_at")
            .eq("id", newMessage.conversation_id)
            .maybeSingle();

          if (error || !fetchedConversation) return;

          const belongsToUser =
            fetchedConversation.user_one === currentUserId ||
            fetchedConversation.user_two === currentUserId;

          if (!belongsToUser) return;

          upsertConversation({
            ...fetchedConversation,
            updated_at: newMessage.created_at,
          });
          upsertMessage(newMessage);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const updatedMessage = payload.new as MessageRecord;

          setMessages((prev) =>
            prev.map((message) =>
              message.id === updatedMessage.id ? updatedMessage : message
            )
          );
        }
      )
      .subscribe();

    const conversationsChannel = supabase
      .channel(`conversations-realtime-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          const conversation = payload.new as ConversationRecord;
          const currentUserId = userIdRef.current;

          const belongsToUser =
            conversation.user_one === currentUserId ||
            conversation.user_two === currentUserId;

          if (belongsToUser) {
            upsertConversation(conversation);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          const conversation = payload.new as ConversationRecord;
          const currentUserId = userIdRef.current;

          const belongsToUser =
            conversation.user_one === currentUserId ||
            conversation.user_two === currentUserId;

          if (belongsToUser) {
            upsertConversation(conversation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(conversationsChannel);
    };
  }, [userId]);

  const handleLanguageChange = (language: TranslationLanguage) => {
    setSelectedLanguage(language);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("facegrem_language", language);
    }
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

  const selectedConversation = useMemo(() => {
    if (!selectedUserId || !userId) return null;

    return (
      conversations.find((conversation) => {
        const partnerId = getConversationPartnerId(conversation, userId);
        return partnerId === selectedUserId;
      }) || null
    );
  }, [conversations, selectedUserId, userId]);

  const selectedConversationUser = useMemo(() => {
    if (!selectedConversation || !selectedUserId) return null;
    return getConversationDisplayUser(selectedUserId);
  }, [selectedConversation, selectedUserId, profiles]);

  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const partnerId = getConversationPartnerId(conversation, userId);
      const profile = getConversationDisplayUser(partnerId);

      if (!term) return true;

      const haystack =
        `${profile.full_name || ""} ${profile.username || ""} ${profile.bio || ""}`.toLowerCase();

      return haystack.includes(term);
    });
  }, [conversations, searchTerm, userId, profiles]);

  const activeMessages = useMemo(() => {
    if (!selectedConversation) return [];

    return messages.filter(
      (message) => message.conversation_id === selectedConversation.id
    );
  }, [messages, selectedConversation]);

  const recentPeople = useMemo(() => {
    return filteredConversations
      .slice(0, 5)
      .map((conversation) =>
        getConversationDisplayUser(getConversationPartnerId(conversation, userId))
      );
  }, [filteredConversations, userId, profiles]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length, selectedConversation?.id]);

  useEffect(() => {
    const markConversationAsRead = async () => {
      if (!selectedConversation || !userId) return;

      const unreadIncoming = activeMessages.filter(
        (message) => message.sender_id !== userId && !message.is_read
      );

      if (unreadIncoming.length === 0) return;

      const unreadIds = unreadIncoming.map((message) => message.id);

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .in("id", unreadIds);

      if (!error) {
        setMessages((prev) =>
          prev.map((message) =>
            unreadIds.includes(message.id)
              ? { ...message, is_read: true }
              : message
          )
        );
      }
    };

    void markConversationAsRead();
  }, [selectedConversation?.id, userId, activeMessages]);

  const openConversation = (uid: string) => {
    if (!uid) return;
    router.push(`/messages?user=${uid}`);
  };

  const getOrCreateConversation = async (targetUserId: string) => {
    const existingConversation =
      conversations.find((conversation) => {
        const partnerId = getConversationPartnerId(conversation, userId);
        return partnerId === targetUserId;
      }) || null;

    if (existingConversation) {
      return existingConversation;
    }

    const { data: insertedConversation, error: insertError } = await supabase
      .from("conversations")
      .insert([
        {
          user_one: userId,
          user_two: targetUserId,
        },
      ])
      .select("id, user_one, user_two, created_at, updated_at")
      .single();

    if (!insertError && insertedConversation) {
      upsertConversation(insertedConversation);
      return insertedConversation;
    }

    const { data: fallbackConversation, error: fallbackError } = await supabase
      .from("conversations")
      .select("id, user_one, user_two, created_at, updated_at")
      .or(
        `and(user_one.eq.${userId},user_two.eq.${targetUserId}),and(user_one.eq.${targetUserId},user_two.eq.${userId})`
      )
      .maybeSingle();

    if (fallbackError || !fallbackConversation) {
      throw insertError || fallbackError || new Error("Could not create conversation.");
    }

    upsertConversation(fallbackConversation);
    return fallbackConversation;
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      alert(t.selectFirst);
      return;
    }

    const trimmed = messageText.trim();
    if (!trimmed) {
      alert(t.writeFirst);
      return;
    }

    setSending(true);

    try {
      const conversation = await getOrCreateConversation(selectedUserId);

      const { data, error } = await supabase
        .from("messages")
        .insert([
          {
            conversation_id: conversation.id,
            sender_id: userId,
            content: trimmed,
          },
        ])
        .select("id, conversation_id, sender_id, content, created_at, is_read")
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        upsertMessage(data);

        const bumpedConversation: ConversationRecord = {
          ...conversation,
          updated_at: data.created_at,
        };
        upsertConversation(bumpedConversation);

        await supabase
          .from("conversations")
          .update({ updated_at: data.created_at })
          .eq("id", conversation.id);

        await supabase.from("notifications").insert([
          {
            user_id: selectedUserId,
            actor_id: userId,
            type: "message",
            actor_name: userName,
            content: trimmed,
            is_read: false,
          },
        ]);
      }

      setMessageText("");
    } catch (error: any) {
      console.error("Send message error:", error);
      alert(
        error?.message ||
        error?.details ||
        error?.hint ||
        JSON.stringify(error) ||
        "Could not send message."
      );
    } finally {
      setSending(false);
    }
  };


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817] text-white">
        {t.loadingMessages}
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
        <div className="flex items-center gap-3 px-4 py-3 mx-auto max-w-7xl sm:px-6">
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

          <div className="flex-1 min-w-0">
            <div className="max-w-xl mx-auto">
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 shadow-[0_10px_35px_rgba(15,23,42,0.14)] transition focus-within:border-cyan-400/40 sm:px-4 lg:py-3">
                <span className="text-sm text-slate-400">⌕</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.searchConversations}
                  className="w-full text-xs text-white bg-transparent outline-none placeholder:text-slate-400 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
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
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${selectedLanguage === language
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
                className="object-cover w-8 h-8 rounded-xl ring-1 ring-cyan-400/15"
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
                    <div className="px-2 pb-2 mt-2 space-y-1">
                      {(["en", "sw", "fr", "rw"] as TranslationLanguage[]).map((language) => (
                        <button
                          key={language}
                          type="button"
                          onClick={() => handleLanguageChange(language)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${selectedLanguage === language
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
                  className="block w-full px-4 py-3 text-left text-red-100 transition rounded-2xl hover:bg-red-500/10 disabled:opacity-70"
                >
                  ↩️ {signingOut ? t.signingOut : t.logout}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 xl:grid-cols-[260px_320px_minmax(0,1fr)]">
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
                  <p className="text-sm truncate text-slate-400">{t.privateChats}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">{t.chats}</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {conversations.length}
                  </p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">Messages</p>
                  <p className="mt-1 text-sm font-semibold text-white">{messages.length}</p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">{t.focus}</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {selectedConversation ? t.open : t.idle}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-cyan-200">{t.peopleToMessage}</p>
              </div>

              <div className="mt-4 space-y-3">
                {recentPeople.length === 0 ? (
                  <p className="text-sm leading-6 text-slate-400">
                    {t.peopleEmpty}
                  </p>
                ) : (
                  recentPeople.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => openConversation(profile.id)}
                      className="flex items-center w-full gap-3 px-4 py-3 text-left transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                    >
                      <img
                        src={
                          profile.avatar_url ||
                          getAvatarUrl(profile.full_name || "FaceGrem User")
                        }
                        alt={profile.full_name}
                        className="object-cover w-10 h-10 rounded-2xl"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{profile.full_name}</p>
                        <p className="text-xs truncate text-slate-400">
                          @{profile.username || "member"}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        <aside className="rounded-[30px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-cyan-200">{t.conversations}</p>
              <p className="mt-1 text-xs text-slate-400">
                {conversations.length} {t.activeChats}
              </p>
            </div>
          </div>

          <div className="mt-4 xl:hidden">
            <div className="flex items-center gap-3 px-4 py-3 transition border rounded-2xl border-white/10 bg-white/5 focus-within:border-cyan-400/40">
              <span className="text-sm text-slate-400">⌕</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchPeople}
                className="w-full text-sm text-white bg-transparent outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-400">
                {t.noConversations}
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const partnerId = getConversationPartnerId(conversation, userId);
                const profile = getConversationDisplayUser(partnerId);
                const isActive = selectedUserId === partnerId;

                const latestMessage = messages
                  .filter((message) => message.conversation_id === conversation.id)
                  .slice(-1)[0];

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => openConversation(partnerId)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${isActive
                        ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                        : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                      }`}
                  >
                    <img
                      src={profile.avatar_url || getAvatarUrl(profile.full_name)}
                      alt={profile.full_name || "User"}
                      className="object-cover h-11 w-11 rounded-2xl"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{profile.full_name}</p>
                      <p
                        className={`mt-1 truncate text-xs ${isActive ? "text-white/80" : "text-slate-400"
                          }`}
                      >
                        {latestMessage?.content || "{t.openConversation}"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="min-w-0">
          {!selectedUserId || !selectedConversation ? (
            <div className="flex min-h-[620px] items-center justify-center rounded-[30px] border border-white/10 bg-white/5 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl">
              <div className="max-w-md text-center">
                <p className="text-sm font-semibold text-cyan-200">Messages</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                  Select a conversation
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {t.selectConversationHelp}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl">
              <div className="px-5 py-4 border-b border-white/10 sm:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        selectedConversationUser?.avatar_url ||
                        getAvatarUrl(selectedConversationUser?.full_name || "FaceGrem User")
                      }
                      alt={selectedConversationUser?.full_name || "FaceGrem User"}
                      className="object-cover w-12 h-12 rounded-2xl"
                    />
                    <div>
                      <p className="font-semibold text-white">
                        {selectedConversationUser?.full_name || "FaceGrem User"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {selectedConversationUser?.username
                          ? `@${selectedConversationUser.username}`
                          : `FaceGrem ${t.member}`}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/profile?id=${selectedUserId}`}
                    className="px-4 py-2 text-sm transition border rounded-2xl border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10"
                  >
                    Open profile
                  </Link>
                </div>
              </div>

              <div className="min-h-[420px] space-y-4 px-4 py-5 sm:px-6">
                {activeMessages.length === 0 ? (
                  <div className="p-4 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-400">
                    {t.noMessages}
                  </div>
                ) : (
                  activeMessages.map((message) => {
                    const mine = message.sender_id === userId;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div className="flex max-w-[85%] items-end gap-3">
                          {!mine && (
                            <img
                              src={
                                selectedConversationUser?.avatar_url ||
                                getAvatarUrl(
                                  selectedConversationUser?.full_name || "FaceGrem User"
                                )
                              }
                              alt={selectedConversationUser?.full_name || "FaceGrem User"}
                              className="hidden object-cover h-9 w-9 rounded-xl sm:block"
                            />
                          )}

                          <div
                            className={`rounded-[24px] px-4 py-3 text-sm leading-7 ${mine
                                ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                                : "border border-white/10 bg-white/5 text-slate-200"
                              }`}
                          >
                            <p>{message.content}</p>
                            <p
                              className={`mt-2 text-[11px] ${mine ? "text-white/80" : "text-slate-400"
                                }`}
                            >
                              {new Date(message.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={bottomRef} />
              </div>

              <div className="px-4 py-4 border-t border-white/10 sm:px-6">
                <form onSubmit={handleSendMessage}>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={2}
                      placeholder={`${t.message} ${selectedConversationUser?.full_name?.split(" ")[0] || "them"}...`}
                      className="w-full px-4 py-3 text-sm text-white transition border outline-none resize-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                    />

                    <button
                      type="submit"
                      disabled={sending}
                      className="px-6 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
                    >
                      {sending ? t.sending : t.send}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#020817] text-white">
          Loading messages...
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}