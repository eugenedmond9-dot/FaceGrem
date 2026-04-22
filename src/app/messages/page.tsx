"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import MobileBottomNav from "../../components/MobileBottomNav";

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
  const [userAvatar, setUserAvatar] = useState("");
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

      const allProfiles = profilesData || [];
      const myProfile = allProfiles.find((profile) => profile.id === currentUserId);

      setProfiles(allProfiles);
      setMessages(messagesData || []);
      setUserAvatar(
        myProfile?.avatar_url || getAvatarUrl(myProfile?.full_name || currentUserName)
      );
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
      const haystack = `${profile?.full_name || ""} ${profile?.username || ""} ${profile?.bio || ""}`.toLowerCase();
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

  const unreadLikeCount = 0;

  const recentPeople = useMemo(() => {
    return filteredConversationUserIds.slice(0, 5).map((uid) => getProfileById(uid)).filter(Boolean) as ProfileRecord[];
  }, [filteredConversationUserIds, profiles]);

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
      <div className="flex min-h-screen items-center justify-center bg-[#020817] text-white">
        Loading messages...
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

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020817]/75 backdrop-blur-2xl">
        <div className="flex items-center gap-3 px-4 py-4 mx-auto max-w-7xl sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/feed" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 font-bold text-white shadow-[0_12px_40px_rgba(34,211,238,0.28)] sm:h-12 sm:w-12">
                F
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold tracking-tight text-white">FaceGrem</h1>
                <p className="text-xs text-slate-400">Messages</p>
              </div>
            </Link>
          </div>

          <div className="flex-1 hidden lg:block">
            <div className="max-w-xl mx-auto">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_10px_35px_rgba(15,23,42,0.18)] transition focus-within:border-cyan-400/40">
                <span className="text-sm text-slate-400">⌕</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full text-sm text-white bg-transparent outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Link
              href="/feed"
              className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 md:inline-flex"
            >
              Feed
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-2 px-2 py-2 transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 sm:px-2 sm:pr-3"
            >
              <img
                src={userAvatar}
                alt={userName}
                className="object-cover h-9 w-9 rounded-xl ring-1 ring-cyan-400/20"
              />
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-white lg:inline-block">
                {userName}
              </span>
            </Link>
          </div>
        </div>

        <div className="px-4 pb-4 sm:px-6 lg:hidden">
          <div className="mx-auto space-y-3 max-w-7xl">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_10px_35px_rgba(15,23,42,0.18)] transition focus-within:border-cyan-400/40">
              <span className="text-sm text-slate-400">⌕</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search chats..."
                className="w-full text-sm text-white bg-transparent outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Link
                href="/feed"
                className="px-3 py-3 text-xs font-medium text-center text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Feed
              </Link>
              <Link
                href="/videos"
                className="px-3 py-3 text-xs font-medium text-center text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Videos
              </Link>
              <Link
                href="/communities"
                className="px-3 py-3 text-xs font-medium text-center text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Groups
              </Link>
              <Link
                href="/messages"
                className="px-3 py-3 text-xs font-medium text-center text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Chat
              </Link>
            </div>
          </div>
        </div>
      </header>

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
                  <p className="text-sm truncate text-slate-400">Private chats</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">Chats</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {conversationUserIds.length}
                  </p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">Messages</p>
                  <p className="mt-1 text-sm font-semibold text-white">{messages.length}</p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">Focus</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {selectedConversationUser ? "Open" : "Idle"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
              <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                Navigate
              </p>

              <div className="space-y-1.5">
                <Link
                  href="/feed"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">🏠</span>
                    Home feed
                  </span>
                  <span className="text-slate-500">→</span>
                </Link>

                <Link
                  href="/videos"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">🎬</span>
                    Videos
                  </span>
                  <span className="text-slate-500">→</span>
                </Link>

                <Link
                  href="/communities"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">👥</span>
                    Communities
                  </span>
                  <span className="text-slate-500">→</span>
                </Link>

                <Link
                  href="/messages"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">💬</span>
                    Messages
                  </span>
                  <span className="text-slate-500">→</span>
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">👤</span>
                    Your profile
                  </span>
                  <span className="text-slate-500">→</span>
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-cyan-200">People to message</p>
              </div>

              <div className="mt-4 space-y-3">
                {recentPeople.length === 0 ? (
                  <p className="text-sm leading-6 text-slate-400">
                    Start chatting with people from their profile pages.
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
              <p className="text-sm font-semibold text-cyan-200">Conversations</p>
              <p className="mt-1 text-xs text-slate-400">
                {conversationUserIds.length} active chats
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
                placeholder="Search people"
                className="w-full text-sm text-white bg-transparent outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {filteredConversationUserIds.length === 0 ? (
              <div className="p-4 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-400">
                No conversations yet.
              </div>
            ) : (
              filteredConversationUserIds.map((uid) => {
                const profile = getProfileById(uid);
                const isActive = selectedUserId === uid;

                const latestMessage = messages
                  .filter(
                    (message) =>
                      (message.sender_id === userId && message.receiver_id === uid) ||
                      (message.sender_id === uid && message.receiver_id === userId)
                  )
                  .slice(-1)[0];

                return (
                  <button
                    key={uid}
                    type="button"
                    onClick={() => openConversation(uid)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                        : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    <img
                      src={getBestAvatarForUser(uid)}
                      alt={profile?.full_name || "User"}
                      className="object-cover h-11 w-11 rounded-2xl"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {profile?.full_name || "FaceGrem User"}
                      </p>
                      <p
                        className={`mt-1 truncate text-xs ${
                          isActive ? "text-white/80" : "text-slate-400"
                        }`}
                      >
                        {latestMessage?.content || "Open conversation"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="min-w-0">
          {!selectedUserId || !selectedConversationUser ? (
            <div className="flex min-h-[620px] items-center justify-center rounded-[30px] border border-white/10 bg-white/5 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl">
              <div className="max-w-md text-center">
                <p className="text-sm font-semibold text-cyan-200">Messages</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                  Select a conversation
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Open a chat from the left to read messages and start the conversation.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl">
              <div className="px-5 py-4 border-b border-white/10 sm:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
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
                        <div className="flex max-w-[85%] items-end gap-3">
                          {!mine && (
                            <img
                              src={getBestAvatarForUser(selectedUserId)}
                              alt={selectedConversationUser.full_name}
                              className="hidden object-cover h-9 w-9 rounded-xl sm:block"
                            />
                          )}

                          <div
                            className={`rounded-[24px] px-4 py-3 text-sm leading-7 ${
                              mine
                                ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
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
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-4 border-t border-white/10 sm:px-6">
                <form onSubmit={handleSendMessage}>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={2}
                      placeholder={`Message ${selectedConversationUser.full_name.split(" ")[0]}...`}
                      className="w-full px-4 py-3 text-sm text-white transition border outline-none resize-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/40"
                    />

                    <button
                      type="submit"
                      disabled={sending}
                      className="px-6 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      </main>

      <MobileBottomNav unreadNotificationsCount={unreadLikeCount} />
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