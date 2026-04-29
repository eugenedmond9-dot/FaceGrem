"use client";

import Link from "next/link";

type FaceGremLogoProps = {
  href?: string;
  showWordmark?: boolean;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
};

export default function FaceGremLogo({
  href = "/feed",
  showWordmark = true,
  className = "",
  markClassName = "",
  wordmarkClassName = "",
}: FaceGremLogoProps) {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 ${markClassName}`}
      >
        <img
          src="/facegrem-logo-mark.png"
          alt="FaceGrem"
          className="h-full w-full object-contain p-1"
        />
      </span>

      {showWordmark && (
        <span className={`leading-tight ${wordmarkClassName}`}>
          <span className="block text-lg font-extrabold tracking-tight text-slate-950">
            Face<span className="text-blue-600">Grem</span>
          </span>
          <span className="block text-xs text-slate-500">
            Your social world, live now
          </span>
        </span>
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="FaceGrem home">
      {content}
    </Link>
  );
}
