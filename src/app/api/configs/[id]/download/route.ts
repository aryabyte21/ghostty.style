import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { cleanRawConfig } from "@/lib/config-parser";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid config ID" }, { status: 400 });
  }
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("configs")
    .select("raw_config, slug")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Config not found" }, { status: 404 });
  }

  // Increment download count atomically (fire and forget — non-blocking)
  void supabase.rpc("increment_download_count", { config_id: id });

  // Clean the config: strip comments so Ghostty can parse it directly.
  // Existing DB entries may contain inline comments from before the upload
  // cleaning was added; new entries are already clean but cleaning is
  // idempotent so this is safe for both.
  const cleaned = cleanRawConfig(data.raw_config);

  return new NextResponse(cleaned, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="ghostty-${data.slug.replace(/[^a-z0-9-]/g, "")}.conf"`,
      "Cache-Control": "no-cache",
    },
  });
}
