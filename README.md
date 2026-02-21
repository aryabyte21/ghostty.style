<p align="center">
  <img src="public/favicon.svg" width="80" alt="ghostty.style logo" />
</p>

<h1 align="center">ghostty.style</h1>

<p align="center">
  <strong>Browse, preview, and install community-made <a href="https://ghostty.org">Ghostty</a> terminal themes.</strong>
</p>

<p align="center">
  <a href="https://ghostty.style">Live Site</a> &nbsp;·&nbsp;
  <a href="https://ghostty.style/browse">Browse Themes</a> &nbsp;·&nbsp;
  <a href="https://ghostty.style/upload">Submit a Theme</a> &nbsp;·&nbsp;
  <a href="https://ko-fi.com/arya400">Donate</a>
</p>

---

## What is this?

**ghostty.style** is an open-source, community-driven gallery for [Ghostty](https://ghostty.org) terminal configurations. It lets you:

- **Preview themes in a realistic terminal** — complete with split panes, neofetch output, and cursor styles
- **Install with one command** — a single `curl` command downloads the theme and adds it to your Ghostty config
- **Upload and share your own themes** — with real-time validation against the official [Ghostty config reference](https://ghostty.org/docs/config/reference)
- **Browse, search, filter, and vote** — find the perfect theme by color, tags, popularity, or light/dark mode

## Features

- **Live terminal preview** with interactive split panes and keyboard shortcuts (`Cmd+D` / `Ctrl+D`)
- **One-command install** — `curl` downloads the theme, creates the directory, and sets it in your config
- **Config validation** — catches errors before upload: invalid keys, bad hex colors, wrong enum values, out-of-range numbers, inline comments, and more
- **Full-text search** with tag filtering, dark/light toggle, and sort options
- **Community voting** to surface the best themes
- **OG image generation** for social media sharing
- **Responsive** and fully accessible (keyboard navigation, skip links, screen reader support)
- **Security hardened** — RLS policies, rate limiting, atomic counters, security headers

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, React 19) |
| Database | [Supabase](https://supabase.com) (Postgres + Row Level Security) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| Icons | [Lucide](https://lucide.dev) |
| Analytics | [Plausible](https://plausible.io) (privacy-friendly) |
| Deployment | [Vercel](https://vercel.com) |
