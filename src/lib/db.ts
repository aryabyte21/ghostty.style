import type { GhosttyConfig } from "@/types/config";

// Maps a Supabase row to our GhosttyConfig type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRowToConfig(row: any): GhosttyConfig {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    rawConfig: row.raw_config,
    background: row.background,
    foreground: row.foreground,
    cursorColor: row.cursor_color,
    cursorText: row.cursor_text,
    selectionBg: row.selection_bg,
    selectionFg: row.selection_fg,
    palette: row.palette || [],
    fontFamily: row.font_family,
    fontSize: row.font_size,
    cursorStyle: row.cursor_style,
    bgOpacity: row.bg_opacity,
    isDark: row.is_dark,
    tags: row.tags || [],
    sourceUrl: row.source_url,
    authorName: row.author_name,
    authorUrl: row.author_url,
    isFeatured: row.is_featured,
    isSeed: row.is_seed,
    voteCount: row.vote_count,
    viewCount: row.view_count,
    downloadCount: row.download_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
