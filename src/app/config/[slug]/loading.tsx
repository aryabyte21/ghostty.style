export default function ConfigDetailLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-28 bg-muted rounded mb-6" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-4 w-96 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-16 bg-muted rounded-md" />
          <div className="h-9 w-20 bg-muted rounded-md" />
          <div className="h-9 w-36 bg-muted rounded-md" />
        </div>
      </div>

      {/* Terminal preview skeleton */}
      <div className="mb-6 rounded-xl overflow-hidden border border-border/30">
        <div className="h-[38px] bg-muted" />
        <div className="h-[420px] bg-muted/70" />
      </div>

      {/* Install command */}
      <div className="h-9 w-32 bg-muted rounded-md mb-6" />

      {/* Colors */}
      <div className="mb-8 space-y-4">
        <div className="h-4 w-16 bg-muted rounded" />
        <div className="flex gap-3">
          <div className="h-10 w-36 bg-muted rounded-lg" />
          <div className="h-10 w-36 bg-muted rounded-lg" />
          <div className="h-10 w-36 bg-muted rounded-lg" />
        </div>
        <div className="h-8 w-full bg-muted rounded-lg" />
      </div>

      {/* Metadata */}
      <div className="flex gap-3 mb-8">
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-4 w-16 bg-muted rounded" />
      </div>

      {/* Raw config */}
      <div className="mb-12">
        <div className="h-4 w-24 bg-muted rounded mb-2" />
        <div className="h-48 w-full bg-muted rounded-xl" />
      </div>
    </div>
  );
}
