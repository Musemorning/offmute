# Changelog

Notable changes to Off Mute. Newest first. Dates are `YYYY-MM-DD`.

The original requirements (BMAD planning artifacts — PRD, UX, architecture
spine, epics) are kept in a separate private planning repo, frozen at their
2026-07-16 authoring date. **The code in this repo is the source of truth**;
this log records every deviation made since, and those specs have been edited in
place (with dated `[Updated …]` notes) to match the code.

## 2026-07-20

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
