"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type MobileBottomNavProps = {
  unreadNotificationsCount?: number;
};

const navItems = [
  { href: "/feed", label: "Feed", icon: "🏠" },
  { href: "/videos", label: "Videos", icon: "🎬" },
  { href: "/communities", label: "Groups", icon: "👥" },
  { href: "/messages", label: "Chat", icon: "💬" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function MobileBottomNav({
  unreadNotificationsCount = 0,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#020817]/90 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-2xl xl:hidden">
      <div className="grid max-w-xl grid-cols-5 gap-2 mx-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/feed" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center rounded-2xl px-2 py-2.5 text-center transition ${
                isActive
                  ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="mt-1 text-[11px] font-medium">{item.label}</span>

              {item.href === "/messages" && unreadNotificationsCount > 0 && (
                <span className="absolute right-2 top-2 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cyan-300 px-1 text-[10px] font-bold text-slate-950">
                  {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}