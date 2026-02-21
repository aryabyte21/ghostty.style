import Link from "next/link";
import { Heart, Coffee } from "lucide-react";
import GhosttyLogo from "./ghostty-logo";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <GhosttyLogo size={18} />
            <span className="text-sm">
              ghostty.style — Discover beautiful Ghostty configs
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/ghostty-org/ghostty"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Ghostty
            </Link>
            <Link
              href="/browse"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/upload"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Submit
            </Link>
            <a
              href="https://ko-fi.com/arya400"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Coffee className="h-3.5 w-3.5" />
              Donate
            </a>
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Made with <Heart className="h-3 w-3 inline fill-red-500 text-red-500" /> by{" "}
          <a
            href="https://aryabhosale.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Arya
          </a>{" "}
          for the <a href="https://ghostty.org/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">Ghostty</a> community
        </div>
      </div>
    </footer>
  );
}
