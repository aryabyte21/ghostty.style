export default function BrowseLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Search bar skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="h-10 bg-muted/30 rounded-md flex-1 max-w-md animate-pulse" />
        <div className="h-10 w-28 bg-muted/30 rounded-md animate-pulse" />
        <div className="h-10 w-36 bg-muted/30 rounded-md animate-pulse" />
      </div>
      {/* Tags skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-6 w-16 rounded-full bg-muted/30 animate-pulse" />
        ))}
      </div>
      {/* Grid skeleton */}
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
    </div>
  );
}
