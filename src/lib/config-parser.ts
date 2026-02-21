import { normalizeHex, isDarkColor } from "./color-utils";
import {
  DEFAULT_PALETTE,
  DEFAULT_BACKGROUND,
  DEFAULT_FOREGROUND,
} from "./constants";
import type { ParsedConfig } from "@/types/config";

interface ParseError {
  line: number;
  message: string;
}

interface ParseWarning {
  line: number;
  message: string;
}

interface ParseResult {
  config: ParsedConfig;
  errors: ParseError[];
  warnings: ParseWarning[];
}

// All known Ghostty configuration keys (from https://ghostty.org/docs/config/reference)
// This set is used to warn users about unrecognized keys that Ghostty would also reject.
const KNOWN_GHOSTTY_KEYS = new Set([
  // Font
  "font-family",
  "font-family-bold",
  "font-family-italic",
  "font-family-bold-italic",
  "font-size",
  "font-style",
  "font-style-bold",
  "font-style-italic",
  "font-style-bold-italic",
  "font-synthetic-style",
  "font-feature",
  "font-variation",
  "font-variation-bold",
  "font-variation-italic",
  "font-variation-bold-italic",
  "font-codepoint-map",
  "font-thicken",
  "font-thicken-strength",
  "font-shaping-break",
  "freetype-load-flags",
  // Cursor
  "cursor-color",
  "cursor-text",
  "cursor-style",
  "cursor-style-blink",
  "cursor-opacity",
  "cursor-click-to-move",
  // Colors
  "background",
  "foreground",
  "background-opacity",
  "background-opacity-cells",
  "background-blur",
  "background-image",
  "background-image-opacity",
  "background-image-position",
  "background-image-fit",
  "background-image-repeat",
  "selection-background",
  "selection-foreground",
  "selection-clear-on-typing",
  "selection-clear-on-copy",
  "palette",
  "minimum-contrast",
  "alpha-blending",
  // Theme
  "theme",
  // Split panes
  "split-divider-color",
  "unfocused-split-opacity",
  "unfocused-split-fill",
  "focus-follows-mouse",
  // Window
  "window-padding-x",
  "window-padding-y",
  "window-padding-balance",
  "window-padding-color",
  "window-decoration",
  "window-theme",
  "window-colorspace",
  "window-title-font-family",
  "window-titlebar-background",
  "window-titlebar-foreground",
  "window-height",
  "window-width",
  "window-position-x",
  "window-position-y",
  "window-step-resize",
  "window-inherit-font-size",
  "window-inherit-working-directory",
  "window-vsync",
  "window-save-state",
  "window-show-tab-bar",
  "window-new-tab-position",
  "window-subtitle",
  // macOS-specific
  "macos-titlebar-style",
  "macos-option-as-alt",
  "macos-window-shadow",
  "macos-icon",
  "macos-icon-frame",
  "macos-icon-ghost-color",
  "macos-icon-screen-color",
  // Resize overlay
  "resize-overlay",
  "resize-overlay-position",
  "resize-overlay-duration",
  // Cell adjustments
  "adjust-cell-width",
  "adjust-cell-height",
  "adjust-font-baseline",
  "adjust-underline-position",
  "adjust-underline-thickness",
  "adjust-strikethrough-position",
  "adjust-strikethrough-thickness",
  "adjust-overline-position",
  "adjust-overline-thickness",
  "adjust-box-thickness",
  "adjust-cursor-thickness",
  "adjust-cursor-height",
  "adjust-icon-height",
  // Links
  "link",
  "link-url",
  "link-previews",
  // Text rendering
  "grapheme-width-method",
  // Images
  "image-storage-limit",
  // Input
  "mouse-hide-while-typing",
  "mouse-scroll-multiplier",
  "mouse-shift-capture",
  "copy-on-select",
  "click-repeat-interval",
  "right-click-action",
  "scroll-to-bottom",
  "clipboard-read",
  "clipboard-write",
  "clipboard-trim-trailing-spaces",
  "clipboard-paste-protection",
  "clipboard-paste-bracketed-safe",
  // Shell / terminal
  "title",
  "title-report",
  "command",
  "initial-command",
  "working-directory",
  "shell-integration",
  "shell-integration-features",
  "scrollback-limit",
  "auto-update",
  "auto-update-channel",
  // Keybinds
  "keybind",
  // Quick terminal
  "quick-terminal-position",
  "quick-terminal-size",
  "quick-terminal-screen",
  "quick-terminal-animation-duration",
  "quick-terminal-autohide",
  "quick-terminal-space-behavior",
  "quick-terminal-keyboard-interactivity",
  // GTK-specific
  "gtk-single-instance",
  "gtk-tabs-location",
  "gtk-wide-tabs",
  "gtk-adwaita",
  "gtk-quick-terminal-layer",
  "gtk-quick-terminal-namespace",
  // Misc
  "config-file",
  "config-default-files",
  "confirm-close-surface",
  "quit-after-last-window-closed",
  "quit-after-last-window-closed-delay",
  "initial-window",
  "undo-timeout",
  "abnormal-command-exit-runtime",
  "wait-after-command",
  "enquiry-response",
  "osc-color-report-format",
  "vt-kam-allowed",
  "term",
  "env",
  "input",
  "linux-cgroup",
  "linux-cgroup-memory-limit",
  "linux-cgroup-processes-limit",
  "desktop-notifications",
  "maximize",
  "fullscreen",
  "class",
  "x11-instance-name",
  "command-palette-entry",
]);

