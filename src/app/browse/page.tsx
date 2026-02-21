import { Suspense } from "react";
import { Metadata } from "next";
import BrowseContent from "./browse-content";

export const metadata: Metadata = {
  title: "Browse Ghostty Configs",
  description:
    "Browse and discover beautiful Ghostty terminal configurations. Filter by dark, light, minimal, colorful, and more.",
};

export default function BrowsePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Browse Configs</h1>
      <Suspense fallback={<BrowseSkeleton />}>
        <BrowseContent />
      </Suspense>
    </div>
  );
}

function BrowseSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter bar skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="h-10 w-64 bg-muted rounded-md animate-pulse" />
        <div className="h-10 w-28 bg-muted rounded-md animate-pulse" />
        <div className="h-10 w-36 bg-muted rounded-md animate-pulse" />
      </div>
      {/* Tags skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-6 w-16 bg-muted rounded-full animate-pulse" />
        ))}
      </div>
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-border/50">
            <div className="h-[180px] bg-muted animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
              <div className="flex gap-1.5">
                <div className="h-5 w-12 bg-muted rounded-full animate-pulse" />
                <div className="h-5 w-10 bg-muted rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
