export interface GhosttyConfig {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  rawConfig: string;
  background: string;
  foreground: string;
  cursorColor: string | null;
  cursorText: string | null;
  selectionBg: string | null;
  selectionFg: string | null;
  palette: string[]; // 16 hex colors indexed 0-15
  fontFamily: string | null;
  fontSize: number | null;
  cursorStyle: "block" | "bar" | "underline" | null;
  bgOpacity: number | null;
  isDark: boolean;
  tags: string[];
  sourceUrl: string | null;
  authorName: string | null;
  authorUrl: string | null;
  isFeatured: boolean;
  isSeed: boolean;
  voteCount: number;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedConfig {
  background: string;
  foreground: string;
  cursorColor: string | null;
  cursorText: string | null;
  selectionBg: string | null;
  selectionFg: string | null;
  palette: string[];
  fontFamily: string | null;
  fontSize: number | null;
  cursorStyle: "block" | "bar" | "underline" | null;
  bgOpacity: number | null;
  unfocusedSplitOpacity: number | null;
  unfocusedSplitFill: string | null;
  splitDividerColor: string | null;
  isDark: boolean;
  theme: string | null;
}

export interface ConfigFormData {
  rawConfig: string;
  title: string;
  description?: string;
  tags: string[];
  authorName?: string;
}

export type SortOption = "newest" | "popular" | "trending";

export interface ConfigFilters {
  query?: string;
  tag?: string;
  isDark?: boolean;
  sort: SortOption;
  page: number;
}