// Common typos / wrong key names → suggest the correct Ghostty key
const KEY_SUGGESTIONS: Record<string, string> = {
  "split-border-color": "split-divider-color",
  "split-border-width": "split-divider-color (Ghostty has no border width setting)",
  "split-color": "split-divider-color",
  "divider-color": "split-divider-color",
  "inactive-pane-dim": "unfocused-split-opacity",
  "inactive-pane-opacity": "unfocused-split-opacity",
  "inactive-pane-saturation": "unfocused-split-opacity (Ghostty has no saturation control)",
  "inactive-pane-brightness": "unfocused-split-opacity (Ghostty has no brightness control)",
  "inactive-pane-overlay": "unfocused-split-fill",
  "inactive-pane-overlay-opacity": "unfocused-split-opacity",
  "inactive-pane-color": "unfocused-split-fill",
  "split-opacity": "unfocused-split-opacity",
  "bg-opacity": "background-opacity",
  "opacity": "background-opacity",
  "bg-color": "background",
  "fg-color": "foreground",
  "font": "font-family",
  "cursor": "cursor-color",
  "selection-bg": "selection-background",
  "selection-fg": "selection-foreground",
  "bold-is-bright": "font-synthetic-style (Ghostty has no bold-is-bright option)",
  "bold-bright": "font-synthetic-style (Ghostty has no bold-bright option)",
};

// Keys that expect a hex color value
const COLOR_KEYS = new Set([
  "background", "foreground", "cursor-color", "cursor-text",
  "selection-background", "selection-foreground",
  "unfocused-split-fill", "split-divider-color",
  "window-padding-color", "window-titlebar-background", "window-titlebar-foreground",
]);

// Keys that expect a numeric value and their valid ranges
const NUMERIC_RANGES: Record<string, { min: number; max: number; label: string }> = {
  "font-size": { min: 6, max: 72, label: "6–72" },
  "background-opacity": { min: 0, max: 1, label: "0–1" },
  "background-image-opacity": { min: 0, max: 1, label: "0–1" },
  "unfocused-split-opacity": { min: 0.15, max: 1, label: "0.15–1" },
  "cursor-opacity": { min: 0, max: 1, label: "0–1" },
  "minimum-contrast": { min: 1, max: 21, label: "1–21" },
  "scrollback-limit": { min: 0, max: 10000000, label: "0–10000000" },
};

// Keys that expect one of a fixed set of values
const ENUM_VALUES: Record<string, string[]> = {
  "cursor-style": ["block", "bar", "underline", "block_hollow"],
  "cursor-style-blink": ["true", "false"],
  "window-decoration": ["none", "auto", "client", "server", "true", "false"],
  "window-theme": ["auto", "system", "dark", "light", "ghostty"],
  "window-colorspace": ["srgb", "display-p3"],
  "window-save-state": ["default", "never", "always"],
  "window-new-tab-position": ["current", "end"],
  "window-show-tab-bar": ["true", "false"],
  "macos-titlebar-style": ["native", "transparent", "tabs"],
  "macos-option-as-alt": ["true", "false", "left", "right"],
  "shell-integration": ["none", "detect", "bash", "zsh", "fish", "elvish"],
  "alpha-blending": ["native", "css"],
  "resize-overlay": ["always", "never", "after-first"],
  "right-click-action": ["none", "paste", "primary-paste"],
  "copy-on-select": ["true", "false", "clipboard"],
  "font-thicken": ["true", "false"],
  "font-synthetic-style": ["true", "false", "no-bold", "no-italic"],
  "mouse-hide-while-typing": ["true", "false"],
  "focus-follows-mouse": ["true", "false"],
  "confirm-close-surface": ["true", "false"],
  "quit-after-last-window-closed": ["true", "false"],
  "desktop-notifications": ["true", "false"],
  "maximize": ["true", "false"],
  "fullscreen": ["true", "false"],
  "link-previews": ["true", "false"],
};

