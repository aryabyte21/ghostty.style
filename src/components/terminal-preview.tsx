"use client";

import { useState, useCallback, useRef, useEffect, memo } from "react";
import {
  getPromptSegments,
  getNeofetchContent,
  getExtraInfoLines,
  getGitLogOutput,
  type TextSegment,
  type TerminalLine,
} from "@/lib/terminal-content";

interface TerminalPreviewProps {
  background: string;
  foreground: string;
  cursorColor?: string | null;
  selectionBg?: string | null;
  selectionFg?: string | null;
  palette: string[];
  fontFamily?: string | null;
  fontSize?: number | null;
  cursorStyle?: "block" | "bar" | "underline" | null;
  bgOpacity?: number | null;
  unfocusedSplitOpacity?: number | null;
  unfocusedSplitFill?: string | null;
  splitDividerColor?: string | null;
  compact?: boolean;
  interactive?: boolean;
  title?: string;
  className?: string;
}

// --- OS-aware keybinds ---
function isMac(): boolean {
  if (typeof navigator === "undefined") return true;
  return /Mac|iPhone|iPad/.test(navigator.userAgent);
}

// --- Split tree ---
interface SplitNode {
  id: string;
  direction: "horizontal" | "vertical" | null;
  children: SplitNode[] | null;
}

