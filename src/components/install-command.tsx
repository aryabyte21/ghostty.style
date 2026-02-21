"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Terminal } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";

interface InstallCommandProps {
  configId: string;
  slug: string;
  siteUrl?: string;
}

export default function InstallCommand({ configId, slug, siteUrl }: InstallCommandProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showCommand, setShowCommand] = useState(false);

  const baseUrl = siteUrl || (typeof window !== "undefined" ? window.location.origin : "https://ghostty.style");

  const commands = useMemo(() => {
    const downloadUrl = `${baseUrl}/api/configs/${configId}/download`;
    const curlInstall = `mkdir -p ~/.config/ghostty/themes && curl -sfL "${downloadUrl}" > ~/.config/ghostty/themes/${slug} && grep -q "^theme = ${slug}$" ~/.config/ghostty/config 2>/dev/null || echo "theme = ${slug}" >> ~/.config/ghostty/config`;
    const curlSimple = `curl -sfL "${downloadUrl}" -o ~/.config/ghostty/config`;
    return { curlInstall, curlSimple };
  }, [baseUrl, configId, slug]);

  async function handleCopy(command: string, key: string) {
    await copyToClipboard(command);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  if (!showCommand) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowCommand(true)}
        className="gap-1.5"
      >
        <Terminal className="h-4 w-4" />
        Install via CLI
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/50 p-4 bg-card">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Terminal className="h-4 w-4" />
          Install via Terminal
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCommand(false)}
          className="text-xs h-7 px-2"
        >
          Close
        </Button>
      </div>

      {/* Option 1: Save as named theme */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">
          Save as a named theme (recommended):
        </p>
        <div className="flex gap-2 items-start">
          <pre className="flex-1 text-xs p-2.5 rounded-md bg-muted/50 overflow-x-auto font-mono whitespace-pre-wrap break-all">
            {commands.curlInstall}
          </pre>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(commands.curlInstall, "install")}
            className="shrink-0 h-8"
          >
            {copiedKey === "install" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Option 2: Replace config entirely */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">
          Or replace your entire config:
        </p>
        <div className="flex gap-2 items-start">
          <pre className="flex-1 text-xs p-2.5 rounded-md bg-muted/50 overflow-x-auto font-mono whitespace-pre-wrap break-all">
            {commands.curlSimple}
          </pre>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(commands.curlSimple, "simple")}
            className="shrink-0 h-8"
          >
            {copiedKey === "simple" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Restart Ghostty after installing for changes to take effect.
      </p>
    </div>
  );
}