// Keys that expect a boolean value
const BOOLEAN_KEYS = new Set([
  "cursor-style-blink", "cursor-click-to-move", "window-decoration",
  "window-padding-balance", "window-step-resize", "window-inherit-font-size",
  "window-inherit-working-directory", "window-vsync",
  "font-thicken", "mouse-hide-while-typing", "focus-follows-mouse",
  "selection-clear-on-typing", "selection-clear-on-copy",
  "clipboard-trim-trailing-spaces", "clipboard-paste-protection",
  "clipboard-paste-bracketed-safe", "scroll-to-bottom",
  "confirm-close-surface", "quit-after-last-window-closed",
  "desktop-notifications", "maximize", "fullscreen",
  "link-previews", "macos-window-shadow",
  "gtk-single-instance", "gtk-wide-tabs",
  "background-opacity-cells", "background-blur",
  "vt-kam-allowed", "title-report",
]);

export function parseGhosttyConfig(raw: string): ParseResult {
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];
  const lines = raw.split("\n");

  let background: string | null = null;
  let foreground: string | null = null;
  let cursorColor: string | null = null;
  let cursorText: string | null = null;
  let selectionBg: string | null = null;
  let selectionFg: string | null = null;
  const palette: (string | null)[] = new Array(16).fill(null);
  let fontFamily: string | null = null;
  let fontSize: number | null = null;
  let cursorStyle: "block" | "bar" | "underline" | null = null;
  let bgOpacity: number | null = null;
  let unfocusedSplitOpacity: number | null = null;
  let unfocusedSplitFill: string | null = null;
  let splitDividerColor: string | null = null;
  let theme: string | null = null;

  // Track duplicate keys (palette and keybind are allowed to repeat)
  const seenKeys = new Map<string, number>();
  const MULTI_VALUE_KEYS = new Set(["palette", "keybind", "font-feature", "font-variation",
    "font-variation-bold", "font-variation-italic", "font-variation-bold-italic",
    "font-codepoint-map", "link", "link-url", "env", "command-palette-entry"]);

  let hasAnyKey = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) {
      // Non-empty, non-comment line without `=`
      warnings.push({
        line: i + 1,
        message: `Invalid syntax — expected "key = value" format`,
      });
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    hasAnyKey = true;

    // Validate key format — should be lowercase with hyphens
    if (key && !/^[a-z][a-z0-9-]*$/.test(key)) {
      warnings.push({
        line: i + 1,
        message: `Key "${key}" has invalid characters — Ghostty keys use lowercase and hyphens only`,
      });
    }

    // Detect empty values (except for keys that might intentionally be empty)
    if (!value && key !== "keybind" && key !== "command" && key !== "initial-command") {
      errors.push({
        line: i + 1,
        message: `Empty value for "${key}" — a value is required`,
      });
      continue;
    }

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Detect and warn about inline comments
    // Use the same stripInlineComment logic to detect them
    const strippedValue = stripInlineComment(value);
    if (strippedValue !== value) {
      warnings.push({
        line: i + 1,
        message: `Inline comment detected — Ghostty treats everything after "=" as the value. Comments will be stripped on save.`,
      });
      value = strippedValue;
    }

    // Check for unrecognized keys
    if (!KNOWN_GHOSTTY_KEYS.has(key)) {
      const suggestion = KEY_SUGGESTIONS[key];
      if (suggestion) {
        warnings.push({
          line: i + 1,
          message: `Unknown key "${key}" — did you mean ${suggestion}?`,
        });
      } else {
        warnings.push({
          line: i + 1,
          message: `Unknown key "${key}" — Ghostty will ignore this`,
        });
      }
      continue;
    }

    // Detect duplicate keys (non-multi-value)
    if (!MULTI_VALUE_KEYS.has(key)) {
      const prevLine = seenKeys.get(key);
      if (prevLine !== undefined) {
        warnings.push({
          line: i + 1,
          message: `Duplicate key "${key}" (first seen on line ${prevLine}) — last value wins`,
        });
      }
      seenKeys.set(key, i + 1);
    }

    // Validate color keys
    if (COLOR_KEYS.has(key) && key !== "background" && key !== "foreground" &&
        key !== "cursor-color" && key !== "cursor-text" &&
        key !== "selection-background" && key !== "selection-foreground" &&
        key !== "unfocused-split-fill" && key !== "split-divider-color") {
      // Other color keys — validate but don't store
      const hex = normalizeHex(value);
      if (!hex) {
        errors.push({ line: i + 1, message: `Invalid color for "${key}": ${value} — expected #RRGGBB or #RGB` });
      }
      continue;
    }

    // Validate numeric range keys (that aren't handled in the switch)
    if (NUMERIC_RANGES[key] && key !== "font-size" && key !== "background-opacity" &&
        key !== "unfocused-split-opacity" && key !== "scrollback-limit") {
      const num = parseFloat(value);
      const range = NUMERIC_RANGES[key];
      if (isNaN(num) || num < range.min || num > range.max) {
        errors.push({ line: i + 1, message: `Invalid value for "${key}": ${value} — expected number in range ${range.label}` });
      }
      continue;
    }

    // Validate enum keys (that aren't handled in the switch)
    if (ENUM_VALUES[key] && key !== "cursor-style") {
      if (!ENUM_VALUES[key].includes(value)) {
        errors.push({ line: i + 1, message: `Invalid value for "${key}": "${value}" — expected one of: ${ENUM_VALUES[key].join(", ")}` });
      }
      // Don't continue — some enum keys also need processing in the switch
    }

    // Validate boolean keys
    if (BOOLEAN_KEYS.has(key) && !ENUM_VALUES[key]) {
      if (value !== "true" && value !== "false") {
        errors.push({ line: i + 1, message: `Invalid value for "${key}": "${value}" — expected true or false` });
      }
      continue;
    }

    switch (key) {
      case "background": {
        const hex = normalizeHex(value);
        if (hex) background = hex;
        else errors.push({ line: i + 1, message: `Invalid color for "background": ${value} — expected #RRGGBB or #RGB` });
        break;
      }
      case "foreground": {
        const hex = normalizeHex(value);
        if (hex) foreground = hex;
        else errors.push({ line: i + 1, message: `Invalid color for "foreground": ${value} — expected #RRGGBB or #RGB` });
        break;
      }
      case "cursor-color": {
        const hex = normalizeHex(value);
        if (hex) cursorColor = hex;
        else errors.push({ line: i + 1, message: `Invalid color for "cursor-color": ${value} — expected #RRGGBB or #RGB` });
        break;
      }
      case "cursor-text": {
        const hex = normalizeHex(value);
        if (hex) cursorText = hex;
        else errors.push({ line: i + 1, message: `Invalid color for "cursor-text": ${value} — expected #RRGGBB or #RGB` });
        break;
      }
      case "selection-background": {
        // Ghostty 1.2+ supports special values: cell-foreground, cell-background
        if (value === "cell-foreground" || value === "cell-background") {
          // Special value — don't set the hex color for preview
        } else {
          const hex = normalizeHex(value);
          if (hex) selectionBg = hex;
          else errors.push({ line: i + 1, message: `Invalid color for "selection-background": ${value} — expected #RRGGBB, #RGB, cell-foreground, or cell-background` });
        }
        break;
      }
      case "selection-foreground": {
        if (value === "cell-foreground" || value === "cell-background") {
          // Special value — don't set the hex color for preview
        } else {
          const hex = normalizeHex(value);
          if (hex) selectionFg = hex;
          else errors.push({ line: i + 1, message: `Invalid color for "selection-foreground": ${value} — expected #RRGGBB, #RGB, cell-foreground, or cell-background` });
        }
        break;
      }
      case "palette": {
        // Format: "N=#RRGGBB" or "N=RRGGBB" — Ghostty supports indices 0-255
        const paletteMatch = value.match(/^(\d+)\s*=\s*(.+)$/);
        if (paletteMatch) {
          const index = parseInt(paletteMatch[1], 10);
          if (index < 0 || index > 255) {
            errors.push({ line: i + 1, message: `Palette index ${index} out of range — expected 0–255` });
          } else {
            const hex = normalizeHex(paletteMatch[2]);
            if (hex) {
              // Only store indices 0-15 in the preview palette
              if (index <= 15) palette[index] = hex;
            } else {
              errors.push({ line: i + 1, message: `Invalid color in palette ${index}: ${paletteMatch[2]} — expected #RRGGBB or #RGB` });
            }
          }
        } else {
          errors.push({
            line: i + 1,
            message: `Invalid palette format: "${value}" — expected "N=#RRGGBB" (e.g., "0=#000000")`,
          });
        }
        break;
      }
      case "font-family":
        fontFamily = value || null;
        break;
      case "font-size": {
        const size = parseFloat(value);
        if (isNaN(size) || size < 6 || size > 72)
          errors.push({ line: i + 1, message: `Invalid font-size: ${value} — expected number in range 6–72` });
        else fontSize = size;
        break;
      }
      case "cursor-style":
        if (["block", "bar", "underline", "block_hollow"].includes(value)) {
          cursorStyle = (value === "block_hollow" ? "block" : value) as "block" | "bar" | "underline";
        } else {
          errors.push({ line: i + 1, message: `Invalid cursor-style: "${value}" — expected one of: block, bar, underline, block_hollow` });
        }
        break;
      case "background-opacity": {
        const opacity = parseFloat(value);
        if (isNaN(opacity) || opacity < 0 || opacity > 1)
          errors.push({ line: i + 1, message: `Invalid background-opacity: ${value} — expected number in range 0–1` });
        else bgOpacity = opacity;
        break;
      }
      case "unfocused-split-opacity": {
        const uso = parseFloat(value);
        if (isNaN(uso) || uso < 0.15 || uso > 1)
          errors.push({ line: i + 1, message: `Invalid unfocused-split-opacity: ${value} — expected number in range 0.15–1` });
        else unfocusedSplitOpacity = uso;
        break;
      }
      case "unfocused-split-fill": {
        const hex = normalizeHex(value);
        if (hex) unfocusedSplitFill = hex;
        else errors.push({ line: i + 1, message: `Invalid color for "unfocused-split-fill": ${value} — expected #RRGGBB or #RGB` });
        break;
      }
      case "split-divider-color": {
        const hex = normalizeHex(value);
        if (hex) splitDividerColor = hex;
        else errors.push({ line: i + 1, message: `Invalid color for "split-divider-color": ${value} — expected #RRGGBB or #RGB` });
        break;
      }
      case "scrollback-limit": {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 0)
          errors.push({ line: i + 1, message: `Invalid scrollback-limit: ${value} — expected a non-negative integer` });
        break;
      }
      case "theme":
        theme = value || null;
        break;
      // All other known keys are valid Ghostty config but don't affect the
      // visual preview — we accept them silently (no warning).
      default:
        break;
    }
  }

  // Post-parse validation: warn about missing essential visual properties
  if (hasAnyKey) {
    if (!background && !foreground && palette.every(c => c === null) && !theme) {
      warnings.push({
        line: 0,
        message: "No colors defined — config should have at least background, foreground, or palette colors",
      });
    }
  }

  // Fill defaults
  const finalBg = background ?? DEFAULT_BACKGROUND;
  const finalFg = foreground ?? DEFAULT_FOREGROUND;
  const finalPalette = palette.map((c, i) => c ?? DEFAULT_PALETTE[i]);

  return {
    config: {
      background: finalBg,
      foreground: finalFg,
      cursorColor,
      cursorText,
      selectionBg,
      selectionFg,
      palette: finalPalette,
      fontFamily,
      fontSize,
      cursorStyle,
      bgOpacity,
      unfocusedSplitOpacity,
      unfocusedSplitFill,
      splitDividerColor,
      isDark: isDarkColor(finalBg),
      theme,
    },
    errors,
    warnings,
  };
}

