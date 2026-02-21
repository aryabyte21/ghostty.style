import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PlausibleProvider from "next-plausible";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ghostty.style — Discover Beautiful Ghostty Terminal Configs",
    template: "%s | ghostty.style",
  },
  description:
    "Browse, preview, and download community-shared Ghostty terminal configurations. See exactly how your terminal will look before applying any config.",
  keywords: [
    "ghostty",
    "terminal",
    "config",
    "theme",
    "color scheme",
    "terminal emulator",
  ],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "ghostty.style",
    title: "ghostty.style — Discover Beautiful Ghostty Terminal Configs",
    description:
      "Browse, preview, and download community-shared Ghostty terminal configurations.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ghostty.style — Discover Beautiful Ghostty Terminal Configs",
    description:
      "Browse, preview, and download community-shared Ghostty terminal configurations.",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <PlausibleProvider domain="ghostty.style" selfHosted enabled={process.env.NODE_ENV === "production"}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm"
          >
            Skip to main content
          </a>
          <Header />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
        </PlausibleProvider>
        <Analytics />
      </body>
    </html>
  );
}
