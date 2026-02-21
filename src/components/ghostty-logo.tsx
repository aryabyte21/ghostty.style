/**
 * Ghostty logo — matches the official Ghostty app icon:
 * A rounded square with blue gradient background, white ghost silhouette
 * with >_ terminal prompt as its face.
 */

import { useId } from "react";

interface GhosttyLogoProps {
  className?: string;
  size?: number;
}

export default function GhosttyLogo({ className, size = 24 }: GhosttyLogoProps) {
  const gradientId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Ghostty logo"
    >
      {/* Rounded square background — matches macOS Tahoe icon style */}
      <rect
        x="4"
        y="4"
        width="112"
        height="112"
        rx="26"
        fill={`url(#${gradientId})`}
      />
      {/* Subtle gloss overlay on top half */}
      <rect
        x="4"
        y="4"
        width="112"
        height="56"
        rx="26"
        fill="white"
        fillOpacity="0.08"
      />

      {/* Ghost silhouette — dome top, wavy 3-scallop bottom, positioned upper-left */}
      <path
        d="M30 52c0-16 12-28 27-28s27 12 27 28v32
           c0 2-1.5 3-3 1.5l-4.5-4.5c-1.5-1.5-3.5-1.5-5 0l-3.5 3.5c-1.5 1.5-3.5 1.5-5 0l-3.5-3.5c-1.5-1.5-3.5-1.5-5 0l-3.5 3.5c-1.5 1.5-3.5 1.5-5 0l-3.5-3.5c-1.5-1.5-3.5-1.5-5 0L33 85.5c-1.5 1.5-3-0.5-3-1.5V52z"
        fill="white"
        fillOpacity="0.92"
      />

      {/* >_ terminal prompt as the ghost's face */}
      {/* > chevron */}
      <path
        d="M42 54l10 8-10 8"
        stroke="#1a3a8a"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* _ underscore/dash */}
      <line
        x1="58"
        y1="70"
        x2="70"
        y2="70"
        stroke="#1a3a8a"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      <defs>
        <linearGradient
          id={gradientId}
          x1="60"
          y1="4"
          x2="60"
          y2="116"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
    </svg>
  );
}
