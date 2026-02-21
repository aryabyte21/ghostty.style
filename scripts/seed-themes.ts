/**
 * Seeding script: fetches popular Ghostty themes from the iTerm2-Color-Schemes
 * repository and inserts them into Supabase.
 *
 * Usage: npx tsx scripts/seed-themes.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { parseGhosttyConfig } from "../src/lib/config-parser";
import { generateSlug } from "../src/lib/slug-generator";
import { averageSaturation, contrastRatio } from "../src/lib/color-utils";
import https from "https";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Validate env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || supabaseUrl.includes("your-project")) {
  console.error(
    "ERROR: NEXT_PUBLIC_SUPABASE_URL is not set or still a placeholder.\n" +
      "Please create a Supabase project and update .env.local with real credentials.\n" +
      "See: https://supabase.com/dashboard"
  );
  process.exit(1);
}
if (!supabaseKey || supabaseKey === "your-service-role-key") {
  console.error(
    "ERROR: SUPABASE_SERVICE_ROLE_KEY is not set or still a placeholder.\n" +
      "Find it in your Supabase project: Settings → API → service_role key."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Exact filenames as they appear in the repo's /ghostty/ directory
const PRIORITY_THEMES = [
  // Catppuccin
  "Catppuccin Mocha",
  "Catppuccin Latte",
  "Catppuccin Frappe",
  "Catppuccin Macchiato",
  // Dracula
  "Dracula",
  "Dracula+",
  // Nord
  "Nord",
  "Nord Light",
  // Gruvbox
  "Gruvbox Dark",
  "Gruvbox Light",
  "Gruvbox Dark Hard",
  // Tokyo Night
  "TokyoNight",
  "TokyoNight Storm",
  "TokyoNight Day",
  "TokyoNight Moon",
  // Rose Pine
  "Rose Pine",
  "Rose Pine Moon",
  "Rose Pine Dawn",
  // Solarized
  "Solarized Dark Higher Contrast",
  "iTerm2 Solarized Light",
  // One Half / Atom One
  "One Half Dark",
  "One Half Light",
  "Atom One Dark",
  "Atom One Light",
  // Monokai
  "Monokai Soda",
  "Monokai Pro",
  "Monokai Vivid",
  // Kanagawa
  "Kanagawa Wave",
  "Kanagawa Dragon",
  "Kanagawabones",
  // Everforest
  "Everforest Dark Hard",
  "Everforest Light Med",
  // GitHub
  "GitHub Dark",
  "GitHub",
  "GitHub Dark Dimmed",
  // Material
  "Material",
  "Material Dark",
  "Material Darker",
  "Material Ocean",
  // Others
  "Snazzy",
  "Ayu",
  "Ayu Light",
  "Ayu Mirage",
  "Nightfox",
  "Carbonfox",
  "Dawnfox",
  "Synthwave",
  "Cyberpunk",
  "Retro",
  "Andromeda",
  "Aurora",
  "Breeze",
  "Challenger Deep",
  "Cobalt2",
  "Fairyfloss",
  "Horizon",
  "Iceberg Dark",
  "Iceberg Light",
  "Aura",
  "Dark+",
];

function autoTag(
  title: string,
  config: ReturnType<typeof parseGhosttyConfig>["config"]
): string[] {
  const tags: string[] = [];
  tags.push(config.isDark ? "dark" : "light");

  const lower = title.toLowerCase();
  if (lower.includes("minimal") || lower.includes("mono")) tags.push("minimal");
  if (lower.includes("retro")) tags.push("retro");
  if (
    lower.includes("neon") ||
    lower.includes("synth") ||
    lower.includes("cyber")
  )
    tags.push("neon");
  if (
    lower.includes("pastel") ||
    lower.includes("catppuccin") ||
    lower.includes("fairy") ||
    lower.includes("rose pine")
  )
    tags.push("pastel");
  if (lower.includes("warm") || lower.includes("gruvbox") || lower.includes("monokai"))
    tags.push("warm");
  if (lower.includes("cool") || lower.includes("nord") || lower.includes("iceberg"))
    tags.push("cool");

  const sat = averageSaturation(config.palette);
  if (sat > 0.6) tags.push("colorful");
  if (sat < 0.15) tags.push("minimal");

  const contrast = contrastRatio(config.background, config.foreground);
  if (contrast > 10) tags.push("high-contrast");

  return [...new Set(tags)];
}

/**
 * Fetch content using Node's https module — more reliable than Node's
 * built-in fetch for URL-encoded paths with spaces.
 */
