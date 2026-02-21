import { cache } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { mapRowToConfig } from "@/lib/db";
import TerminalPreview from "@/components/terminal-preview";
import ColorPaletteStrip from "@/components/color-palette-strip";
import ColorSwatch from "@/components/color-swatch";
import VoteButton from "@/components/vote-button";
import DownloadButton from "@/components/download-button";
import ShareButton from "@/components/share-button";
import CopyConfigButton from "@/components/copy-config-button";
import InstallCommand from "@/components/install-command";
import ConfigGrid from "@/components/config-grid";
import { parseGhosttyConfig } from "@/lib/config-parser";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Download,
  Calendar,
  User,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Deduplicate the Supabase query so generateMetadata + page component
// don't issue two identical DB roundtrips on the same request.
const SLUG_RE = /^[a-z0-9-]+$/;
const getConfigBySlug = cache(async (slug: string) => {
  if (!slug || slug.length > 100 || !SLUG_RE.test(slug)) {
    return { data: null, error: { message: "Invalid slug" } };
  }
  const supabase = createServerClient();
  return supabase.from("configs").select("*").eq("slug", slug).single();
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await getConfigBySlug(slug);

  if (!data) return { title: "Config Not Found" };

  return {
    title: data.title,
    description:
      data.description ||
      `Preview and download the ${data.title} Ghostty terminal configuration.`,
    openGraph: {
      title: `${data.title} — Ghostty Config`,
      description:
        data.description ||
        `Preview and download the ${data.title} Ghostty terminal configuration.`,
    },
  };
}

export default async function ConfigDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const { data: row, error } = await getConfigBySlug(slug);

  if (error || !row) notFound();
  const supabase = createServerClient();

  const config = mapRowToConfig(row);

  // Re-parse raw config for visual props not stored in DB columns
  const { config: parsed } = parseGhosttyConfig(config.rawConfig);

  // Increment view count atomically (fire and forget)
  void supabase.rpc("increment_view_count", { config_id: config.id });

  // Fetch similar configs (same dark/light mode)
  const { data: similarRows } = await supabase
    .from("configs")
    .select("*")
    .neq("id", config.id)
    .eq("is_dark", config.isDark)
    .order("vote_count", { ascending: false })
    .limit(4);

  const similar = (similarRows || []).map(mapRowToConfig);

  // Validate URLs to prevent javascript: URI injection
  const isValidUrl = (url: string | null) => url && /^https?:\/\//i.test(url);
  const safeAuthorUrl = isValidUrl(config.authorUrl) ? config.authorUrl : null;
  const safeSourceUrl = isValidUrl(config.sourceUrl) ? config.sourceUrl : null;

  const createdDate = new Date(config.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/browse"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to browse
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{config.title}</h1>
          {config.description && (
            <p className="text-muted-foreground mt-1">{config.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <VoteButton configId={config.id} initialCount={config.voteCount} />
          <ShareButton slug={config.slug} title={config.title} />
          <DownloadButton configId={config.id} slug={config.slug} />
        </div>
      </div>

      {/* Terminal Preview */}
      <div className="mb-6">
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
          bgOpacity={config.bgOpacity}
          unfocusedSplitOpacity={parsed.unfocusedSplitOpacity}
          unfocusedSplitFill={parsed.unfocusedSplitFill}
          splitDividerColor={parsed.splitDividerColor}
          interactive
          title={config.title}
        />
      </div>

      {/* Install via CLI */}
      <div className="mb-6">
        <InstallCommand configId={config.id} slug={config.slug} />
      </div>

      {/* Colors section */}
      <div className="mb-8 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Colors{" "}
          <span className="text-xs font-normal">(click to copy)</span>
        </h3>

        {/* Primary colors — bg, fg, cursor, selection */}
        <div className="flex flex-wrap gap-3">
          <ColorSwatch color={config.background} label="Background" />
          <ColorSwatch color={config.foreground} label="Foreground" />
          {config.cursorColor && (
            <ColorSwatch color={config.cursorColor} label="Cursor" />
          )}
          {config.selectionBg && (
            <ColorSwatch color={config.selectionBg} label="Selection" />
          )}
        </div>

        {/* ANSI Palette */}
        <ColorPaletteStrip
          palette={config.palette}
          className="h-8 rounded-lg"
        />
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {config.palette.map((color, i) => (
            <ColorSwatch key={i} color={color} size="sm" />
          ))}
        </div>
      </div>

      {/* Metadata + Tags + Attribution */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {config.authorName &&
          (safeAuthorUrl ? (
            <a
              href={safeAuthorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <User className="h-3.5 w-3.5" />
              {config.authorName}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              {config.authorName}
            </span>
          ))}
        {safeSourceUrl && (
          <a
            href={safeSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Source
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {createdDate}
        </span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          {config.viewCount} views
        </span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Download className="h-3.5 w-3.5" />
          {config.downloadCount} downloads
        </span>
        {config.tags.length > 0 && (
          <>
            <span className="text-border">·</span>
            {config.tags.map((tag) => (
              <Link key={tag} href={`/browse?tag=${tag}`}>
                <Badge
                  variant="secondary"
                  className="hover:bg-secondary/80 cursor-pointer"
                >
                  {tag}
                </Badge>
              </Link>
            ))}
          </>
        )}
      </div>

      {/* Raw Config */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Configuration
          </h3>
          <CopyConfigButton rawConfig={config.rawConfig} />
        </div>
        <pre
          className="p-4 rounded-xl overflow-x-auto text-sm leading-relaxed border border-border/30 whitespace-pre-wrap break-words"
          style={{
            backgroundColor: config.background,
            color: config.foreground,
            fontFamily: "var(--font-geist-mono), monospace",
          }}
        >
          {config.rawConfig}
        </pre>
      </div>

      {/* Similar Configs */}
      {similar.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">Similar Configs</h2>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <ConfigGrid configs={similar} />
        </section>
      )}
    </div>
  );
}
