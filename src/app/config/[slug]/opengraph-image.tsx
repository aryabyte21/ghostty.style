import { ImageResponse } from "next/og";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "edge";
export const alt = "Ghostty Config Preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Reject obviously invalid slugs early to avoid unnecessary DB queries
  if (!slug || slug.length > 100 || !/^[a-z0-9-]+$/.test(slug)) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", backgroundColor: "#1e1e2e", color: "#cdd6f4", fontSize: 40 }}>
          ghostty.style
        </div>
      ),
      size
    );
  }
  const supabase = createServerClient();
  const { data } = await supabase
    .from("configs")
    .select("title, background, foreground, palette, vote_count, download_count")
    .eq("slug", slug)
    .single();

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#1e1e2e",
            color: "#cdd6f4",
            fontSize: 40,
          }}
        >
          ghostty.style
        </div>
      ),
      size
    );
  }

  const DEFAULT_PALETTE = [
    "#282c34", "#e06c75", "#98c379", "#e5c07b", "#61afef", "#c678dd", "#56b6c2", "#abb2bf",
    "#545862", "#e06c75", "#98c379", "#e5c07b", "#61afef", "#c678dd", "#56b6c2", "#c8ccd4",
  ];
  const rawPalette: string[] = data.palette || [];
  const palette = rawPalette.length >= 16
    ? rawPalette.slice(0, 16)
    : [...rawPalette, ...DEFAULT_PALETTE.slice(rawPalette.length)].slice(0, 16);
  const bg = data.background;
  const fg = data.foreground;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#0a0a0a",
          padding: "40px",
        }}
      >
        {/* Terminal window */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid #333",
          }}
        >
          {/* Title bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 20px",
              backgroundColor: bg,
              borderBottom: "1px solid #333",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "6px",
                  backgroundColor: "#ff5f57",
                }}
              />
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "6px",
                  backgroundColor: "#febc2e",
                }}
              />
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "6px",
                  backgroundColor: "#28c840",
                }}
              />
            </div>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                color: fg,
                fontSize: 14,
                opacity: 0.6,
              }}
            >
              {data.title} — ghostty
            </div>
          </div>

          {/* Terminal body */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: "24px 28px",
              backgroundColor: bg,
              color: fg,
              fontSize: 16,
              lineHeight: "1.6",
              fontFamily: "monospace",
            }}
          >
            {/* Prompt */}
            <div style={{ display: "flex" }}>
              <span style={{ color: palette[2] || "#98c379" }}>user</span>
              <span>@</span>
              <span style={{ color: palette[4] || "#61afef" }}>ghost</span>
              <span> ~ $ neofetch</span>
            </div>
            <div style={{ height: "16px" }} />

            {/* Info lines */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex" }}>
                <span style={{ color: palette[4] || "#61afef", width: "100px" }}>Terminal</span>
                <span>: ghostty</span>
              </div>
              <div style={{ display: "flex" }}>
                <span style={{ color: palette[4] || "#61afef", width: "100px" }}>Theme</span>
                <span>: {data.title}</span>
              </div>
            </div>
            <div style={{ height: "16px" }} />

            {/* Color blocks */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex" }}>
                {palette.slice(0, 8).map((color: string, i: number) => (
                  <div
                    key={i}
                    style={{
                      width: "40px",
                      height: "24px",
                      backgroundColor: color,
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex" }}>
                {palette.slice(8, 16).map((color: string, i: number) => (
                  <div
                    key={i}
                    style={{
                      width: "40px",
                      height: "24px",
                      backgroundColor: color,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "16px",
            color: "#888",
            fontSize: 18,
          }}
        >
          <span style={{ fontWeight: 700, color: "#fff" }}>
            ghostty.style
          </span>
          <span>
            {data.vote_count} votes · {data.download_count} downloads
          </span>
        </div>
      </div>
    ),
    size
  );
}