function httpsGet(url: string, maxRedirects = 5): Promise<string> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error("Too many redirects"));
      return;
    }
    https
      .get(
        url,
        { headers: { "User-Agent": "ghostty-style-seeder/1.0" } },
        (res) => {
          // Follow redirects
          if (
            (res.statusCode === 301 || res.statusCode === 302) &&
            res.headers.location
          ) {
            httpsGet(res.headers.location, maxRedirects - 1).then(resolve).catch(reject);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          let data = "";
          res.on("data", (chunk: string) => (data += chunk));
          res.on("end", () => resolve(data));
          res.on("error", reject);
        }
      )
      .on("error", reject);
  });
}

async function fetchThemeContent(filename: string): Promise<string | null> {
  const encoded = encodeURIComponent(filename);
  const url = `https://raw.githubusercontent.com/mbadolato/iTerm2-Color-Schemes/master/ghostty/${encoded}`;
  try {
    return await httpsGet(url);
  } catch {
    return null;
  }
}

const FEATURED_SLUGS = new Set([
  "catppuccin-mocha",
  "dracula",
  "nord",
  "tokyonight",
  "rose-pine",
  "gruvbox-dark",
]);

async function main() {
  // Test Supabase connection first
  console.log("Testing Supabase connection...");
  const { error: testError } = await supabase
    .from("configs")
    .select("id")
    .limit(1);
  if (testError) {
    console.error(
      `ERROR: Cannot connect to Supabase: ${testError.message}\n` +
        "Make sure you've:\n" +
        "1. Created a Supabase project\n" +
        "2. Run the migration SQL in supabase/migrations/001_initial_schema.sql\n" +
        "3. Updated .env.local with correct credentials"
    );
    process.exit(1);
  }
  console.log("Supabase connection OK!\n");

  console.log(`Seeding ghostty.style with ${PRIORITY_THEMES.length} themes...\n`);

  let seeded = 0;
  let skipped = 0;
  let failed = 0;

  for (const themeName of PRIORITY_THEMES) {
    // Step 1: Fetch from GitHub
    const content = await fetchThemeContent(themeName);
    if (!content) {
      console.log(`  SKIP: ${themeName} (not found in repo)`);
      skipped++;
      continue;
    }

    // Step 2: Parse config
    const { config, errors } = parseGhosttyConfig(content);
    if (errors.length > 3) {
      console.log(
        `  SKIP: ${themeName} (${errors.length} parse errors)`
      );
      skipped++;
      continue;
    }

    const title = themeName.trim();
    const slug = generateSlug(title);

    // Step 3: Check for existing
    const { data: existing } = await supabase
      .from("configs")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      console.log(`  SKIP: ${title} (already exists as "${slug}")`);
      skipped++;
      continue;
    }

    // Step 4: Insert
    const tags = autoTag(title, config);

    const { error } = await supabase.from("configs").insert({
      slug,
      title,
      description: null,
      raw_config: content,
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
      tags,
      source_url: "https://github.com/mbadolato/iTerm2-Color-Schemes",
      author_name: "iTerm2-Color-Schemes",
      is_featured: FEATURED_SLUGS.has(slug),
      is_seed: true,
    });

    if (error) {
      console.log(`  FAIL: ${title} — ${error.message}`);
      failed++;
    } else {
      console.log(`  OK:   ${title} (${slug}) [${tags.join(", ")}]`);
      seeded++;
    }

    // Small delay to be nice to GitHub
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(
    `\n${"=".repeat(50)}\nDone! Seeded: ${seeded}, Skipped: ${skipped}, Failed: ${failed}\n`
  );
}

main().catch(console.error);
