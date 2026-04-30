"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../components/LanguageProvider";
import ToastContainer, { ToastItem } from "../../components/ToastContainer";
import FaceGremLogo from "../../components/FaceGremLogo";

type NotificationRecord = {
  id: string;
  user_id: string;
  actor_id: string;
  type: "follow" | "like" | "comment" | "message" | "audio_call" | "video_call" | "call_accepted" | "call_declined";
  post_id: string | null;
  actor_name: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string;
};

type ProfileRecord = {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url?: string | null;
};

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [userId, setUserId] = useState("");
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [loading, setLoading] = useState(true);

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
    return profile?.full_name || fallbackName || "Someone";
  };

  const getBestAvatarForUser = (userId?: string, fallbackName?: string | null) => {
    const profile = getProfileById(userId);
    return (
      profile?.avatar_url ||
      getAvatarUrl(profile?.full_name || fallbackName || "Someone")
    );
  };

  useEffect(() => {
    const loadNotifications = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/");
        return;
      }

      setUserId(session.user.id);

      const [{ data, error }, { data: profilesData }] = await Promise.all([
        supabase
          .from("notifications")
          .select(
            "id, user_id, actor_id, type, post_id, actor_name, content, is_read, created_at"
          )
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("id, full_name, username, bio, avatar_url"),
      ]);

      if (error) {
        alert(error.message);
      } else {
        setNotifications(data || []);
      }

      setProfiles(profilesData || []);
      setLoading(false);
    };

    void loadNotifications();
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`realtime-notifications-${userId}`)
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
            const exists = prev.some((item) => item.id === newNotification.id);
            if (exists) return prev;
            return [newNotification, ...prev];
          });

          const actorName = getBestNameForUser(
            newNotification.actor_id,
            newNotification.actor_name
          );

          let message = "New activity on FaceGrem";
          let href = "/notifications";

          if (newNotification.type === "follow") {
            message = `${actorName} followed you`;
            href = `/profile?id=${newNotification.actor_id}`;
          } else if (newNotification.type === "like") {
            message = `${actorName} liked your post`;
            href = newNotification.post_id
              ? `/post/${newNotification.post_id}`
              : "/notifications";
          } else if (newNotification.type === "comment") {
            message = `${actorName} commented on your post`;
            href = newNotification.post_id
              ? `/post/${newNotification.post_id}`
              : "/notifications";
          } else if (newNotification.type === "message") {
            message = `${actorName} sent you a message`;
            href = `/messages?user=${newNotification.actor_id}`;
          } else if (newNotification.type === "audio_call") {
            message = `${actorName} started an audio call`;
            href = `/messages?user=${newNotification.actor_id}`;
          } else if (newNotification.type === "video_call") {
            message = `${actorName} started a video call`;
            href = `/messages?user=${newNotification.actor_id}`;
          } else if (newNotification.type === "call_accepted") {
            message = `${actorName} accepted your call`;
            href = `/messages?user=${newNotification.actor_id}`;
          } else if (newNotification.type === "call_declined") {
            message = `${actorName} declined your call`;
            href = `/messages?user=${newNotification.actor_id}`;
          }

          setToasts((prev) => [
            {
              id: newNotification.id,
              title: "New notification",
              message,
              href,
            },
            ...prev,
          ]);
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
            prev.map((item) =>
              item.id === updatedNotification.id ? updatedNotification : item
            )
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, profiles]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, is_read: true } : item
        )
      );
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    const unreadIds = notifications
      .filter((item) => !item.is_read)
      .map((item) => item.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (!error) {
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true }))
      );
    }
  };

  const renderMessage = (notification: NotificationRecord) => {
    const actorName = getBestNameForUser(
      notification.actor_id,
      notification.actor_name
    );

    if (notification.type === "follow") {
      return `${actorName} followed you`;
    }

    if (notification.type === "like") {
      return `${actorName} liked your post`;
    }

    if (notification.type === "comment") {
      return `${actorName} commented on your post`;
    }

    if (notification.type === "message") {
      return `${actorName} sent you a message`;
    }

    if (notification.type === "audio_call") {
      return `${actorName} started an audio call`;
    }

    if (notification.type === "video_call") {
      return `${actorName} started a video call`;
    }

    if (notification.type === "call_accepted") {
      return `${actorName} accepted your call`;
    }

    if (notification.type === "call_declined") {
      return `${actorName} declined your call`;
    }

    return "New activity";
  };

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  );

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10 bg-[#07111f]/85 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-5xl px-6 py-4 mx-auto">
          <div className="flex items-center gap-3">
            <FaceGremLogo
              href=""
              showWordmark={false}
              markClassName="h-11 w-11 rounded-2xl ring-0 shadow-sm"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight">FaceGrem</h1>
              <p className="text-xs text-slate-400">{t.notifications}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-200">
              {"Unread"}: {unreadCount}
            </div>
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Mark all read
            </button>
            <a
              href="/feed"
              className="px-4 py-2 text-sm font-medium transition border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Back to Feed
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-4xl px-6 py-10 mx-auto">
        <div className="mb-8 rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_30%),linear-gradient(to_bottom_right,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 backdrop-blur-xl">
          <p className="text-sm font-medium text-cyan-200">{"Activity"}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            {t.notifications}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            New follows, likes, comments, messages, and calls now appear in realtime.
          </p>
        </div>

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-slate-300">
            {t.loadingNotifications}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-slate-300">
            {"No notifications yet."}
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const href =
                notification.type === "follow"
                  ? `/profile?id=${notification.actor_id}`
                  : notification.type === "message" ||
                    notification.type === "audio_call" ||
                    notification.type === "video_call" ||
                    notification.type === "call_accepted" ||
                    notification.type === "call_declined"
                  ? `/messages?user=${notification.actor_id}`
                  : notification.post_id
                  ? `/post/${notification.post_id}`
                  : "/notifications";

              const actorName = getBestNameForUser(
                notification.actor_id,
                notification.actor_name
              );
              const actorAvatar = getBestAvatarForUser(
                notification.actor_id,
                notification.actor_name
              );

              return (
                <a
                  key={notification.id}
                  href={href}
                  className={`block rounded-[28px] border p-5 backdrop-blur-xl ${
                    notification.is_read
                      ? "border-white/10 bg-white/5"
                      : "border-cyan-400/20 bg-cyan-400/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <img
                        src={actorAvatar}
                        alt={actorName}
                        className="object-cover w-12 h-12 rounded-2xl"
                      />

                      <div>
                        <p className="font-semibold text-white">
                          {renderMessage(notification)}
                        </p>
                        {notification.content && (
                          <p className="mt-2 text-sm text-slate-300">
                            “{notification.content}”
                          </p>
                        )}
                        <p className="mt-2 text-xs text-slate-500">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          void markAsRead(notification.id);
                        }}
                        className="px-3 py-2 text-xs font-semibold bg-white rounded-xl text-slate-900"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}