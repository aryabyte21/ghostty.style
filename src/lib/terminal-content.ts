// Sample terminal content for the preview component.
// Each segment references ANSI palette index 0-15, or undefined for default fg.

export interface TextSegment {
  text: string;
  colorIndex?: number;
  bold?: boolean;
  dim?: boolean;
}

export type TerminalLine = TextSegment[];

// Cached at module level — these are pure data, no need to recreate per render.

const PROMPT_SEGMENTS: TerminalLine = [
  { text: "user", colorIndex: 2, bold: true },
  { text: "@" },
  { text: "ghost", colorIndex: 4, bold: true },
  { text: " " },
  { text: "~", colorIndex: 5, bold: true },
  { text: " > ", colorIndex: 5 },
];

export function getPromptSegments(): TerminalLine {
  return PROMPT_SEGMENTS;
}

// Arch Linux ASCII art — compact version that renders correctly in monospace fonts
const ARCH_ART_LINES: string[] = [
  "       /\\       ",
  "      /  \\      ",
  "     /\\   \\     ",
  "    /      \\    ",
  "   /   ,,   \\   ",
  "  /   |  |  -\\  ",
  " /_-''    ''-_\\ ",
];

const CACHED_ART_LINES: TerminalLine[] = ARCH_ART_LINES.map((line) => [
  { text: line, colorIndex: 4, bold: true },
]);

const CACHED_INFO_LINES: TerminalLine[] = [
  [
    { text: "user", colorIndex: 4, bold: true },
    { text: "@" },
    { text: "ghost", colorIndex: 4, bold: true },
  ],
  [{ text: "---------------", dim: true }],
  [{ text: "OS      ", colorIndex: 4, bold: true }, { text: "Arch Linux x86_64" }],
  [{ text: "Host    ", colorIndex: 4, bold: true }, { text: "MacBook Pro (M4)" }],
  [{ text: "Kernel  ", colorIndex: 4, bold: true }, { text: "6.12.7-arch1-1" }],
  [{ text: "Shell   ", colorIndex: 4, bold: true }, { text: "zsh 5.9" }],
  [{ text: "Term    ", colorIndex: 4, bold: true }, { text: "ghostty 1.1.0" }],
];

export function getNeofetchContent(): {
  artLines: TerminalLine[];
  infoLines: TerminalLine[];
} {
  return { artLines: CACHED_ART_LINES, infoLines: CACHED_INFO_LINES };
}

// Extra info lines shown below the art+info block (only in full view)
export function getExtraInfoLines(themeName?: string): TerminalLine[] {
  return [
    [{ text: "Theme   ", colorIndex: 4, bold: true }, { text: `${themeName || "Custom"}` }],
    [{ text: "CPU     ", colorIndex: 4, bold: true }, { text: "Apple M4 Pro (12) @ 4.51 GHz" }],
    [{ text: "Memory  ", colorIndex: 4, bold: true }, { text: "8.2 GiB / 24.0 GiB (34%)" }],
    [{ text: "Uptime  ", colorIndex: 4, bold: true }, { text: "3 days, 7 hours" }],
  ];
}

const CACHED_GIT_LOG: TerminalLine[] = [
  [
    { text: "* ", colorIndex: 3 },
    { text: "a3f21bc", colorIndex: 1 },
    { text: " feat: add dark mode toggle", bold: true },
    { text: " (", dim: true },
    { text: "2h ago", colorIndex: 2 },
    { text: ")", dim: true },
  ],
  [
    { text: "* ", colorIndex: 3 },
    { text: "e8d4f10", colorIndex: 1 },
    { text: " fix: resolve color palette issue" },
    { text: " (", dim: true },
    { text: "5h ago", colorIndex: 2 },
    { text: ")", dim: true },
  ],
  [
    { text: "* ", colorIndex: 3 },
    { text: "1b7c9e3", colorIndex: 1 },
    { text: " refactor: clean up config parser" },
    { text: " (", dim: true },
    { text: "1d ago", colorIndex: 2 },
    { text: ")", dim: true },
  ],
];

export function getGitLogOutput(): TerminalLine[] {
  return CACHED_GIT_LOG;
}
