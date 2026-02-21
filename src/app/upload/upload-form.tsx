"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import TerminalPreview from "@/components/terminal-preview";
import ColorPaletteStrip from "@/components/color-palette-strip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, AlertCircle, TriangleAlert, CheckCircle2 } from "lucide-react";
import { parseGhosttyConfig } from "@/lib/config-parser";
import { AVAILABLE_TAGS } from "@/lib/constants";

export default function UploadForm() {
  const router = useRouter();

  const [rawConfig, setRawConfig] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const { config, errors, warnings } = useMemo(
    () => parseGhosttyConfig(rawConfig),
    [rawConfig]
  );

  // Auto-suggest title from theme name
  const suggestedTitle = config.theme || "";

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 5
        ? [...prev, tag]
        : prev
    );
  }, []);

  function processFile(file: File) {
    if (file.size > 50000) {
      setError("File too large (max 50KB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawConfig(text);
      setError("");
      if (!title && file.name) {
        const name = file.name
          .replace(/\.(conf|config|txt)$/i, "")
          .replace(/[-_]/g, " ");
        setTitle(name);
      }
    };
    reader.readAsText(file);
  }

  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  async function handleSubmit() {
    const finalTitle = title || suggestedTitle;
    if (!rawConfig.trim()) {
      setError("Please paste or upload a config");
      return;
    }
    if (!finalTitle.trim()) {
      setError("Please provide a title for your config");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawConfig,
          title: finalTitle.trim(),
          description: description.trim() || undefined,
          tags: selectedTags,
          authorName: authorName.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to submit config");
        setSubmitting(false);
        return;
      }

      const data = await res.json().catch(() => null);
      if (data?.slug) {
        // Don't reset submitting — let the navigation handle it
        // so the button stays disabled during redirect
        router.push(`/config/${data.slug}`);
      } else {
        setError("Config submitted but redirect failed. Check the browse page.");
        setSubmitting(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Form */}
      <div className="space-y-6">
        {/* File drop / paste area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}
          onDragEnd={() => setIsDragging(false)}
          onDrop={(e) => { setIsDragging(false); handleFileDrop(e); }}
          className="relative"
        >
          <Textarea
            placeholder={`Paste your Ghostty config here...\n\nExample:\nbackground = #1e1e2e\nforeground = #cdd6f4\npalette = 0=#45475a\npalette = 1=#f38ba8\n...`}
            value={rawConfig}
            onChange={(e) => setRawConfig(e.target.value)}
            maxLength={50000}
            className={`min-h-[280px] font-mono text-sm transition-colors ${isDragging ? "border-primary bg-primary/5" : ""}`}
          />
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md border-2 border-dashed border-primary bg-primary/5 pointer-events-none">
              <p className="text-sm font-medium text-primary">Drop your config file here</p>
            </div>
          )}
          <div className="absolute bottom-3 right-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".conf,.config,.txt,text/plain"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button variant="ghost" size="sm" asChild>
                <span className="gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  Upload file
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Validation panel */}
        {rawConfig.trim() && (
          <div className={`rounded-lg border p-3 space-y-2 ${
            errors.length > 0
              ? "border-red-500/30 bg-red-500/5"
              : warnings.length > 0
              ? "border-yellow-500/30 bg-yellow-500/5"
              : "border-green-500/30 bg-green-500/5"
          }`}>
            {/* Status header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {errors.length > 0 ? (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                ) : warnings.length > 0 ? (
                  <TriangleAlert className="h-4 w-4 text-yellow-400" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                )}
                <span className={`text-sm font-medium ${
                  errors.length > 0 ? "text-red-400" : warnings.length > 0 ? "text-yellow-400" : "text-green-400"
                }`}>
                  {errors.length > 0
                    ? `${errors.length} error${errors.length > 1 ? "s" : ""} found`
                    : warnings.length > 0
                    ? `Valid with ${warnings.length} warning${warnings.length > 1 ? "s" : ""}`
                    : "Config valid"}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {config.palette.filter((_, i) => rawConfig.includes(`palette = ${i}=`)).length > 0
                  ? `${config.palette.filter((_, i) => rawConfig.includes(`palette = ${i}=`)).length} palette colors`
                  : "default palette"}
                {config.fontFamily ? ` · ${config.fontFamily}` : ""}
                {config.cursorStyle ? ` · ${config.cursorStyle} cursor` : ""}
              </span>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-red-500/20">
                {errors.slice(0, 10).map((err, i) => (
                  <p key={i} className="text-xs text-red-400 flex items-start gap-1.5">
                    <span className="shrink-0 font-mono text-red-400/60 w-12 text-right">
                      {err.line > 0 ? `L${err.line}` : ""}
                    </span>
                    {err.message}
                  </p>
                ))}
                {errors.length > 10 && (
                  <p className="text-xs text-red-400/60 pl-14">
                    … and {errors.length - 10} more error{errors.length - 10 > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-yellow-500/20">
                {warnings.slice(0, 8).map((warn, i) => (
                  <p key={i} className="text-xs text-yellow-400 flex items-start gap-1.5">
                    <span className="shrink-0 font-mono text-yellow-400/60 w-12 text-right">
                      {warn.line > 0 ? `L${warn.line}` : ""}
                    </span>
                    {warn.message}
                  </p>
                ))}
                {warnings.length > 8 && (
                  <p className="text-xs text-yellow-400/60 pl-14">
                    … and {warnings.length - 8} more warning{warnings.length - 8 > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="config-title" className="text-sm font-medium">Title</label>
            {title.length > 80 && (
              <span className="text-xs text-muted-foreground">{title.length}/100</span>
            )}
          </div>
          <Input
            id="config-title"
            placeholder={suggestedTitle || "e.g., Catppuccin Mocha"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="config-description" className="text-sm font-medium">
              Description{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            {description.length > 0 && (
              <span className={`text-xs ${description.length > 260 ? "text-orange-400" : "text-muted-foreground"}`}>
                {description.length}/280
              </span>
            )}
          </div>
          <Input
            id="config-description"
            placeholder="A warm, soothing dark theme..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={280}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Tags{" "}
            <span className="text-muted-foreground font-normal">
              (up to 5)
            </span>
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Tags">
            {AVAILABLE_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleTag(tag); } }}
                role="checkbox"
                tabIndex={0}
                aria-checked={selectedTags.includes(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Author */}
        <div>
          <label htmlFor="config-author" className="text-sm font-medium mb-1.5 block">
            Your name{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Input
            id="config-author"
            placeholder="Anonymous"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={50}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || !rawConfig.trim() || errors.length > 0}
          className="w-full"
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : errors.length > 0 ? (
            "Fix errors to submit"
          ) : (
            "Submit Config"
          )}
        </Button>
      </div>

      {/* Right: Live Preview */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Live Preview
        </h3>
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
          unfocusedSplitOpacity={config.unfocusedSplitOpacity}
          unfocusedSplitFill={config.unfocusedSplitFill}
          splitDividerColor={config.splitDividerColor}
          interactive
          title={title || suggestedTitle || "Preview"}
        />
        <ColorPaletteStrip palette={config.palette} className="h-6 rounded" />
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border border-border/50"
              style={{ backgroundColor: config.background }}
            />
            Background: {config.background}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border border-border/50"
              style={{ backgroundColor: config.foreground }}
            />
            Foreground: {config.foreground}
          </div>
        </div>
      </div>
    </div>
  );
}
