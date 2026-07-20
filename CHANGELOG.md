# Changelog

Notable changes to Off Mute. Newest first. Dates are `YYYY-MM-DD`.

The original requirements (BMAD planning artifacts — PRD, UX, architecture
spine, epics) are kept in a separate private planning repo, frozen at their
2026-07-16 authoring date. **The code in this repo is the source of truth**;
this log records every deviation made since, and those specs have been edited in
place (with dated `[Updated …]` notes) to match the code.

## 2026-07-20

### Added — engineering & tooling

- **Per-riff social preview images.** Each `/r/<code>` permalink now unfurls with
  its own branded card (the actual exchange, in the cream + green editorial
  style) instead of one generic site card. Generated at build time by
  `scripts/generate-og.mjs` (satori → SVG with text as vector paths → sharp →
  PNG in `dist/og/`); no runtime, service, or cost. `og:image` / `twitter:image`
  on riff pages point at the per-riff PNG; the homepage keeps the site-wide card.
  - New deps: `satori`, `sharp`, `@fontsource/newsreader` (build-time).
  - `ReaderLayout.astro` gained an `ogImagePath` prop; `build` now runs the
    generator after `astro build`.

- **CI pipeline + Lighthouse budgets.** `.github/workflows/ci.yml` runs on every
  push/PR: type-check (`astro check`) → build (validate + OG) → internal-link
  check (linkinator) → Lighthouse audit asserting **100/100/100/100**
  (performance ≥ 0.95, accessibility / best-practices / SEO = 1.0) via
  `lighthouserc.json`. Added `npm run check` and dev deps `@astrojs/check`,
  `typescript`. README shows the CI + Lighthouse badges.

### Changed — accessibility

- **Modal dialogs (About / Share) are now properly accessible** (`reader.ts`):
  focus moves into the dialog on open, Tab is trapped inside it, the rest of the
  page is set `inert`, and focus returns to the triggering button on close.
- **Fixed a keyboard trap on the Space shortcut.** Space advanced the riff even
  when a button had focus, so it double-fired (advance + activate). Space now
  advances only when focus is not on a control; ArrowRight stays a global "next".
- **Darkened `--muted`** `#7C7568` → `#70695E` so label / ghost-button / tagline
  text clears WCAG AA on paper (was 3.95:1, now 4.7:1). Verified: all four
  Lighthouse categories score 100, including accessibility.
- Added a `prefers-reduced-motion` safety net in `tokens.css`.

### Changed — behavior

- **Riff randomization is now a shuffle-bag** (`offmute/src/scripts/reader.ts`).
  Previously Next drew uniformly at random with replacement, remembering only
  the single previous riff — which allowed A→B→A oscillation and frequent
  near-repeats within a few clicks. Now the active pool is dealt out in a random
  (Fisher-Yates) order and only reshuffled once exhausted, so no riff repeats
  until every other riff in the pool has been shown. Seams are guarded against
  an immediate repeat at both the reshuffle boundary and after Back navigation;
  changing the Stakeholder filter clears the bag so it reshuffles from the new
  pool.
  - Specs updated: architecture spine **AD-5**, PRD **FR-2**, `epics.md`
    (AD-5 summary + Story 1.5 acceptance criteria).
  - Still satisfies the original "no immediate repeat (pool > 1)" criterion —
    strengthened to "no repeat within a full pass."

- **Stakeholder filter now applies immediately, not on the next Next.** Tapping
  a chip swaps in a fresh riff drawn from the newly selected pool right away
  (`reader.ts` chip handler). The original specs said the current riff stays put
  and the filter takes effect on the next Next; the code was chosen as truth.
  - Specs updated: architecture spine **AD-5**, PRD **FR-3** (§4.2), `epics.md`
    (FR3 inventory, AD-5 summary, Story 2.1 acceptance criteria), UX
    **EXPERIENCE.md** primitives table.

### Changed — branding (code + brand assets are truth)

- **Primary structure color changed from near-black `#14110D` to dark green
  `#183D2B`** (`offmute/src/styles/tokens.css`, `--structure`). It's now the
  main brand color: masthead slab, active chip, Next button, heavy rules, and
  the saved-image brand text. The original "stark black newsprint" identity is
  now dark-green newsprint.
  - Specs updated: UX **DESIGN.md** (frontmatter description, `structure` token,
    Brand & Style + Colors prose, component list, single-theme/WCAG note),
    `epics.md` (UX-DR1 palette, UX-DR2, UX-DR4, Story 1.3 acceptance criteria).
  - NOTE: reverify WCAG AA of cream `on-structure #F4EEE1` on green `#183D2B`
    (should pass comfortably given the low luminance of the green).

- **Masthead wordmark changed from "Off Mute" to "PM Off Mute"**
  (`Masthead.astro`; also the saved-image brand text in `reader.ts`).
  - Specs updated: UX **DESIGN.md** (Masthead component), `epics.md` (UX-DR2,
    Story 1.3 acceptance criteria).
  - The product/site name elsewhere (share text, `<title>`, About prose,
    copyright mark) remains "Off Mute"; only the masthead lockup gained the "PM".

- **Copyright mark on saved images dropped the author name.** Exported card
  footer changed from `© Off Mute: Dark PM Comedy by Eva Gao` to
  `© Off Mute: Dark PM Comedy` (`offmute/src/lib/site.ts`, `COPYRIGHT`).
  - Resolves PRD **Open Q1** (exact copyright text) and the FR-7 assumption.
  - The About panel's legal text (`ReaderLayout.astro`) still credits Eva Gao;
    only the image mark changed.

- **Brand assets added** (2026-07-17): `offmute/brand/` LinkedIn banners
  (`banner-4-editorial`, `banner-5-wordmark`) and `logo-green-300.png`, using
  the dark-green brand color and the "PM Off Mute" lockup.

### Known stale artifacts (illustrative only, not requirements)

- The UX **HTML mockups** still hardcode the old `#14110D` and, where present,
  the "Off Mute" wordmark:
  `ux-designs/ux-riff-2026-07-16/mockups/*.html` and `.working/*.html`.
  These are design-time renderings, not the spec of record (DESIGN.md tokens
  win on conflict). Left unchanged; regenerate if a fresh visual reference is
  needed.
