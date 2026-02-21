import Hero from "@/components/hero";
import ConfigGrid from "@/components/config-grid";
import { createServerClient } from "@/lib/supabase/server";
import { mapRowToConfig } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createServerClient();

  // Parallelize both queries — they're independent
  const [{ data: featuredRows }, { data: trendingRows }] = await Promise.all([
    supabase
      .from("configs")
      .select("*")
      .eq("is_featured", true)
      .order("vote_count", { ascending: false })
      .limit(3),
    supabase
      .from("configs")
      .select("*")
      .order("vote_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const featured = (featuredRows || []).map(mapRowToConfig);
  const trending = (trendingRows || []).map(mapRowToConfig);

  const displayFeatured = featured.length > 0 ? featured : trending.slice(0, 3);
  const displayTrending = featured.length > 0 ? trending : trending.slice(3);

  return (
    <div className="animate-fade-in">
      <Hero />

      {displayFeatured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-xl font-semibold">Featured</h2>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <ConfigGrid configs={displayFeatured} />
        </section>
      )}

      {displayTrending.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 flex-1">
              <h2 className="text-xl font-semibold">Popular Configs</h2>
              <div className="flex-1 h-px bg-border/50" />
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/browse" className="gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ConfigGrid configs={displayTrending} />
        </section>
      )}

      {displayFeatured.length === 0 && displayTrending.length === 0 && (
        <section className="max-w-7xl mx-auto px-4 pt-20 pb-12 text-center">
          <p className="text-muted-foreground text-lg">
            No configs yet. Be the first to{" "}
            <Link href="/upload" className="text-primary underline">
              submit one
            </Link>
            !
          </p>
        </section>
      )}
    </div>
  );
}
