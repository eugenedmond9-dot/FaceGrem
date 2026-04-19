"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import ToastContainer, { ToastItem } from "../../components/ToastContainer";

type ProfileRecord = {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url?: string | null;
};

type ConversationRecord = {
  id: string;
  created_at: string;
};

type ParticipantRecord = {
  id: string;
  conversation_id: string;
  user_id: string;
};

type MessageRecord = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string | null;
  content: string;
  created_at: string;
  is_read: boolean;
};

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=0f172a&color=ffffff&bold=true`;

  const getProfileById = (profileId?: string) => {
    if (!profileId) return undefined;
    return profiles.find((profile) => profile.id === profileId);
  };

  const getBestNameForUser = (userId?: string, fallbackName?: string | null) => {
    const profile = getProfileById(userId);
    return profile?.full_name || fallbackName || "FaceGrem User";
  };

  const getBestAvatarForUser = (userId?: string, fallbackName?: string | null) => {
    const profile = getProfileById(userId);
    return (
      profile?.avatar_url ||
      getAvatarUrl(profile?.full_name || fallbackName || "FaceGrem User")
    );
  };

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
        { data: profilesData },
        { data: conversationData },
        { data: participantData },
        { data: messageData },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, username, bio, avatar_url"),
        supabase.from("conversations").select("id, created_at"),
        supabase
          .from("conversation_participants")
          .select("id, conversation_id, user_id"),
        supabase
          .from("messages")
          .select(
            "id, conversation_id, sender_id, sender_name, content, created_at, is_read"
          )
          .order("created_at", { ascending: true }),
      ]);

      setProfiles(profilesData || []);
      setConversations(conversationData || []);
      setParticipants(participantData || []);
      setMessages(messageData || []);

      const userConversationIds = (participantData || [])
        .filter((participant) => participant.user_id === currentUserId)
        .map((participant) => participant.conversation_id);

      const requestedConversationId = searchParams.get("conversation");

      if (
        requestedConversationId &&
        userConversationIds.includes(requestedConversationId)
      ) {
        setSelectedConversationId(requestedConversationId);
      } else if (userConversationIds.length > 0) {
        setSelectedConversationId(userConversationIds[0]);
      }

      setLoading(false);
    };

    void loadMessagesPage();
  }, [router, searchParams]);

  const myConversationIds = useMemo(() => {
    return participants
      .filter((participant) => participant.user_id === userId)
      .map((participant) => participant.conversation_id);
  }, [participants, userId]);

  const myConversations = useMemo(() => {
    return conversations.filter((conversation) =>
      myConversationIds.includes(conversation.id)
    );
  }, [conversations, myConversationIds]);

  const selectedMessages = useMemo(() => {
    return messages.filter(
      (message) => message.conversation_id === selectedConversationId
    );
  }, [messages, selectedConversationId]);

  const unreadCount = useMemo(() => {
    return messages.filter(
      (message) =>
        myConversationIds.includes(message.conversation_id) &&
        message.sender_id !== userId &&
        !message.is_read
    ).length;
  }, [messages, myConversationIds, userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const incomingMessage = payload.new as MessageRecord;

          setMessages((prev) => {
            const alreadyExists = prev.some(
              (message) => message.id === incomingMessage.id
            );
            if (alreadyExists) return prev;
            return [...prev, incomingMessage];
          });

          const belongsToMyConversation = myConversationIds.includes(
            incomingMessage.conversation_id
          );
          const belongsToSelectedConversation =
            incomingMessage.conversation_id === selectedConversationId;
          const isIncoming = incomingMessage.sender_id !== userId;

          if (belongsToMyConversation && isIncoming) {
            const senderName = getBestNameForUser(
              incomingMessage.sender_id,
              incomingMessage.sender_name
            );

            setToasts((prev) => [
              {
                id: incomingMessage.id,
                title: "New message",
                message: `${senderName}: ${incomingMessage.content}`,
                href: `/messages?conversation=${incomingMessage.conversation_id}`,
              },
              ...prev,
            ]);
          }

          if (
            belongsToSelectedConversation &&
            isIncoming &&
            !incomingMessage.is_read
          ) {
            void markMessageAsRead(incomingMessage.id);
          }
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

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, selectedConversationId, myConversationIds, profiles]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const getConversationUnreadCount = (conversationId: string) => {
    return messages.filter(
      (message) =>
        message.conversation_id === conversationId &&
        message.sender_id !== userId &&
        !message.is_read
    ).length;
  };

  const getOtherParticipantId = (conversationId: string) => {
    const conversationPeople = participants.filter(
      (participant) => participant.conversation_id === conversationId
    );

    return (
      conversationPeople.find((participant) => participant.user_id !== userId)
        ?.user_id || ""
    );
  };

  const markMessageAsRead = async (messageId: string) => {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("id", messageId);

    if (!error) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? { ...message, is_read: true } : message
        )
      );
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    if (!userId) return;

    const unreadIncoming = messages.filter(
      (message) =>
        message.conversation_id === conversationId &&
        message.sender_id !== userId &&
        !message.is_read
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

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    await markConversationAsRead(conversationId);
  };

  const startConversation = async (targetUserId: string) => {
    if (!userId || userId === targetUserId) return;

    setStartingChatId(targetUserId);

    const existingConversation = myConversations.find((conversation) => {
      const conversationPeople = participants
        .filter((participant) => participant.conversation_id === conversation.id)
        .map((participant) => participant.user_id);

      return (
        conversationPeople.includes(userId) &&
        conversationPeople.includes(targetUserId) &&
        conversationPeople.length === 2
      );
    });

    if (existingConversation) {
      await handleSelectConversation(existingConversation.id);
      setStartingChatId(null);
      return;
    }

    const { data: newConversationData, error: conversationError } =
      await supabase
        .from("conversations")
        .insert([{}])
        .select("id, created_at");

    if (
      conversationError ||
      !newConversationData ||
      newConversationData.length === 0
    ) {
      alert(conversationError?.message || "Failed to create conversation.");
      setStartingChatId(null);
      return;
    }

    const conversationId = newConversationData[0].id;

    const { data: newParticipants, error: participantsError } = await supabase
      .from("conversation_participants")
      .insert([
        { conversation_id: conversationId, user_id: userId },
        { conversation_id: conversationId, user_id: targetUserId },
      ])
      .select("id, conversation_id, user_id");

    if (participantsError) {
      alert(participantsError.message);
      setStartingChatId(null);
      return;
    }

    setConversations((prev) => [newConversationData[0], ...prev]);
    setParticipants((prev) => [...prev, ...(newParticipants || [])]);
    setSelectedConversationId(conversationId);
    setStartingChatId(null);
  };

  const sendMessage = async () => {
    if (!selectedConversationId || !newMessage.trim() || !userId) return;

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: selectedConversationId,
          sender_id: userId,
          sender_name: getBestNameForUser(userId, userName),
          content: newMessage.trim(),
          is_read: false,
        },
      ])
      .select(
        "id, conversation_id, sender_id, sender_name, content, created_at, is_read"
      );

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setMessages((prev) => {
        const exists = prev.some((message) => message.id === data[0].id);
        if (exists) return prev;
        return [...prev, data[0]];
      });
      setNewMessage("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        Loading messages...
      </div>
    );
  }

  const selectedOtherUserId = selectedConversationId
    ? getOtherParticipantId(selectedConversationId)
    : "";

  const selectedOtherProfile = getProfileById(selectedOtherUserId);

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10 bg-[#07111f]/85 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center font-bold shadow-lg h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/20">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FaceGrem</h1>
              <p className="text-xs text-slate-400">Direct messages</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-200">
              Unread: {unreadCount}
            </div>
            <Link
              href="/feed"
              className="px-4 py-2 text-sm font-medium transition border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Back to Feed
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)_300px]">
        <aside className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-sm font-medium text-slate-300">Your conversations</p>
            <div className="mt-4 space-y-3">
              {myConversations.length === 0 ? (
                <p className="text-sm text-slate-400">No conversations yet.</p>
              ) : (
                myConversations.map((conversation) => {
                  const otherUserId = getOtherParticipantId(conversation.id);
                  const otherProfile = getProfileById(otherUserId);
                  const conversationUnreadCount =
                    getConversationUnreadCount(conversation.id);

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => void handleSelectConversation(conversation.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        selectedConversationId === conversation.id
                          ? "border-cyan-400/30 bg-cyan-400/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={getBestAvatarForUser(otherUserId, otherProfile?.full_name)}
                            alt={otherProfile?.full_name || "FaceGrem User"}
                            className="object-cover h-11 w-11 rounded-2xl"
                          />
                          <div>
                            <p className="font-medium text-white">
                              {otherProfile?.full_name || "FaceGrem User"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {otherProfile?.username
                                ? `@${otherProfile.username}`
                                : "Direct chat"}
                            </p>
                          </div>
                        </div>

                        {conversationUnreadCount > 0 && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-400 text-slate-900">
                            {conversationUnreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex h-full min-h-[600px] flex-col">
            <div className="pb-4 border-b border-white/10">
              {selectedConversationId ? (
                <div className="flex items-center gap-3">
                  <img
                    src={getBestAvatarForUser(
                      selectedOtherUserId,
                      selectedOtherProfile?.full_name
                    )}
                    alt={selectedOtherProfile?.full_name || "Conversation"}
                    className="object-cover w-12 h-12 rounded-2xl"
                  />
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {selectedOtherProfile?.full_name || "Conversation"}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {selectedOtherProfile?.username
                        ? `@${selectedOtherProfile.username}`
                        : "Direct chat"}
                    </p>
                  </div>
                </div>
              ) : (
                <h2 className="text-xl font-semibold text-white">
                  Select a conversation
                </h2>
              )}
            </div>

            <div className="flex-1 py-5 space-y-4 overflow-y-auto">
              {!selectedConversationId ? (
                <p className="text-sm text-slate-400">
                  Select a conversation from the left or start one from the right.
                </p>
              ) : selectedMessages.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No messages yet. Start the conversation.
                </p>
              ) : (
                selectedMessages.map((message) => {
                  const isMine = message.sender_id === userId;
                  const senderName = isMine
                    ? "You"
                    : getBestNameForUser(message.sender_id, message.sender_name);
                  const senderAvatar = getBestAvatarForUser(
                    message.sender_id,
                    message.sender_name
                  );

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isMine && (
                        <img
                          src={senderAvatar}
                          alt={senderName}
                          className="object-cover w-10 h-10 rounded-2xl"
                        />
                      )}

                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                          isMine
                            ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white"
                            : "bg-white/10 text-slate-100"
                        }`}
                      >
                        <p className="text-sm font-semibold">{senderName}</p>
                        <p className="mt-1 text-sm">{message.content}</p>
                        <p className="mt-2 text-xs opacity-70">
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                      </div>

                      {isMine && (
                        <img
                          src={getBestAvatarForUser(userId, userName)}
                          alt="You"
                          className="object-cover w-10 h-10 rounded-2xl"
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-3 pt-4 mt-4 border-t border-white/10">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
              />
              <button
                onClick={sendMessage}
                className="px-5 py-3 text-sm font-semibold text-white rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600"
              >
                Send
              </button>
            </div>
          </div>
        </section>

        <aside>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-sm font-medium text-slate-300">Start a new chat</p>
            <div className="mt-4 space-y-4">
              {profiles
                .filter((profile) => profile.id !== userId)
                .slice(0, 8)
                .map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <Link
                      href={`/profile?id=${profile.id}`}
                      className="flex items-center gap-3 hover:opacity-90"
                    >
                      <img
                        src={getBestAvatarForUser(profile.id, profile.full_name)}
                        alt={profile.full_name || "FaceGrem User"}
                        className="object-cover w-10 h-10 rounded-2xl"
                      />
                      <div>
                        <p className="text-sm font-medium text-white">
                          {profile.full_name || "FaceGrem User"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {profile.username ? `@${profile.username}` : "@user"}
                        </p>
                      </div>
                    </Link>

                    <button
                      onClick={() => void startConversation(profile.id)}
                      disabled={startingChatId === profile.id}
                      className="px-3 py-2 text-xs font-semibold bg-white rounded-xl text-slate-900 disabled:opacity-70"
                    >
                      {startingChatId === profile.id ? "..." : "Message"}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </aside>
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}