/**
 * Strip comments from raw config text so it's safe for Ghostty to load directly.
 *
 * Ghostty only supports whole-line comments (`# ...`). Inline comments like
 * `background = #0a0a0a  # dark bg` make Ghostty treat everything after `=` as
 * the value, causing parse errors.
 *
 * This function:
 * 1. Removes whole-line comment lines (lines starting with #)
 * 2. Strips inline comments from key=value lines
 * 3. Collapses multiple blank lines into one
 */
export function cleanRawConfig(raw: string): string {
  const lines = raw.split("\n");
  const result: string[] = [];
  let prevBlank = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip whole-line comments
    if (trimmed.startsWith("#")) continue;

    // Preserve blank lines (but collapse consecutive blanks)
    if (!trimmed) {
      if (!prevBlank) result.push("");
      prevBlank = true;
      continue;
    }
    prevBlank = false;

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) {
      // Non-comment, non-key=value line — keep as-is
      result.push(trimmed);
      continue;
    }

    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Strip inline comments.  We need to be careful not to strip parts of
    // hex colors like `#0a0a0a`.  Strategy: walk the value from left to
    // right and find the first ` #` that is NOT inside a hex color token.
    // A hex color token starts with `#` and is followed by hex digits.
    // An inline comment starts with ` #` followed by a space or letter.
    const stripped = stripInlineComment(value);

    result.push(`${key} = ${stripped}`);
  }

  // Trim trailing blank lines
  while (result.length > 0 && result[result.length - 1] === "") {
    result.pop();
  }

  return result.join("\n") + "\n";
}

