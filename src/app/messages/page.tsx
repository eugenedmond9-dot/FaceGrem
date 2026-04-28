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
import { useLanguage } from "../../components/LanguageProvider";
import NotificationDropdown from "../../components/NotificationDropdown";

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

type IncomingCallState = {
  callerId: string;
  callerName: string;
  callType: "audio" | "video";
  callId: string;
  offer: RTCSessionDescriptionInit;
  notificationId?: string;
};

type CallSignalRecord = {
  id: string;
  call_id: string;
  sender_id: string;
  receiver_id: string;
  type: "offer" | "answer" | "ice" | "end" | "decline";
  payload: any;
  created_at: string;
};

const languageLabels: Record<TranslationLanguage, string> = {
  en: "English",
  sw: "Swahili",
  fr: "French",
  rw: "Kinyarwanda",
};

/* Page text now comes from the shared FaceGrem language provider. */

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const conversationsRef = useRef<ConversationRecord[]>([]);
  const userIdRef = useRef("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceMimeTypeRef = useRef("audio/webm");
  const callStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const callIdRef = useRef("");
  const callTargetIdRef = useRef("");

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");
  const [userAvatar, setUserAvatar] = useState("");
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [voiceUploading, setVoiceUploading] = useState(false);
  const [activeCallType, setActiveCallType] = useState<"audio" | "video" | null>(null);
  const [callError, setCallError] = useState("");
  const [incomingCall, setIncomingCall] = useState<IncomingCallState | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [activeCallTargetId, setActiveCallTargetId] = useState("");
  const [callStatus, setCallStatus] = useState("");
  const [remoteStreamReady, setRemoteStreamReady] = useState(false);

  const selectedUserId = searchParams.get("user") || "";
  const { language: selectedLanguage, setLanguage: setSelectedLanguage, t } = useLanguage();

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

  const getSupportedVoiceMimeType = () => {
    if (typeof MediaRecorder === "undefined") return "";

    const options = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/mpeg",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];

    return options.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  };

  const getVoiceFileExtension = (mimeType: string) => {
    if (mimeType.includes("mp4")) return "m4a";
    if (mimeType.includes("mpeg")) return "mp3";
    if (mimeType.includes("ogg")) return "ogg";
    return "webm";
  };

  const buildVoiceMessageContent = (audioUrl: string) =>
    `__voice_note__|${audioUrl}`;

  const parseVoiceMessageContent = (content: string) => {
    if (!content.startsWith("__voice_note__|")) return null;
    const [, audioUrl] = content.split("|");
    return audioUrl || null;
  };

  const getMessagePreview = (content?: string) => {
    if (!content) return t.openConversation;
    return parseVoiceMessageContent(content) ? `🎙️ ${t.voiceMessage}` : content;
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

  useEffect(() => {
    if (!userId) return;

    const notificationsChannel = supabase
      .channel(`message-page-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as NotificationRecord;
          setNotifications((prev) => {
            if (prev.some((item) => item.id === notification.id)) return prev;
            return [notification, ...prev];
          });

          // Incoming call UI is handled through call_signals offers so it has the WebRTC offer.
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const callSignalsChannel = supabase
      .channel(`message-call-signals-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_signals",
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          const signal = payload.new as CallSignalRecord;

          if (signal.sender_id === userId) return;

          if (signal.type === "offer") {
            const callerProfile = getProfileById(signal.sender_id);

            setIncomingCall({
              callerId: signal.sender_id,
              callerName:
                callerProfile?.full_name ||
                signal.payload?.callerName ||
                "FaceGrem User",
              callType: signal.payload?.callType === "video" ? "video" : "audio",
              callId: signal.call_id,
              offer: signal.payload?.offer,
            });

            return;
          }

          if (signal.type === "answer") {
            if (
              peerConnectionRef.current &&
              callIdRef.current === signal.call_id &&
              signal.payload?.answer
            ) {
              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(signal.payload.answer)
              );
              setCallStatus(t.connected);
            }

            return;
          }

          if (signal.type === "ice") {
            if (
              peerConnectionRef.current &&
              callIdRef.current === signal.call_id &&
              signal.payload
            ) {
              try {
                await peerConnectionRef.current.addIceCandidate(
                  new RTCIceCandidate(signal.payload)
                );
              } catch {
                // ICE candidates can arrive before descriptions are fully ready.
              }
            }

            return;
          }

          if (signal.type === "decline" || signal.type === "end") {
            if (callIdRef.current === signal.call_id) {
              await stopCurrentCall(false);
              setCallStatus(signal.type === "decline" ? t.callDeclined : t.callEnded);
            }

            setIncomingCall((prev) =>
              prev?.callId === signal.call_id ? null : prev
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(callSignalsChannel);
    };
  }, [userId, profiles, selectedLanguage]);

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

  const createCallId = () =>
    `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const stopCurrentCall = async (sendSignal = true) => {
    const targetUserId = callTargetIdRef.current;
    const callId = callIdRef.current;

    if (sendSignal && targetUserId && callId) {
      await supabase.from("call_signals").insert([
        {
          call_id: callId,
          sender_id: userId,
          receiver_id: targetUserId,
          type: "end",
          payload: {},
        },
      ]);
    }

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    callStreamRef.current?.getTracks().forEach((track) => track.stop());
    callStreamRef.current = null;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    callIdRef.current = "";
    callTargetIdRef.current = "";
    setActiveCallType(null);
    setActiveCallTargetId("");
    setRemoteStreamReady(false);
    setCallStatus("");
    setCallError("");
  };

  const createPeerConnection = (targetUserId: string, callId: string) => {
    peerConnectionRef.current?.close();

    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.onicecandidate = async (event) => {
      if (!event.candidate) return;

      await supabase.from("call_signals").insert([
        {
          call_id: callId,
          sender_id: userId,
          receiver_id: targetUserId,
          type: "ice",
          payload: event.candidate.toJSON(),
        },
      ]);
    };

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;

      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }

      setRemoteStreamReady(true);
      setCallStatus(t.connected);
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;

      if (state === "connected") {
        setCallStatus(t.connected);
      }

      if (state === "failed" || state === "disconnected" || state === "closed") {
        setCallStatus(state === "failed" ? t.callFailed : t.callEnded);
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  const startLocalMedia = async (type: "audio" | "video", peerConnection: RTCPeerConnection) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: true,
      },
      video: type === "video",
    });

    callStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    return stream;
  };

  const notifyCaller = async (
    callerId: string,
    type: "call_accepted" | "call_declined",
    content: string
  ) => {
    if (!callerId || !userId) return;

    await supabase.from("notifications").insert([
      {
        user_id: callerId,
        actor_id: userId,
        type,
        actor_name: userName,
        content,
        is_read: false,
      },
    ]);
  };

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

  const sendMessageContent = async (content: string) => {
    if (!selectedUserId) {
      alert(t.selectFirst);
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      alert(t.writeFirst);
      return;
    }

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
          content: parseVoiceMessageContent(trimmed) ? t.voiceMessage : trimmed,
          is_read: false,
        },
      ]);
    }
  };

  const handleStartCall = async (
    type: "audio" | "video",
    targetUserId = selectedUserId
  ) => {
    if (!targetUserId) {
      alert(t.selectFirst);
      return;
    }

    const callId = createCallId();

    setCallError("");
    setCallStatus(t.connecting);
    setActiveCallType(type);
    setActiveCallTargetId(targetUserId);
    setRemoteStreamReady(false);

    callIdRef.current = callId;
    callTargetIdRef.current = targetUserId;

    try {
      const peerConnection = createPeerConnection(targetUserId, callId);
      await startLocalMedia(type, peerConnection);

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      await supabase.from("call_signals").insert([
        {
          call_id: callId,
          sender_id: userId,
          receiver_id: targetUserId,
          type: "offer",
          payload: {
            offer,
            callType: type,
            callerName: userName,
          },
        },
      ]);

      await supabase.from("notifications").insert([
        {
          user_id: targetUserId,
          actor_id: userId,
          type: type === "video" ? "video_call" : "audio_call",
          actor_name: userName,
          content: type === "video" ? t.videoCall : t.audioCall,
          is_read: false,
        },
      ]);
    } catch (error) {
      setCallError(error instanceof Error ? error.message : t.callPermission);
      setCallStatus(t.callFailed);
    }
  };

  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return;

    const call = incomingCall;
    setIncomingCall(null);
    router.push(`/messages?user=${call.callerId}`);

    setCallError("");
    setCallStatus(t.connecting);
    setActiveCallType(call.callType);
    setActiveCallTargetId(call.callerId);
    setRemoteStreamReady(false);

    callIdRef.current = call.callId;
    callTargetIdRef.current = call.callerId;

    try {
      const peerConnection = createPeerConnection(call.callerId, call.callId);
      await startLocalMedia(call.callType, peerConnection);

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(call.offer)
      );

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      await supabase.from("call_signals").insert([
        {
          call_id: call.callId,
          sender_id: userId,
          receiver_id: call.callerId,
          type: "answer",
          payload: { answer },
        },
      ]);

      await notifyCaller(call.callerId, "call_accepted", t.callStarted);
    } catch (error) {
      setCallError(error instanceof Error ? error.message : t.callPermission);
      setCallStatus(t.callFailed);
      await stopCurrentCall(false);
    }
  };

  const handleDeclineIncomingCall = async () => {
    if (!incomingCall) return;

    const call = incomingCall;
    setIncomingCall(null);

    await supabase.from("call_signals").insert([
      {
        call_id: call.callId,
        sender_id: userId,
        receiver_id: call.callerId,
        type: "decline",
        payload: {},
      },
    ]);

    await notifyCaller(call.callerId, "call_declined", t.callDeclined);
  };

  const handleEndCall = async () => {
    await stopCurrentCall(true);
  };

  const handleStartVoiceRecording = async () => {
    if (!selectedUserId) {
      alert(t.selectFirst);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });

      mediaRecorderRef.current = null;
      voiceChunksRef.current = [];
      setMicLevel(0);

      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;

        if (AudioContextClass) {
          const audioContext = new AudioContextClass();
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          analyser.fftSize = 256;
          source.connect(analyser);

          const updateMicLevel = () => {
            if (mediaRecorderRef.current?.state === "inactive") {
              void audioContext.close();
              setMicLevel(0);
              return;
            }

            analyser.getByteTimeDomainData(dataArray);
            const average =
              dataArray.reduce((sum, value) => sum + Math.abs(value - 128), 0) /
              dataArray.length;

            setMicLevel(Math.min(100, Math.round(average * 4)));
            requestAnimationFrame(updateMicLevel);
          };

          updateMicLevel();
        }
      } catch {
        setMicLevel(0);
      }

      const mimeType = getSupportedVoiceMimeType();
      voiceMimeTypeRef.current = mimeType || "audio/webm";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const chunks = voiceChunksRef.current.filter((chunk) => chunk.size > 0);
        const audioBlob = new Blob(chunks, {
          type: voiceMimeTypeRef.current || recorder.mimeType || "audio/webm",
        });

        if (audioBlob.size === 0) {
          alert(t.voiceUploadError);
          setRecordingVoice(false);
          return;
        }

        setVoiceUploading(true);

        try {
          const extension = getVoiceFileExtension(audioBlob.type);
          const filePath = `${userId}/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from("voice-messages")
            .upload(filePath, audioBlob, {
              contentType: audioBlob.type || "audio/webm",
              upsert: false,
            });

          if (uploadError) {
            throw uploadError;
          }

          const { data } = supabase.storage
            .from("voice-messages")
            .getPublicUrl(filePath);

          await sendMessageContent(buildVoiceMessageContent(data.publicUrl));
        } catch (error) {
          alert(error instanceof Error ? error.message : t.voiceUploadError);
        } finally {
          setVoiceUploading(false);
          setRecordingVoice(false);
          voiceChunksRef.current = [];
          setMicLevel(0);
        }
      };

      recorder.start(250);
      setRecordingVoice(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : t.voiceUploadError);
    }
  };

  const handleStopVoiceRecording = () => {
    if (mediaRecorderRef.current && recordingVoice) {
      try {
        mediaRecorderRef.current.requestData();
      } catch {
        // Some browsers do not support requestData in every state.
      }

      mediaRecorderRef.current.stop();
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();

    const trimmed = messageText.trim();
    if (!trimmed) {
      alert(t.writeFirst);
      return;
    }

    setSending(true);

    try {
      await sendMessageContent(trimmed);
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

          <div className="min-w-0 flex-1">
            <div className="mx-auto max-w-xl">
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 shadow-[0_10px_35px_rgba(15,23,42,0.14)] transition focus-within:border-cyan-400/40 sm:px-4 lg:py-3">
                <span className="text-sm text-slate-400">⌕</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.searchConversations}
                  className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-400 sm:text-sm"
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
            </div>

            <div className="mt-8 border-t border-white/10 pt-5">
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

      {incomingCall && (
        <div className="fixed inset-x-4 top-24 z-[80] mx-auto max-w-md rounded-[30px] border border-white/10 bg-[#07111f]/95 p-5 text-white shadow-2xl backdrop-blur-2xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-2xl">
              {incomingCall.callType === "video" ? "🎥" : "📞"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-cyan-200">
                {incomingCall.callType === "video" ? t.incomingVideoCall : t.incomingAudioCall}
              </p>
              <h3 className="mt-1 truncate text-lg font-bold text-white">
                {incomingCall.callerName} {t.isCallingYou}
              </h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                {t.callPermission}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDeclineIncomingCall}
              className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
            >
              {t.decline}
            </button>
            <button
              type="button"
              onClick={handleAcceptIncomingCall}
              className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
            >
              {t.accept}
            </button>
          </div>
        </div>
      )}

      <main className="relative mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl gap-4 px-3 py-4 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[260px_320px_minmax(0,1fr)] xl:gap-6">
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

        <aside className={`${selectedConversation ? "hidden lg:block" : "block"} rounded-[30px] border border-white/[0.07] bg-white/[0.035] p-4 shadow-[0_20px_60px_rgba(15,23,42,0.30)] backdrop-blur-2xl sm:p-5`}>
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

          <div className="mt-5 max-h-[calc(100vh-240px)] space-y-3 overflow-y-auto pr-1">
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
                    className={`flex w-full items-center gap-3 rounded-[22px] px-3.5 py-3 text-left transition ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                        : "border border-white/[0.07] bg-white/[0.035] text-slate-200 hover:bg-white/[0.06]"
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
                        className={`mt-1 truncate text-xs ${
                          isActive ? "text-white/80" : "text-slate-400"
                        }`}
                      >
                        {getMessagePreview(latestMessage?.content)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className={`${!selectedConversation ? "hidden lg:block" : "block"} min-w-0`}>
          {!selectedUserId || !selectedConversation ? (
            <div className="flex min-h-[620px] items-center justify-center rounded-[34px] border border-white/[0.07] bg-white/[0.035] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
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
            <div className="overflow-hidden rounded-[30px] border border-white/[0.07] bg-white/[0.035] shadow-[0_22px_70px_rgba(2,8,23,0.32)] backdrop-blur-2xl sm:rounded-[34px]">
              <div className="border-b border-white/[0.07] bg-[#07111f]/35 px-4 py-3 backdrop-blur-2xl sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => router.push("/messages")}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-white transition hover:bg-white/[0.06] lg:hidden"
                      aria-label="Back to conversations"
                    >
                      ←
                    </button>

                    <img
                      src={
                        selectedConversationUser?.avatar_url ||
                        getAvatarUrl(selectedConversationUser?.full_name || "FaceGrem User")
                      }
                      alt={selectedConversationUser?.full_name || "FaceGrem User"}
                      className="h-11 w-11 rounded-2xl object-cover ring-1 ring-cyan-400/15 sm:h-12 sm:w-12"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {selectedConversationUser?.full_name || "FaceGrem User"}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {selectedConversationUser?.username
                          ? `@${selectedConversationUser.username} • ${t.online}`
                          : `FaceGrem ${t.member} • ${t.online}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartCall("audio")}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-base text-slate-200 transition hover:bg-white/[0.06] sm:w-auto sm:px-3 sm:text-sm"
                      title={t.audioCall}
                    >
                      📞 <span className="ml-2 hidden sm:inline">{t.audioCall}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartCall("video")}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-base text-slate-200 transition hover:bg-white/[0.06] sm:w-auto sm:px-3 sm:text-sm"
                      title={t.videoCall}
                    >
                      🎥 <span className="ml-2 hidden sm:inline">{t.videoCall}</span>
                    </button>
                    <Link
                      href={`/profile?id=${selectedUserId}`}
                      className="hidden rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-sm text-cyan-300 transition hover:bg-white/[0.06] sm:inline-flex"
                    >
                      {t.openProfile}
                    </Link>
                  </div>
                </div>
              </div>

              {activeCallType && (
                <div className="border-b border-white/[0.07] bg-black/20 px-4 py-4 sm:px-6">
                  <div className="rounded-[26px] border border-white/[0.07] bg-white/[0.035] p-4 backdrop-blur-2xl">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-cyan-200">
                          {activeCallType === "video" ? t.videoCall : t.audioCall}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {callError || t.callPermission}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleEndCall}
                        className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20"
                      >
                        {t.endCall}
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-medium text-slate-400">
                          {t.localPreview}
                        </p>
                        {activeCallType === "video" ? (
                          <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="h-56 w-full rounded-2xl bg-black object-cover"
                          />
                        ) : (
                          <div className="flex h-32 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-sm text-slate-300">
                            🎙️ {t.micActive}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-medium text-slate-400">
                          {t.remoteVideo}
                        </p>
                        <video
                          ref={remoteVideoRef}
                          autoPlay
                          playsInline
                          className="h-56 w-full rounded-2xl bg-black object-cover"
                        />
                        {!remoteStreamReady && (
                          <p className="mt-2 text-xs text-slate-400">
                            {callStatus || t.connecting}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="max-h-[calc(100vh-280px)] min-h-[520px] space-y-2.5 overflow-y-auto px-4 py-4 sm:space-y-3 sm:px-6">
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
                        <div className="flex max-w-[82%] items-end gap-2 sm:max-w-[62%] sm:gap-3">
                          {!mine && (
                            <img
                              src={
                                selectedConversationUser?.avatar_url ||
                                getAvatarUrl(
                                  selectedConversationUser?.full_name || "FaceGrem User"
                                )
                              }
                              alt={selectedConversationUser?.full_name || "FaceGrem User"}
                              className="hidden h-8 w-8 rounded-xl object-cover sm:block"
                            />
                          )}

                          <div
                            className={`rounded-[20px] px-3 py-2 text-[13px] leading-5 shadow-[0_10px_22px_rgba(2,8,23,0.14)] sm:px-3.5 sm:py-2.5 break-words sm:text-sm sm:leading-6 ${
                              mine
                                ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                                : "border border-white/10 bg-white/5 text-slate-200"
                            }`}
                          >
                            {parseVoiceMessageContent(message.content) ? (
                              <div className="min-w-[180px] max-w-[260px]">
                                <p className="mb-2 text-xs font-medium opacity-85">
                                  🎙️ {t.voiceMessage}
                                </p>
                                <audio
                                  controls
                                  src={parseVoiceMessageContent(message.content) || undefined}
                                  className="h-8 w-full"
                                />
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            )}
                            <p
                              className={`mt-1 text-[10px] leading-none ${
                                mine ? "text-white/80" : "text-slate-400"
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

              <div className="border-t border-white/[0.07] bg-[#07111f]/45 px-4 py-4 backdrop-blur-2xl sm:px-6">
                <form onSubmit={handleSendMessage}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex gap-2 sm:flex-col">
                      <button
                        type="button"
                        onClick={recordingVoice ? handleStopVoiceRecording : handleStartVoiceRecording}
                        disabled={voiceUploading}
                        className={`rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:opacity-70 ${
                          recordingVoice
                            ? "border border-red-400/20 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                            : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                        }`}
                      >
                        {voiceUploading
                          ? t.sending
                          : recordingVoice
                          ? `⏹️ ${t.stop}`
                          : `🎙️ ${t.voiceRecord}`}
                      </button>

                      {(recordingVoice || voiceUploading) && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
                          <div className="flex items-center justify-between gap-3">
                            <span>{recordingVoice ? t.micActive : t.sending}</span>
                            <span>{micLevel}%</span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-cyan-400 transition-all"
                              style={{ width: `${micLevel}%` }}
                            />
                          </div>
                          <p className="mt-2 leading-5 text-slate-400">{t.recordingTip}</p>
                        </div>
                      )}
                    </div>

                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={2}
                      placeholder={`${t.message} ${selectedConversationUser?.full_name?.split(" ")[0] || "them"}...`}
                      className="max-h-32 w-full resize-none rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-400/40"
                    />

                    <button
                      type="submit"
                      disabled={sending}
                      className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:opacity-70"
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