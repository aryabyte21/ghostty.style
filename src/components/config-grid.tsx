import Link from "next/link";
import ConfigCard from "./config-card";
import { Upload } from "lucide-react";
import type { GhosttyConfig } from "@/types/config";

interface ConfigGridProps {
  configs: GhosttyConfig[];
}

export default function ConfigGrid({ configs }: ConfigGridProps) {
  if (configs.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">No configs found</p>
        <p className="text-sm mt-2">Try adjusting your filters or search query</p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary hover:underline"
        >
          <Upload className="h-3.5 w-3.5" />
          Submit your own config
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {configs.map((config, i) => (
        <ConfigCard key={config.id} config={config} index={i} />
      ))}
    </div>
  );
}
