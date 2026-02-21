"use client";

import { useState } from "react";
import { copyToClipboard } from "@/lib/clipboard";

interface ColorSwatchProps {
  color: string;
  label?: string;
  size?: "sm" | "md";
}

export default function ColorSwatch({ color, label, size = "md" }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await copyToClipboard(color);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (size === "sm") {
    return (
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono hover:text-foreground transition-colors group cursor-pointer"
        title={`Copy ${color}`}
      >
        <div
          className="w-3 h-3 rounded-sm border border-border/50 group-hover:scale-110 transition-transform"
          style={{ backgroundColor: color }}
        />
        <span aria-live="polite">{copied ? "copied!" : color}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2 hover:border-border/80 transition-colors cursor-pointer group"
      title={`Copy ${color}`}
    >
      <div
        className="w-5 h-5 rounded border border-border/30 group-hover:scale-110 transition-transform"
        style={{ backgroundColor: color }}
      />
      <div className="text-xs text-left">
        {label && <span className="text-muted-foreground block">{label}</span>}
        <span className="font-mono" aria-live="polite">{copied ? "Copied!" : color}</span>
      </div>
    </button>
  );
}
