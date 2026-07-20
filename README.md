# Off Mute

[![CI](https://github.com/Musemorning/offmute/actions/workflows/ci.yml/badge.svg)](https://github.com/Musemorning/offmute/actions/workflows/ci.yml)
![Lighthouse 100](https://img.shields.io/badge/Lighthouse-100%20%C3%97%204-183D2B)
![Zero JS frameworks](https://img.shields.io/badge/runtime-one%20vanilla%20island-183D2B)

The questions every PM dreads, and the comebacks you wish you'd sent. One riff per screen.

A tiny static site built with [Astro](https://astro.build). No backend, no database, no accounts. Content lives in one JSON file; deploys free to Cloudflare. Ships zero framework JavaScript: a single hand-written vanilla island (`src/scripts/reader.ts`) drives the whole reader.

## Run locally

```bash
npm install
npm run dev        # http://localhost:4321
```

```bash
npm run build      # outputs static site to dist/
npm run preview    # preview the production build
```

## Deploy (Cloudflare Pages)

1. Push this repo to GitHub.
2. Cloudflare dashboard → **Workers & Pages → Create application → Pages → Connect to Git**.
3. Pick this repo. Framework preset: **Astro**. Build command `npm run build`, output directory `dist`. Deploy.
4. Name the project **`offmute`** to serve at `offmute.pages.dev`.

Every push to `main` rebuilds and redeploys automatically. The build is fully static, so it also deploys unchanged to Cloudflare Workers static assets if you ever prefer that.

## Quality checks

Run the same gate CI runs, locally:

```bash
npm run check      # type-check Astro + TypeScript
npm run build      # validate content, build, generate per-riff OG images
npm run og         # regenerate social cards only (into dist/og/)
```

The [CI workflow](.github/workflows/ci.yml) runs on every push and PR: type-check → build → internal-link check → a **Lighthouse audit that asserts 100/100/100/100** (performance, accessibility, best-practices, SEO). It's a pre-flight check; Cloudflare still does the production build+deploy.

**Social preview images.** Every riff permalink (`/r/<code>`) unfurls on LinkedIn / Slack / X with its *own* branded card, showing that exchange. The cards are generated at build time by `scripts/generate-og.mjs` ([satori](https://github.com/vercel/satori) lays out the card and emits SVG with text as vector paths; [sharp](https://sharp.pixelplumbing.com) rasterises to PNG) into `dist/og/`. No runtime, no service, no cost. Add a riff, rebuild, its card appears.

## Add or edit a riff

Riffs live in `src/data/riffs.json` as objects:

```json
{ "code": "a7f", "stakeholder": "Sales", "prompt": "Can we fast-track it?", "comeback": "Sure, I'll put a little rocket emoji in the ticket." }
```

- `stakeholder` must be exactly `Sales`, `CS`, or `Exec`.
- `code` is the permalink (`/r/<code>`): unique, lowercase, **never reused or changed**.
- Edit the file (GitHub web editor works), commit, and Cloudflare redeploys in ~1 minute.
- A build-time check rejects a missing field, bad stakeholder, or duplicate code.

## Project structure

```
src/
  data/riffs.json          # the content
  pages/
    index.astro            # landing / reader
    r/[code].astro         # per-riff permalink pages (prerendered)
    404.astro              # graceful retired/unknown fallback
  layouts/ReaderLayout.astro  # page shell: head/meta, toolbar, overlays
  components/              # Masthead, RiffCard
  scripts/reader.ts        # the one vanilla client island
  lib/validate.mjs         # build-time content gate
  lib/site.ts              # shared constants (URLs, copyright)
  styles/tokens.css        # design tokens
scripts/generate-og.mjs    # build-time per-riff social cards → dist/og/
lighthouserc.json          # Lighthouse CI budgets (asserts 100s)
```

Built from the BMAD plan under `../_bmad-output/planning-artifacts/` (PRD, UX spines, architecture spine, epics).
