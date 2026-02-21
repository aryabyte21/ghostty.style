"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Check, AlertCircle, Loader2 } from "lucide-react";

interface DownloadButtonProps {
  configId: string;
  slug: string;
}

export default function DownloadButton({ configId, slug }: DownloadButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleDownload() {
    setState("loading");
    try {
      const res = await fetch(`/api/configs/${configId}/download`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ghostty-${slug.replace(/[^a-z0-9-]/g, "")}.conf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  return (
    <Button onClick={handleDownload} disabled={state === "loading"} className="gap-2">
      {state === "loading" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : state === "done" ? (
        <Check className="h-4 w-4" />
      ) : state === "error" ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {state === "done" ? "Downloaded!" : state === "error" ? "Failed" : "Download"}
    </Button>
  );
}
