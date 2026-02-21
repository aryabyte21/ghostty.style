import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, Upload, Sparkles, Terminal } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Gradient background with subtle glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.03] blur-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

      <div className="relative max-w-3xl mx-auto text-center px-4">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6">
          <Sparkles className="h-3 w-3" />
          Community-driven Ghostty themes
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          Beautiful configs for{" "}
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Ghostty
          </span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Discover, preview, and download terminal configurations shared by the
          community. See exactly how your terminal will look before applying.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/browse" className="gap-2">
              <Search className="h-4 w-4" />
              Browse Configs
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Submit Yours
            </Link>
          </Button>
        </div>
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Terminal className="h-3 w-3" />
            Realistic terminal previews
          </span>
          <span className="hidden sm:inline text-border">·</span>
          <span className="hidden sm:flex items-center gap-1.5">
            Split panes &amp; keyboard shortcuts
          </span>
          <span className="hidden sm:inline text-border">·</span>
          <span className="hidden sm:flex items-center gap-1.5">
            One-click download
          </span>
        </div>
      </div>
    </section>
  );
}
