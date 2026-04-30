"use client";

import React from "react";

type IconProps = {
  className?: string;
};

export function CommunityCircleIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <g stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.3 3.4a9.2 9.2 0 0 1 6.8.55c1.05.52 2.02 1.2 2.82 2.08" />
        <path d="M20.1 9.25a9.18 9.18 0 0 1 .36 6.83 8.98 8.98 0 0 1-1.98 3.33" />
        <path d="M14.75 20.32a9.03 9.03 0 0 1-6.89.18 9.05 9.05 0 0 1-3.34-2.02" />
        <path d="M3.92 14.82a9.15 9.15 0 0 1-.28-6.9A9.1 9.1 0 0 1 5.6 4.66" />
      </g>
      <g fill="currentColor">
        <circle cx="12" cy="4.9" r="1.85" />
        <circle cx="18.25" cy="9.25" r="1.85" />
        <circle cx="15.55" cy="17.55" r="1.85" />
        <circle cx="8.45" cy="17.55" r="1.85" />
        <circle cx="5.75" cy="9.25" r="1.85" />
      </g>
    </svg>
  );
}

export function FriendsFistIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.1 12.8 8.1 10c1.15-.64 2.57-.65 3.74-.04l1.9.98-2.05 1.3a1.6 1.6 0 0 0-.3 2.52l.78.78" />
        <path d="M20.9 12.8 15.9 10c-1.15-.64-2.57-.65-3.74-.04l-1.9.98 2.05 1.3a1.6 1.6 0 0 1 .3 2.52l-.78.78" />
        <path d="M8 10.05V8.8c0-.5.4-.9.9-.9h.82c.5 0 .9.4.9.9v1.78" />
        <path d="M13.38 10.58V8.8c0-.5.4-.9.9-.9h.82c.5 0 .9.4.9.9v1.25" />
        <path d="M7.12 15.32 9 17.2c.72.72 1.88.72 2.6 0l.4-.4c.38-.38.89-.6 1.43-.6h1.05" />
        <path d="M16.88 15.32 15 17.2c-.72.72-1.88.72-2.6 0l-.4-.4c-.38-.38-.89-.6-1.43-.6H9.52" />
        <path d="M4.2 12.2v1.6c0 .9.36 1.77.99 2.4l.3.3" />
        <path d="M19.8 12.2v1.6c0 .9-.36 1.77-.99 2.4l-.3.3" />
      </g>
    </svg>
  );
}

export function GroupPeopleIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <g fill="currentColor">
        <circle cx="12" cy="7.2" r="2.2" />
        <circle cx="6.2" cy="8.2" r="1.8" />
        <circle cx="17.8" cy="8.2" r="1.8" />
      </g>
      <g stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.4 19.1v-2.05A3.6 3.6 0 0 1 12 13.45a3.6 3.6 0 0 1 3.6 3.6v2.05" />
        <path d="M3.55 18.35v-1a3 3 0 0 1 3-3h.55a3 3 0 0 1 2.63 1.55" />
        <path d="M20.45 18.35v-1a3 3 0 0 0-3-3h-.55a3 3 0 0 0-2.63 1.55" />
      </g>
    </svg>
  );
}

export function MessageBubblesIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <g stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.25 6.5A2.25 2.25 0 0 1 6.5 4.25h7A2.25 2.25 0 0 1 15.75 6.5v4.25A2.25 2.25 0 0 1 13.5 13H8.4l-3.15 2.35V6.5Z" />
        <path d="M9.25 15.1h5.25A2.25 2.25 0 0 0 16.75 12.85V10.5h.75A2.25 2.25 0 0 1 19.75 12.75V19l-3.05-2.25H11.5A2.25 2.25 0 0 1 9.25 14.5v-.4Z" />
      </g>
      <g fill="currentColor">
        <circle cx="8" cy="8.7" r="0.7" />
        <circle cx="10.2" cy="8.7" r="0.7" />
        <circle cx="12.4" cy="8.7" r="0.7" />
      </g>
    </svg>
  );
}

export function TranslateLanguageIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <g stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.8 5.2h6.3a2.1 2.1 0 0 1 2.1 2.1v9.9a1.9 1.9 0 0 0-1.5-.75H5.55A1.75 1.75 0 0 0 4.8 16.6V5.2Z" />
        <path d="M19.2 5.2h-6.3a2.1 2.1 0 0 0-2.1 2.1v9.9c.35-.47.9-.75 1.5-.75h6.15c.27 0 .52.06.75.14V5.2Z" />
        <path d="M6.8 9.8c1.55 0 2.95-.55 4-1.55" />
        <path d="M8.8 7.75c0 2.35-1.1 4.35-2.85 5.55" />
        <path d="M7.2 11.15c.75.25 1.45.7 2.1 1.35" />
        <path d="M14.7 9.1h3.3" />
        <path d="M16.35 8.1v1" />
        <path d="M14.6 12.9h3.5" />
        <path d="m15.2 12.9 1.2-2.9 1.2 2.9" />
        <path d="M13.8 19.2c1.95 1.1 4.15 1.1 6 0" />
      </g>
    </svg>
  );
}
