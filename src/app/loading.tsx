export default function HomeLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="relative overflow-hidden border-b border-border/50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="h-10 w-80 bg-muted rounded mx-auto" />
          <div className="h-5 w-96 bg-muted rounded mx-auto" />
          <div className="flex justify-center gap-3 mt-6">
            <div className="h-10 w-28 bg-muted rounded-md" />
            <div className="h-10 w-32 bg-muted rounded-md" />
          </div>
        </div>
      </div>

      {/* Featured configs skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-6 w-40 bg-muted rounded mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/30 overflow-hidden">
              <div className="h-[180px] bg-muted/70" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="flex gap-2">
                  <div className="h-5 w-12 bg-muted rounded-full" />
                  <div className="h-5 w-16 bg-muted rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
