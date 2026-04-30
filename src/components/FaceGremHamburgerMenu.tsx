"use client";

import Link from "next/link";
import FaceGremLogo from "./FaceGremLogo";

type FaceGremHamburgerMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userAvatar?: string;
  onLogout?: () => void;
  notificationCount?: number;
};

function MenuBadge({ count }: { count?: number }) {
  if (!count || count < 1) return null;

  return (
    <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold leading-none text-white">
      {count > 20 ? "20+" : count}
    </span>
  );
}

function MenuItem({
  href,
  icon,
  label,
  onClose,
  badge,
}: {
  href: string;
  icon: string;
  label: string;
  onClose: () => void;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-3 rounded-xl p-3 font-medium text-slate-700 transition hover:bg-slate-100"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-lg text-slate-500">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <MenuBadge count={badge} />
    </Link>
  );
}

export default function FaceGremHamburgerMenu({
  isOpen,
  onClose,
  userName = "FaceGrem User",
  userAvatar = "",
  onLogout,
  notificationCount,
}: FaceGremHamburgerMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="fixed right-0 top-0 z-[90] flex h-full w-[340px] max-w-[90vw] flex-col overflow-y-auto bg-white p-4 text-slate-950 shadow-2xl">
        <div className="flex items-center justify-between">
          <FaceGremLogo
            href="/feed"
            showWordmark
            markClassName="h-10 w-10 rounded-2xl ring-0 shadow-sm"
            wordmarkClassName="hidden sm:block"
          />

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-700 shadow-sm transition hover:bg-slate-200"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3">
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="h-11 w-11 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {userName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate font-semibold">{userName}</p>
              <p className="text-xs text-slate-500">View your profile</p>
            </div>
          </Link>
        </div>

        <div className="mt-4 space-y-5">
          <section>
            <p className="px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Main
            </p>
            <div className="mt-2 grid gap-1">
              <MenuItem href="/feed" icon="⌂" label="Home Feed" onClose={onClose} />
              <MenuItem href="/friends" icon="🤜" label="Friends" onClose={onClose} />
              <MenuItem href="/messages" icon="▣" label="Messages" onClose={onClose} />
              <MenuItem href="/videos" icon="▶" label="Videos" onClose={onClose} />
              <MenuItem
                href="/notifications"
                icon="🔔"
                label="Notifications"
                onClose={onClose}
                badge={notificationCount}
              />
              <MenuItem href="/communities" icon="◎" label="Communities" onClose={onClose} />
              <MenuItem href="/groups" icon="●" label="Groups" onClose={onClose} />
              <MenuItem href="/saved" icon="▱" label="Saved" onClose={onClose} />
              <MenuItem href="/settings" icon="⚙" label="Settings" onClose={onClose} />
            </div>
          </section>

          <section>
            <p className="px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Privacy & legal
            </p>
            <div className="mt-2 grid gap-1">
              <MenuItem href="/privacy" icon="🔒" label="Privacy" onClose={onClose} />
              <MenuItem href="/privacy-centre" icon="🛡" label="Privacy Centre" onClose={onClose} />
              <MenuItem href="/terms" icon="📄" label="Terms" onClose={onClose} />
              <MenuItem href="/cookies" icon="🍪" label="Cookies" onClose={onClose} />
              <MenuItem href="/ad-choices" icon="🎯" label="AdChoices" onClose={onClose} />
            </div>
          </section>

          <section>
            <p className="px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Create & explore
            </p>
            <div className="mt-2 grid gap-1">
              <MenuItem href="/create-page" icon="＋" label="Create Page" onClose={onClose} />
              <MenuItem href="/create-ad" icon="📣" label="Create Ad" onClose={onClose} />
              <MenuItem href="/threads" icon="▤" label="Threads" onClose={onClose} />
            </div>
          </section>

          <section>
            <p className="px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Support & company
            </p>
            <div className="mt-2 grid gap-1">
              <MenuItem href="/help" icon="?" label="Help" onClose={onClose} />
              <MenuItem href="/about" icon="i" label="About FaceGrem" onClose={onClose} />
              <MenuItem href="/careers" icon="💼" label="Careers" onClose={onClose} />
              <MenuItem href="/developers" icon="⌘" label="Developers" onClose={onClose} />
            </div>
          </section>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full rounded-xl p-3 text-left font-semibold text-red-600 transition hover:bg-red-50"
            >
              <span className="inline-flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center">↩</span>
                Log out
              </span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
