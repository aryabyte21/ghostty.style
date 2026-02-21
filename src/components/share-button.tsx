"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";

interface ShareButtonProps {
  slug: string;
  title?: string;
}

export default function ShareButton({ slug, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/config/${slug}`;

    // Use native share sheet on mobile/supported browsers
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: title ? `${title} — ghostty.style` : "ghostty.style",
          url,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    await copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Copied!" : "Share"}
    </Button>
  );
}
