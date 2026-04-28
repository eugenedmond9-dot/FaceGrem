"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useLanguage } from "./LanguageProvider";

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

type NotificationDropdownProps = {
  className?: string;
  iconClassName?: string;
};

export default function NotificationDropdown({
  className = "",
  iconClassName = "",
}: NotificationDropdownProps) {
  const { t } = useLanguage();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [userId, setUserId] = useState("");
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );

  const getNotificationMessage = (notification: NotificationRecord) => {
    const actorName = notification.actor_name || "Someone";

    if (notification.content) return notification.content;

    if (notification.type === "follow") return `${actorName} followed you.`;
    if (notification.type === "like") return `${actorName} liked your post.`;
    if (notification.type === "comment") return `${actorName} commented on your post.`;
    if (notification.type === "message") return `${actorName} sent you a message.`;
    if (notification.type === "audio_call") return `${actorName} started an audio call.`;
    if (notification.type === "video_call") return `${actorName} started a video call.`;
    if (notification.type === "call_accepted") return `${actorName} accepted your call.`;
    if (notification.type === "call_declined") return `${actorName} declined your call.`;

    return "New notification.";
  };

  const getNotificationHref = (notification: NotificationRecord) => {
    if (
      notification.type === "message" ||
      notification.type === "audio_call" ||
      notification.type === "video_call" ||
      notification.type === "call_accepted" ||
      notification.type === "call_declined"
    ) {
      return notification.actor_id ? `/messages?user=${notification.actor_id}` : "/messages";
    }

    if (notification.type === "follow") {
      return notification.actor_id ? `/profile?id=${notification.actor_id}` : "/profile";
    }

    if (notification.post_id) {
      return `/post/${notification.post_id}`;
    }

    return "/feed";
  };

  const formatNotificationTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "now";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;

    return `${Math.floor(diffMinutes / 1440)}d`;
  };

  const loadNotifications = async (currentUserId: string) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, actor_id, type, post_id, actor_name, content, is_read, created_at")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(12);

    setLoading(false);

    if (error) {
      console.error(error.message);
      return;
    }

    setNotifications(data || []);
  };

  const markAllRead = async () => {
    if (!userId || unreadCount === 0) return;

    const unreadIds = notifications
      .filter((notification) => !notification.is_read)
      .map((notification) => notification.id);

    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, is_read: true }))
    );

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds)
      .eq("user_id", userId);

    if (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      setUserId(session.user.id);
      await loadNotifications(session.user.id);
    };

    void loadUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const notificationsChannel = supabase
      .channel(`global-notifications-dropdown-${userId}`)
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

            return [newNotification, ...prev].slice(0, 12);
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

    return () => {
      void supabase.removeChannel(notificationsChannel);
    };
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open && userId) {
            void loadNotifications(userId);
          }
        }}
        className={
          iconClassName ||
          "relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-sm text-slate-200 transition hover:bg-white/[0.06]"
        }
        aria-label={t.notifications}
        title={t.notifications}
      >
        🔔

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-slate-950 shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[100] w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#07111f]/95 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-white">{t.notifications}</p>
              <p className="mt-1 text-xs text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>

            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark read
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                {t.loadingNotifications}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-medium text-white">No notifications yet.</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Likes, comments, messages, follows, and calls will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={getNotificationHref(notification)}
                  onClick={() => setOpen(false)}
                  className={`block rounded-2xl px-3 py-3 transition hover:bg-white/[0.06] ${
                    notification.is_read ? "bg-transparent" : "bg-cyan-400/[0.08]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035]">
                      {notification.type === "message"
                        ? "💬"
                        : notification.type === "audio_call"
                        ? "📞"
                        : notification.type === "video_call"
                        ? "🎥"
                        : notification.type === "follow"
                        ? "👤"
                        : "🔔"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-5 text-white">
                        {getNotificationMessage(notification)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatNotificationTime(notification.created_at)}
                      </p>
                    </div>

                    {!notification.is_read && (
                      <span className="mt-2 h-2 w-2 rounded-full bg-cyan-400" />
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="border-t border-white/[0.07] p-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void markAllRead();
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
