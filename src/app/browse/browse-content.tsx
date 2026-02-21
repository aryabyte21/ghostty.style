"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ConfigGrid from "@/components/config-grid";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Sun, Moon, AlertCircle } from "lucide-react";
import { AVAILABLE_TAGS } from "@/lib/constants";
import type { GhosttyConfig, SortOption } from "@/types/config";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [configs, setConfigs] = useState<GhosttyConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const debouncedQuery = useDebounce(query, 300);
  const [activeTag, setActiveTag] = useState(searchParams.get("tag") || "");
  const [isDark, setIsDark] = useState<boolean | null>(
    searchParams.get("dark") === "true"
      ? true
      : searchParams.get("dark") === "false"
      ? false
      : null
  );
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "popular"
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );

  // Track whether this is the first render to avoid double URL push
  const isFirstRender = useRef(true);
  const searchRef = useRef<HTMLInputElement>(null);

  // Press "/" anywhere to focus search (like GitHub)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (activeTag) params.set("tag", activeTag);
    if (isDark !== null) params.set("dark", String(isDark));
    params.set("sort", sort);
    params.set("page", String(page));

    try {
      const res = await fetch(`/api/configs?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Server error" }));
        setError(data.error || `Error ${res.status}`);
        setConfigs([]);
        return;
      }
      const data = await res.json();
      setConfigs(data.configs || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
    } catch {
      setError("Failed to load configs. Please try again.");
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, activeTag, isDark, sort, page]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // Sync URL with debounced query
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (activeTag) params.set("tag", activeTag);
    if (isDark !== null) params.set("dark", String(isDark));
    if (sort !== "popular") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.replace(`/browse${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [debouncedQuery, activeTag, isDark, sort, page, router]);

  function handleSearch(value: string) {
    setQuery(value);
    setPage(1);
  }

  function toggleTag(tag: string) {
    setActiveTag((prev) => (prev === tag ? "" : tag));
    setPage(1);
  }

  function toggleDark() {
    setIsDark((prev) => {
      if (prev === null) return true;
      if (prev === true) return false;
      return null;
    });
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search configs...  ( / )"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={isDark === null ? "outline" : "secondary"}
          size="sm"
          onClick={toggleDark}
          className="gap-1.5 shrink-0"
        >
          {isDark === null ? (
            <>All themes</>
          ) : isDark ? (
            <>
              <Moon className="h-3.5 w-3.5" /> Dark only
            </>
          ) : (
            <>
              <Sun className="h-3.5 w-3.5" /> Light only
            </>
          )}
        </Button>
        <Select value={sort} onValueChange={(v) => { setSort(v as SortOption); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="trending">Trending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tag">
        {AVAILABLE_TAGS.map((tag) => (
          <Badge
            key={tag}
            variant={activeTag === tag ? "default" : "outline"}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => toggleTag(tag)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleTag(tag); } }}
            aria-pressed={activeTag === tag}
          >
            {tag}
          </Badge>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={fetchConfigs}>
            Retry
          </Button>
        </div>
      )}

      {/* Results */}
      {!error && loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-border/50 bg-card animate-pulse">
              <div className="h-[180px] bg-muted/30" />
              <div className="p-3 space-y-2">
                <div className="h-3 rounded bg-muted/30" />
                <div className="h-4 rounded bg-muted/30 w-2/3" />
                <div className="flex gap-1.5">
                  <div className="h-4 w-12 rounded-full bg-muted/30" />
                  <div className="h-4 w-10 rounded-full bg-muted/30" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !error ? (
        <>
          {configs.length > 0 && (debouncedQuery || activeTag || isDark !== null) && (
            <p className="text-sm text-muted-foreground">
              {totalCount} config{totalCount !== 1 ? "s" : ""} found
            </p>
          )}
          <ConfigGrid configs={configs} />
        </>
      ) : null}

      {/* Pagination */}
      {!error && totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
