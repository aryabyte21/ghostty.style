import Link from "next/link";
import { Upload, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import GhosttyLogo from "./ghostty-logo";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-lg hover:opacity-80 transition-opacity"
        >
          <GhosttyLogo size={28} />
          <span className="hidden sm:inline">
            ghostty<span className="text-muted-foreground">.style</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/browse">Browse</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/upload" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Submit
            </Link>
          </Button>

          <div className="w-px h-5 bg-border/50 mx-1 hidden sm:block" />

          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a
              href="https://github.com/ghostty-org/ghostty"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ghostty on GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
