import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createHash } from "crypto";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getVoterHash(request: NextRequest): string {
  const ip = getClientIp(request);
  const ua = request.headers.get("user-agent") || "unknown";
  return createHash("sha256").update(`${ip}:${ua}`).digest("hex");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip, { name: "vote", maxRequests: 60, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid config ID" }, { status: 400 });
  }
  const supabase = createServerClient();
  const voterHash = getVoterHash(request);

  const { error } = await supabase
    .from("votes")
    .insert({ config_id: id, voter_hash: voterHash });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Already voted", voted: true },
        { status: 409 }
      );
    }
    console.error("Vote error:", error.message);
    return NextResponse.json({ error: "Failed to record vote" }, { status: 500 });
  }

  const { data: config } = await supabase
    .from("configs")
    .select("vote_count")
    .eq("id", id)
    .single();

  return NextResponse.json({
    voteCount: config?.vote_count || 0,
    voted: true,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip, { name: "vote", maxRequests: 60, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid config ID" }, { status: 400 });
  }
  const supabase = createServerClient();
  const voterHash = getVoterHash(request);

  const { error } = await supabase
    .from("votes")
    .delete()
    .eq("config_id", id)
    .eq("voter_hash", voterHash);

  if (error) {
    console.error("Vote delete error:", error.message);
    return NextResponse.json({ error: "Failed to remove vote" }, { status: 500 });
  }

  const { data: config } = await supabase
    .from("configs")
    .select("vote_count")
    .eq("id", id)
    .single();

  return NextResponse.json({
    voteCount: config?.vote_count || 0,
    voted: false,
  });
}