/**
 * Strip an inline comment from a config value string.
 *
 * Finds ` # ` or ` #` followed by a non-hex character, skipping over
 * hex color values that start with `#`.
 *
 * Examples:
 *   "#0a0a0a  # dark bg"      → "#0a0a0a"
 *   "0.4  # opacity"           → "0.4"
 *   "0=#000000"                → "0=#000000"  (palette, no space before #)
 *   "#ff00ff"                  → "#ff00ff"    (just a hex color, no comment)
 */
function stripInlineComment(value: string): string {
  // Look for " #" sequences.  For each one, check whether it looks like
  // the start of a hex color (#RRGGBB / #RGB) or an inline comment.
  let searchFrom = 0;
  while (searchFrom < value.length) {
    const idx = value.indexOf(" #", searchFrom);
    if (idx === -1) break;

    // Check what follows " #"
    const afterHash = value.slice(idx + 2);

    // If what follows is exactly 3 or 6 hex digits optionally followed by
    // end-of-string or a space, it's a hex color — skip over it.
    const hexMatch = afterHash.match(/^([0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?)(?:\s|$)/);
    if (hexMatch) {
      // Skip past this hex color token
      searchFrom = idx + 2 + hexMatch[1].length;
      continue;
    }

    // It's an inline comment — strip from here
    return value.slice(0, idx).trimEnd();
  }

  return value;
}

export function serializeGhosttyConfig(config: ParsedConfig): string {
  const lines: string[] = [];

  if (config.theme) lines.push(`theme = ${config.theme}`);
  lines.push(`background = ${config.background}`);
  lines.push(`foreground = ${config.foreground}`);
  if (config.cursorColor) lines.push(`cursor-color = ${config.cursorColor}`);
  if (config.cursorText) lines.push(`cursor-text = ${config.cursorText}`);
  if (config.selectionBg)
    lines.push(`selection-background = ${config.selectionBg}`);
  if (config.selectionFg)
    lines.push(`selection-foreground = ${config.selectionFg}`);

  config.palette.forEach((color, i) => {
    lines.push(`palette = ${i}=${color}`);
  });

  if (config.fontFamily) lines.push(`font-family = "${config.fontFamily}"`);
  if (config.fontSize !== null && config.fontSize !== undefined)
    lines.push(`font-size = ${config.fontSize}`);
  if (config.cursorStyle) lines.push(`cursor-style = ${config.cursorStyle}`);
  if (config.bgOpacity !== null && config.bgOpacity !== undefined)
    lines.push(`background-opacity = ${config.bgOpacity}`);
  if (
    config.unfocusedSplitOpacity !== null &&
    config.unfocusedSplitOpacity !== undefined
  )
    lines.push(`unfocused-split-opacity = ${config.unfocusedSplitOpacity}`);
  if (config.unfocusedSplitFill)
    lines.push(`unfocused-split-fill = ${config.unfocusedSplitFill}`);
  if (config.splitDividerColor)
    lines.push(`split-divider-color = ${config.splitDividerColor}`);

  return lines.join("\n");
}
