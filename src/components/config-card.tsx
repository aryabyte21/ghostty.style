import { memo } from "react";
import Link from "next/link";
import TerminalPreview from "./terminal-preview";
import ColorPaletteStrip from "./color-palette-strip";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import type { GhosttyConfig } from "@/types/config";

interface ConfigCardProps {
  config: GhosttyConfig;
  index?: number;
}

export default memo(function ConfigCard({ config, index = 0 }: ConfigCardProps) {
  return (
    <Link
      href={`/config/${config.slug}`}
      className="config-card-gpu group block rounded-xl overflow-hidden border border-border/50 bg-card hover:border-border/80 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 animate-grid-item"
      style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
    >
      <div className="pointer-events-none">
        <TerminalPreview
          background={config.background}
          foreground={config.foreground}
          cursorColor={config.cursorColor}
          selectionBg={config.selectionBg}
          selectionFg={config.selectionFg}
          palette={config.palette}
          fontFamily={config.fontFamily}
          fontSize={config.fontSize}
          cursorStyle={config.cursorStyle}
          compact
          interactive={false}
        />
      </div>
      <div className="p-3 space-y-2">
        <ColorPaletteStrip palette={config.palette} className="h-3" />
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {config.title}
          </h3>
          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Heart className="h-3 w-3" />
            {config.voteCount}
          </span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {config.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  );
});
