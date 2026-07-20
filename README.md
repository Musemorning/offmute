# Off Mute

The questions every PM dreads, and the comebacks you wish you'd sent. One riff per screen.

A tiny static site built with [Astro](https://astro.build). No backend, no database, no accounts. Content lives in one JSON file; deploys free to Cloudflare.

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

## Add or edit a riff (once Story 1.2 lands)

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
  data/riffs.json        # the content (Story 1.2)
  pages/
    index.astro          # landing / reader (Story 1.1, 1.4, 1.5)
    r/[code].astro        # per-riff permalink pages (Story 2.2)
  components/             # RiffCard, About (Stories 1.4, 3.1)
  scripts/reader.ts        # the one client island (Stories 1.5, 2.x)
  lib/validate.ts          # build-time content gate (Story 1.2)
  styles/tokens.css        # design tokens (Stories 1.1, 1.3)
```

Built from the BMAD plan under `../_bmad-output/planning-artifacts/` (PRD, UX spines, architecture spine, epics).
