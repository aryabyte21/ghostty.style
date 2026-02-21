import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { parseGhosttyConfig, cleanRawConfig } from "@/lib/config-parser";
import { generateSlug } from "@/lib/slug-generator";
import { mapRowToConfig } from "@/lib/db";
import { CONFIGS_PER_PAGE, AVAILABLE_TAGS } from "@/lib/constants";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const searchParams = request.nextUrl.searchParams;

  const query = searchParams.get("q") || "";
  const tag = searchParams.get("tag") || "";
  const isDark = searchParams.get("dark");
  const rawSort = searchParams.get("sort") || "popular";
  const sort = ["popular", "newest", "trending"].includes(rawSort) ? rawSort : "popular";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  let dbQuery = supabase.from("configs").select("*", { count: "exact" });

  if (query) {
    // Strip everything except alphanumeric, spaces, and hyphens to prevent
    // PostgREST filter injection through the .or() raw string
    const sanitized = query.replace(/[^a-zA-Z0-9 -]/g, "").trim().slice(0, 100);
    if (sanitized) {
      dbQuery = dbQuery.or(
        `title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`
      );
    }
  }

  if (tag && (AVAILABLE_TAGS as readonly string[]).includes(tag)) {
    dbQuery = dbQuery.contains("tags", [tag]);
  }

  if (isDark === "true") {
    dbQuery = dbQuery.eq("is_dark", true);
  } else if (isDark === "false") {
    dbQuery = dbQuery.eq("is_dark", false);
  }

  switch (sort) {
    case "newest":
      dbQuery = dbQuery.order("created_at", { ascending: false });
      break;
    case "popular":
      dbQuery = dbQuery.order("vote_count", { ascending: false });
      break;
    case "trending":
      // Trending: recent configs first, weighted by votes
      dbQuery = dbQuery
        .order("created_at", { ascending: false })
        .order("vote_count", { ascending: false });
      break;
    default:
      dbQuery = dbQuery.order("vote_count", { ascending: false });
  }

  const from = (page - 1) * CONFIGS_PER_PAGE;
  const to = from + CONFIGS_PER_PAGE - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, error, count } = await dbQuery;

  if (error) {
    console.error("Config list error:", error.message);
    return NextResponse.json({ error: "Failed to load configs" }, { status: 500 });
  }

  return NextResponse.json(
    {
      configs: (data || []).map(mapRowToConfig),
      total: count || 0,
      page,
      perPage: CONFIGS_PER_PAGE,
      totalPages: Math.ceil((count || 0) / CONFIGS_PER_PAGE),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  // Rate limit: 5 uploads per IP per hour
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip, { name: "upload", maxRequests: 5, windowSeconds: 3600 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const supabase = createServerClient();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { rawConfig, title, description, tags, authorName } = body;

  if (!rawConfig || !title) {
    return NextResponse.json(
      { error: "rawConfig and title are required" },
      { status: 400 }
    );
  }

  if (typeof rawConfig !== "string" || rawConfig.length > 50000) {
    return NextResponse.json(
      { error: "Config too large (max 50KB)" },
      { status: 400 }
    );
  }

  if (typeof title !== "string" || title.trim().length === 0 || title.length > 100) {
    return NextResponse.json(
      { error: "Title is required (max 100 chars)" },
      { status: 400 }
    );
  }

  if (description !== undefined && (typeof description !== "string" || description.length > 280)) {
    return NextResponse.json(
      { error: "Description too long (max 280 chars)" },
      { status: 400 }
    );
  }

  if (authorName !== undefined && (typeof authorName !== "string" || authorName.length > 50)) {
    return NextResponse.json(
      { error: "Author name too long (max 50 chars)" },
      { status: 400 }
    );
  }

  // Clean the raw config: strip inline comments and whole-line comments.
  // Ghostty only supports whole-line comments, so inline comments like
  // `background = #0a0a0a  # dark bg` would cause parse errors on download.
  const cleanedRawConfig = cleanRawConfig(rawConfig);

  const { config, errors } = parseGhosttyConfig(rawConfig);

  if (errors.length > 0) {
    // Still allow submission but report warnings
    console.warn("Config parse warnings:", errors);
  }

  // Generate unique slug (capped at 100 attempts to prevent infinite loop)
  let slug = generateSlug(title);
  let suffix = 0;
  const MAX_SLUG_ATTEMPTS = 100;
  let slugFound = false;
  while (suffix < MAX_SLUG_ATTEMPTS) {
    const checkSlug = suffix === 0 ? slug : `${slug}-${suffix}`;
    const { data: existing } = await supabase
      .from("configs")
      .select("id")
      .eq("slug", checkSlug)
      .single();

    if (!existing) {
      slug = checkSlug;
      slugFound = true;
      break;
    }
    suffix++;
  }
  if (!slugFound) {
    return NextResponse.json(
      { error: "Could not generate a unique slug. Try a different title." },
      { status: 500 }
    );
  }

  const allowedTags = AVAILABLE_TAGS as readonly string[];
  const validTags = Array.isArray(tags)
    ? tags
        .filter((t: unknown) => typeof t === "string" && allowedTags.includes(t as string))
        .slice(0, 5) as string[]
    : [];

  // Auto-add dark/light tag
  if (config.isDark && !validTags.includes("dark")) {
    validTags.unshift("dark");
  } else if (!config.isDark && !validTags.includes("light")) {
    validTags.unshift("light");
  }

  const { data, error } = await supabase
    .from("configs")
    .insert({
      slug,
      title: title.trim(),
      description: description?.trim()?.slice(0, 280) || null,
      raw_config: cleanedRawConfig,
      background: config.background,
      foreground: config.foreground,
      cursor_color: config.cursorColor,
      cursor_text: config.cursorText,
      selection_bg: config.selectionBg,
      selection_fg: config.selectionFg,
      palette: config.palette,
      font_family: config.fontFamily,
      font_size: config.fontSize,
      cursor_style: config.cursorStyle || "block",
      bg_opacity: config.bgOpacity ?? 1.0,
      is_dark: config.isDark,
      tags: validTags,
      author_name: authorName?.trim()?.slice(0, 50) || null,
    })
    .select("id, slug")
    .single();

  if (error) {
    console.error("Config insert error:", error.message);
    return NextResponse.json({ error: "Failed to create config" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, slug: data.slug }, { status: 201 });
}
