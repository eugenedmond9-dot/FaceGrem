"use client";

import Link from "next/link";
import { useEffect } from "react";

export type ToastItem = {
  id: string;
  title: string;
  message: string;
  href?: string;
};

type ToastContainerProps = {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
};

export default function ToastContainer({
  toasts,
  onRemove,
}: ToastContainerProps) {
  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      setTimeout(() => {
        onRemove(toast.id);
      }, 4000)
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [toasts, onRemove]);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const content = (
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-cyan-400/20 bg-[#0b1220] p-4 shadow-2xl backdrop-blur-xl">
            <div>
              <p className="text-sm font-semibold text-white">{toast.title}</p>
              <p className="mt-1 text-sm text-slate-300">{toast.message}</p>
              {toast.href && (
                <p className="mt-2 text-xs font-medium text-cyan-300">
                  Tap to open
                </p>
              )}
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(toast.id);
              }}
              className="px-2 py-1 text-xs rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
            >
              ✕
            </button>
          </div>
        );

        return (
          <div key={toast.id} className="pointer-events-auto">
            {toast.href ? (
              <Link href={toast.href} onClick={() => onRemove(toast.id)}>
                {content}
              </Link>
            ) : (
              content
            )}
          </div>
        );
      })}
    </div>
  );
}