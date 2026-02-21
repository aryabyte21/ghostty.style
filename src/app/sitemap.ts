import { MetadataRoute } from "next";
import { createServerClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerClient();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ghostty.style";

  // Supabase default limit is 1000 — explicitly set higher for sitemaps
  const { data: configs } = await supabase
    .from("configs")
    .select("slug, updated_at")
    .order("created_at", { ascending: false })
    .limit(50000);

  const configEntries: MetadataRoute.Sitemap = (configs || []).map((c) => ({
    url: `${baseUrl}/config/${c.slug}`,
    lastModified: c.updated_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/upload`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...configEntries,
  ];
}