let _sid = 0;
function nid() { return `p${++_sid}-${Math.random().toString(36).slice(2, 6)}`; }
function dc(n: SplitNode): SplitNode { return JSON.parse(JSON.stringify(n)); }
function cl(n: SplitNode): number { return !n.children ? 1 : n.children.reduce((s, c) => s + cl(c), 0); }
function lids(n: SplitNode): string[] { return !n.children ? [n.id] : n.children.flatMap(lids); }
function fn(r: SplitNode, id: string): SplitNode | null {
  if (r.id === id) return r;
  if (r.children) for (const c of r.children) { const f = fn(c, id); if (f) return f; }
  return null;
}
function fp(r: SplitNode, id: string): { parent: SplitNode; idx: number } | null {
  if (r.children) for (let i = 0; i < r.children.length; i++) {
    if (r.children[i].id === id) return { parent: r, idx: i };
    const f = fp(r.children[i], id); if (f) return f;
  }
  return null;
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return `rgba(0,0,0,${alpha})`;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${alpha})`;
}

// --- Single pane (memoized — avoids re-renders for compact grid cards) ---
const TerminalPane = memo(function TerminalPane({
  background, foreground, cursorColor, selectionBg, selectionFg,
  palette, fontFamily, fontSize, cursorStyle, isActive, compact, title, onFocus, isFocused, hasSplits,
  unfocusedSplitOpacity, unfocusedSplitFill,
}: {
  background: string; foreground: string; cursorColor?: string | null;
  selectionBg?: string | null; selectionFg?: string | null;
  palette: string[]; fontFamily?: string | null; fontSize?: number | null;
  cursorStyle?: "block" | "bar" | "underline" | null;
  isActive: boolean; compact: boolean; title?: string; onFocus: () => void;
  isFocused: boolean;
  hasSplits: boolean;
  unfocusedSplitOpacity?: number | null;
  unfocusedSplitFill?: string | null;
}) {
  const prompt = getPromptSegments();
  const cur = cursorColor || palette[4] || foreground;
  const font = fontFamily
    ? `"${fontFamily}", "JetBrains Mono", "Fira Code", Menlo, monospace`
    : '"JetBrains Mono", "Fira Code", "SF Mono", Menlo, Consolas, monospace';
  const size = compact ? 10 : (fontSize || 13);
  const sBg = selectionBg || palette[4] || "#3a3a5c";
  const sFg = selectionFg || foreground;

  // Ghostty's unfocused-split-opacity: inactive panes are dimmed
  // This only applies when the window itself is focused but this pane isn't active
  const isUnfocusedSplit = hasSplits && !isActive && isFocused;

  function seg(s: TextSegment, i: number) {
    const c = s.colorIndex !== undefined ? (palette[s.colorIndex] ?? foreground) : foreground;
    return <span key={i} style={{ color: c, fontWeight: s.bold ? 700 : undefined, opacity: s.dim ? 0.5 : undefined }}>{s.text}</span>;
  }

  function line(l: TerminalLine, k: number | string) {
    return <div key={k} style={{ minHeight: "1.5em", whiteSpace: "pre" }}>{l.map(seg)}</div>;
  }

  const { artLines, infoLines } = getNeofetchContent();
  const extraInfo = getExtraInfoLines(title);

  const colorBlocks = (
    <div style={{ margin: "4px 0" }}>
      <div style={{ display: "flex" }}>
        {palette.slice(0, 8).map((c, i) => (
          <span key={i} style={{ backgroundColor: c, display: "inline-block", width: "2.4ch", height: "1.4em" }}>{"   "}</span>
        ))}
      </div>
      <div style={{ display: "flex" }}>
        {palette.slice(8, 16).map((c, i) => (
          <span key={i} style={{ backgroundColor: c, display: "inline-block", width: "2.4ch", height: "1.4em" }}>{"   "}</span>
        ))}
      </div>
    </div>
  );

  // Cursor only blinks when this pane is active and window is focused
  const showCursorBlink = isFocused && isActive;
  const cursorBlink = showCursorBlink ? "terminal-cursor-blink" : "";
  const cursorOpacity = (isFocused && isActive) ? 1 : 0.35;
  const cursorEl =
    cursorStyle === "bar" ? (
      <span className={cursorBlink} style={{ borderLeft: `2px solid ${cur}`, height: "1.2em", display: "inline-block", verticalAlign: "text-bottom", opacity: cursorOpacity }} />
    ) : cursorStyle === "underline" ? (
      <span className={cursorBlink} style={{ borderBottom: `2px solid ${cur}`, width: "0.6em", height: "1.2em", display: "inline-block", opacity: cursorOpacity }} />
    ) : (
      <span className={cursorBlink} style={{ backgroundColor: cur, width: "0.6em", height: "1.2em", display: "inline-block", verticalAlign: "text-bottom", borderRadius: "1px", opacity: cursorOpacity }} />
    );

  return (
    <div
      onClick={onFocus}
      role="presentation"
      style={{
        backgroundColor: background,
        color: foreground,
        fontFamily: font,
        fontSize: `${size}px`,
        lineHeight: 1.5,
        letterSpacing: "0.01em",
        padding: compact ? "8px 10px" : "14px 18px",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        cursor: "text",
        userSelect: "none",
      }}
    >
      {/* fastfetch */}
      <div style={{ whiteSpace: "pre" }}>{prompt.map(seg)}<span>fastfetch</span></div>

      {!compact ? (
        <>
          {artLines.length > 0 ? (
            <div style={{ display: "flex", gap: "2ch", margin: "2px 0" }}>
              <div style={{ flexShrink: 0 }}>{artLines.map((l, i) => line(l, `a${i}`))}</div>
              <div>
                {infoLines.map((l, i) => line(l, `i${i}`))}
              </div>
            </div>
          ) : (
            <div style={{ margin: "2px 0" }}>
              {infoLines.map((l, i) => line(l, `i${i}`))}
            </div>
          )}
          {/* Extra info + color blocks */}
          {extraInfo.map((l, i) => line(l, `e${i}`))}
          {colorBlocks}
          <div style={{ whiteSpace: "pre", marginTop: "2px" }}>{prompt.map(seg)}<span>git log --oneline</span></div>
          {getGitLogOutput().map((l, i) => line(l, `g${i}`))}
          <div style={{ height: "4px" }} />
        </>
      ) : (
        colorBlocks
      )}

      {/* Final prompt */}
      <div style={{ whiteSpace: "pre" }}>
        {prompt.map(seg)}
        {!compact && <span style={{ backgroundColor: sBg, color: sFg, borderRadius: "2px", padding: "0 2px" }}>ghostty</span>}
        {!compact && " "}
        {cursorEl}
      </div>

      {/* Ghostty unfocused-split-opacity overlay — dims inactive splits
           Uses unfocused-split-fill (defaults to background) as overlay color.
           Overlay opacity = 1 - unfocused-split-opacity (default ~0.75, so overlay ~0.25) */}
      {isUnfocusedSplit && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: unfocusedSplitFill || background,
            opacity: 1 - (unfocusedSplitOpacity ?? 0.75),
            pointerEvents: "none",
            transition: "opacity 0.15s ease",
          }}
        />
      )}
    </div>
  );
});

// --- Split view ---
function SplitView({ node, activePane, compact, onFocusPane, isFocused, hasSplits, splitDividerColor, ...tp }: {
  node: SplitNode; activePane: string; compact: boolean;
  onFocusPane: (id: string) => void;
  isFocused: boolean;
  hasSplits: boolean;
  splitDividerColor?: string | null;
  background: string; foreground: string; cursorColor?: string | null;
  selectionBg?: string | null; selectionFg?: string | null;
  palette: string[]; fontFamily?: string | null; fontSize?: number | null;
  cursorStyle?: "block" | "bar" | "underline" | null; title?: string;
  unfocusedSplitOpacity?: number | null; unfocusedSplitFill?: string | null;
}) {
  if (!node.children) {
    return <TerminalPane {...tp} isActive={activePane === node.id} compact={compact} onFocus={() => onFocusPane(node.id)} isFocused={isFocused} hasSplits={hasSplits} />;
  }
  const isH = node.direction === "horizontal";
  const dividerColor = splitDividerColor || tp.palette[8] || "#545862";
  return (
    <div style={{ display: "flex", flexDirection: isH ? "row" : "column", height: "100%", width: "100%" }}>
      {node.children.map((child, i) => (
        <div key={child.id} style={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative" }}>
          <SplitView node={child} activePane={activePane} compact={compact} onFocusPane={onFocusPane} isFocused={isFocused} hasSplits={hasSplits} splitDividerColor={splitDividerColor} {...tp} />
          {i < (node.children?.length ?? 0) - 1 && (
            <div style={{
              position: "absolute",
              ...(isH ? { right: 0, top: 0, bottom: 0, width: "1px" } : { bottom: 0, left: 0, right: 0, height: "1px" }),
              backgroundColor: dividerColor, opacity: splitDividerColor ? 1 : 0.5,
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// --- Main ---
export default function TerminalPreview({
  background, foreground, cursorColor, selectionBg, selectionFg,
  palette, fontFamily, fontSize, cursorStyle, bgOpacity,
  unfocusedSplitOpacity, unfocusedSplitFill, splitDividerColor,
  compact = false, interactive = true, title, className,
}: TerminalPreviewProps) {
  const [splitRoot, setSplitRoot] = useState<SplitNode>(() => ({ id: nid(), direction: null, children: null }));
  const [activePane, setActivePane] = useState(splitRoot.id);
  // Keep a ref in sync with activePane so callbacks always read the latest value
  // without needing to be re-created (avoids stale closure bugs)
  const activePaneRef = useRef(activePane);
  useEffect(() => {
    activePaneRef.current = activePane;
  }, [activePane]);
  // Visual focus is always true — the preview should never appear "blurred"
  const isFocused = true;
  // Track real DOM focus separately so keyboard shortcuts only fire when
  // the terminal container actually has focus (not when typing in a textarea, etc.)
  const hasDomFocusRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const modKey = typeof navigator !== "undefined" && !/Mac|iPhone|iPad/.test(navigator.userAgent) ? "Ctrl" : "Cmd";
  const maxPanes = compact ? 1 : 4;

  // Ref used to pass the new active pane ID out of the setSplitRoot updater.
  // React runs functional updaters synchronously, so the ref is set by the
  // time we read it immediately after the setSplitRoot call.
  const pendingActiveRef = useRef<string | null>(null);

  const splitPane = useCallback((dir: "horizontal" | "vertical") => {
    const newId = nid();
    const currentActive = activePaneRef.current;
    pendingActiveRef.current = null;
    setSplitRoot(prev => {
      if (cl(prev) >= maxPanes) return prev;
      const root = dc(prev);
      const node = fn(root, currentActive);
      if (!node || node.children) return prev;
      node.direction = dir;
      node.children = [
        { id: node.id + "-a", direction: null, children: null },
        { id: newId, direction: null, children: null },
      ];
      pendingActiveRef.current = newId;
      return root;
    });
    if (pendingActiveRef.current) {
      setActivePane(pendingActiveRef.current);
    }
  }, [maxPanes]);

  const closePane = useCallback(() => {
    const currentActive = activePaneRef.current;
    pendingActiveRef.current = null;
    setSplitRoot(prev => {
      if (lids(prev).length <= 1) return prev;
      const root = dc(prev);
      const r = fp(root, currentActive);
      if (!r) return prev;
      const sib = r.parent.children![r.idx === 0 ? 1 : 0];
      r.parent.id = sib.id;
      r.parent.direction = sib.direction;
      r.parent.children = sib.children;
      pendingActiveRef.current = lids(root)[0];
      return root;
    });
    if (pendingActiveRef.current) {
      setActivePane(pendingActiveRef.current);
    }
  }, []);

  useEffect(() => {
    if (!interactive || compact) return;
    function handleKeyDown(e: KeyboardEvent) {
      // Only respond to shortcuts when the terminal container has real DOM focus
      if (!hasDomFocusRef.current) return;
      const mac = isMac();
      const mod = mac ? e.metaKey : e.ctrlKey;
      if (!mod) return;
      if (!e.shiftKey && e.key === "d") {
        e.preventDefault();
        splitPane("horizontal");
      } else if (e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        splitPane("vertical");
      } else if (e.shiftKey && e.key.toLowerCase() === "x") {
        e.preventDefault();
        closePane();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [interactive, compact, splitPane, closePane]);

  const opacity = bgOpacity ?? 1;
  const hasTransparency = opacity < 1;
  const bgColor = hasTransparency ? hexToRgba(background, opacity) : background;
  const paneCount = cl(splitRoot);
  const hasSplits = paneCount > 1;

  return (
    <div className={`relative ${className ?? ""}`}>
      {/* Simulated desktop wallpaper for transparency preview */}
      {hasTransparency && (
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="w-full h-full" style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
          }} />
          <div className="absolute bottom-4 right-4 flex gap-3 opacity-60">
            <div className="w-10 h-10 rounded-lg bg-white/20" />
            <div className="w-10 h-10 rounded-lg bg-white/20" />
            <div className="w-10 h-10 rounded-lg bg-white/20" />
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        tabIndex={interactive ? 0 : undefined}
        onFocus={() => { hasDomFocusRef.current = true; }}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            hasDomFocusRef.current = false;
          }
        }}
        className="relative rounded-xl overflow-hidden focus:outline-none"
        style={{
          boxShadow: "0 25px 60px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
        }}
        aria-label={`Terminal preview: ${title || "Ghostty"}`}
      >
        {/* Title bar */}
        <div
          className="flex items-center px-4 select-none"
          style={{
            height: "38px",
            background: hasTransparency ? hexToRgba(background, Math.min(opacity + 0.15, 0.95)) : background,
            borderBottom: `1px solid ${palette[8] || "#545862"}30`,
          }}
        >
          {/* Traffic lights — grey when unfocused, colored when focused (like real macOS) */}
          <div className="flex gap-2 mr-4 shrink-0" style={{ transition: "opacity 0.2s" }}>
            <div className="w-3 h-3 rounded-full transition-colors duration-200" style={{ backgroundColor: isFocused ? "#ff5f57" : "#4e4e4e" }} />
            <div className="w-3 h-3 rounded-full transition-colors duration-200" style={{ backgroundColor: isFocused ? "#febc2e" : "#4e4e4e" }} />
            <div className="w-3 h-3 rounded-full transition-colors duration-200" style={{ backgroundColor: isFocused ? "#28c840" : "#4e4e4e" }} />
          </div>
          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="px-3 py-1 rounded-md text-xs transition-opacity duration-200" style={{
              backgroundColor: `${palette[8] || "#545862"}20`,
              color: palette[7] || foreground,
              fontFamily: "system-ui, -apple-system, sans-serif",
              opacity: isFocused ? 1 : 0.5,
            }}>
              {title || "ghostty"}
            </div>
            {paneCount > 1 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                backgroundColor: `${palette[4] || "#61afef"}30`,
                color: palette[4] || "#61afef",
                fontFamily: "system-ui, sans-serif",
              }}>
                {paneCount} panes
              </span>
            )}
          </div>
          <div className="w-12 shrink-0" />
        </div>

        {/* Terminal body */}
        <div className="relative" style={{
          height: compact ? "180px" : "520px",
          backgroundColor: bgColor,
          ...(hasTransparency ? { backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" } : {}),
        }}>
          <SplitView
            node={splitRoot} activePane={activePane} compact={compact} onFocusPane={setActivePane}
            isFocused={isFocused || !interactive}
            hasSplits={hasSplits}
            background={hasTransparency ? "transparent" : background}
            foreground={foreground} cursorColor={cursorColor}
            selectionBg={selectionBg} selectionFg={selectionFg}
            palette={palette} fontFamily={fontFamily} fontSize={fontSize}
            cursorStyle={cursorStyle} title={title}
            unfocusedSplitOpacity={unfocusedSplitOpacity}
            unfocusedSplitFill={unfocusedSplitFill}
            splitDividerColor={splitDividerColor}
          />

          {/* Unfocused window overlay — dims + desaturates like real Ghostty */}
          {interactive && !isFocused && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: "rgba(0,0,0,0.06)",
                backdropFilter: "saturate(0.7) blur(0.4px)",
                WebkitBackdropFilter: "saturate(0.7) blur(0.4px)",
                transition: "opacity 0.3s ease",
              }}
            />
          )}
        </div>

        {/* Pane control buttons */}
        {interactive && !compact && isFocused && paneCount > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1.5" style={{ fontFamily: "system-ui, sans-serif" }}>
            <button
              onClick={closePane}
              className="px-2 py-1 rounded text-[10px] transition-opacity hover:opacity-100 opacity-70"
              style={{
                backgroundColor: `${palette[1] || "#e06c75"}30`,
                color: palette[1] || "#e06c75",
                border: `1px solid ${palette[1] || "#e06c75"}40`,
              }}
              title={`Close active pane (${modKey}+⇧+X)`}
            >
              ✕ Close pane
            </button>
          </div>
        )}
      </div>

      {/* Keyboard shortcut hints below terminal */}
      {interactive && !compact && (
        <div className="flex items-center justify-center gap-4 mt-2.5 text-[11px] text-muted-foreground" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
          <span><kbd className="px-1 py-0.5 rounded bg-muted/50 text-[10px] font-mono">{modKey}+D</kbd> Split horizontal</span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted/50 text-[10px] font-mono">{modKey}+Shift+D</kbd> Split vertical</span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted/50 text-[10px] font-mono">{modKey}+Shift+X</kbd> Close pane</span>
        </div>
      )}
    </div>
  );
}
