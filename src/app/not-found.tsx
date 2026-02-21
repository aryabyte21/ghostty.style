import Link from "next/link";
import { Button } from "@/components/ui/button";
import GhosttyLogo from "@/components/ghostty-logo";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <GhosttyLogo size={64} className="mb-4 opacity-50" />
      <h1 className="text-2xl font-bold mb-2">404 — Not Found</h1>
      <p className="text-muted-foreground mb-6">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/browse">Browse Configs</Link>
        </Button>
      </div>
    </div>
  );
}
