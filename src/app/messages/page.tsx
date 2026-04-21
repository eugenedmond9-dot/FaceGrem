"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

type ProfileRecord = {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url?: string | null;
};

type MessageRecord = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedUserId = searchParams.get("user") || "";

  const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=0f172a&color=ffffff&bold=true`;

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

      const [{ data: profilesData }, { data: messagesData }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, bio, avatar_url"),
        supabase
          .from("messages")
          .select("id, sender_id, receiver_id, content, created_at")
          .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
          .order("created_at", { ascending: true }),
      ]);

      setProfiles(profilesData || []);
      setMessages(messagesData || []);
      setLoading(false);
    };

    void loadMessagesPage();
  }, [router]);

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

  const conversationUserIds = useMemo(() => {
    const ids = new Set<string>();

    for (const message of messages) {
      if (message.sender_id === userId && message.receiver_id !== userId) {
        ids.add(message.receiver_id);
      }
      if (message.receiver_id === userId && message.sender_id !== userId) {
        ids.add(message.sender_id);
      }
    }

    return Array.from(ids);
  }, [messages, userId]);

  const filteredConversationUserIds = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return conversationUserIds;

    return conversationUserIds.filter((uid) => {
      const profile = getProfileById(uid);
      const haystack = `${profile?.full_name || ""} ${profile?.username || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [conversationUserIds, searchTerm, profiles]);

  const selectedConversationUser = useMemo(() => {
    if (!selectedUserId) return null;
    return getProfileById(selectedUserId) || null;
  }, [selectedUserId, profiles]);

  const activeMessages = useMemo(() => {
    if (!selectedUserId) return [];

    return messages.filter(
      (message) =>
        (message.sender_id === userId && message.receiver_id === selectedUserId) ||
        (message.sender_id === selectedUserId && message.receiver_id === userId)
    );
  }, [messages, selectedUserId, userId]);

  const openConversation = (uid: string) => {
    router.push(`/messages?user=${uid}`);
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      alert("Select a conversation first.");
      return;
    }

    const trimmed = messageText.trim();
    if (!trimmed) {
      alert("Write a message first.");
      return;
    }

    setSending(true);

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          sender_id: userId,
          receiver_id: selectedUserId,
          content: trimmed,
        },
      ])
      .select("id, sender_id, receiver_id, content, created_at");

    setSending(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setMessages((prev) => [...prev, data[0]]);
    }

    setMessageText("");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10 bg-[#07111f]/85 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center font-bold shadow-lg h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/20">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FaceGrem</h1>
              <p className="text-xs text-slate-400">Messages</p>
            </div>
          </div>

          <Link
            href="/feed"
            className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
          >
            Back to Feed
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <p className="text-sm font-medium text-cyan-200">Conversations</p>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search people"
            className="w-full px-4 py-3 mt-4 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
          />

          <div className="mt-5 space-y-3">
            {filteredConversationUserIds.length === 0 ? (
              <div className="p-4 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-400">
                No conversations yet.
              </div>
            ) : (
              filteredConversationUserIds.map((uid) => {
                const profile = getProfileById(uid);
                const isActive = selectedUserId === uid;

                return (
                  <button
                    key={uid}
                    type="button"
                    onClick={() => openConversation(uid)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white"
                        : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    <img
                      src={getBestAvatarForUser(uid)}
                      alt={profile?.full_name || "User"}
                      className="object-cover h-11 w-11 rounded-2xl"
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {profile?.full_name || "FaceGrem User"}
                      </p>
                      <p
                        className={`truncate text-xs ${
                          isActive ? "text-white/80" : "text-slate-400"
                        }`}
                      >
                        {profile?.username ? `@${profile.username}` : "Conversation"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          {!selectedUserId || !selectedConversationUser ? (
            <div className="flex h-full min-h-[520px] items-center justify-center rounded-[24px] border border-white/10 bg-white/5 p-8 text-center">
              <div>
                <p className="text-sm font-medium text-cyan-200">Messages</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Select a conversation
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Open a chat from the left side to read and send messages.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[520px] flex-col">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <img
                  src={getBestAvatarForUser(selectedUserId)}
                  alt={selectedConversationUser.full_name}
                  className="object-cover w-12 h-12 rounded-2xl"
                />
                <div>
                  <p className="font-semibold text-white">
                    {selectedConversationUser.full_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {selectedConversationUser.username
                      ? `@${selectedConversationUser.username}`
                      : "FaceGrem member"}
                  </p>
                </div>
              </div>

              <div className="flex-1 mt-5 space-y-4">
                {activeMessages.length === 0 ? (
                  <div className="p-4 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-400">
                    No messages yet. Start the conversation.
                  </div>
                ) : (
                  activeMessages.map((message) => {
                    const mine = message.sender_id === userId;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-[24px] px-4 py-3 text-sm leading-7 ${
                            mine
                              ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white"
                              : "border border-white/10 bg-white/5 text-slate-200"
                          }`}
                        >
                          <p>{message.content}</p>
                          <p
                            className={`mt-2 text-[11px] ${
                              mine ? "text-white/80" : "text-slate-400"
                            }`}
                          >
                            {new Date(message.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendMessage} className="pt-4 mt-5 border-t border-white/10">
                <div className="flex gap-3">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={2}
                    placeholder={`Message ${selectedConversationUser.full_name.split(" ")[0]}...`}
                    className="w-full px-4 py-3 text-sm text-white border outline-none resize-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
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
        <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
          Loading messages...
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}