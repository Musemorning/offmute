// Per-riff social preview images (craft feature, 2026-07-20).
//
// For every active riff we render a 1200x630 branded card as a PNG so that a
// shared /r/<code> link unfurls on LinkedIn / Slack / X / iMessage showing the
// actual exchange, not a generic logo. Everything happens at BUILD TIME with
// no browser and no paid service:
//
//   satori  — lays out an HTML/flexbox tree and emits an SVG whose text is
//             already converted to vector glyph paths (so the raster step needs
//             no fonts and stays crisp at any size).
//   sharp   — rasterises that SVG to PNG (already present via Astro).
//
// Runs AFTER `astro build`, writing into dist/og/<code>.png. It exits non-zero
// on failure so a broken pipeline is caught in local preview / CI rather than
// shipping a link that unfurls a 404 image. Add a riff, rebuild, done.
import satori from 'satori';
import sharp from 'sharp';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const OUT_DIR = fileURLToPath(new URL('dist/og/', ROOT));
const FONT_DIR = fileURLToPath(new URL('node_modules/@fontsource/newsreader/files/', ROOT));

// Brand tokens (kept in sync with src/styles/tokens.css).
const PAPER = '#F4EEE1';
const INK = '#1A1712';
const GREEN = '#183D2B';
const MUTED = '#70695E';
const HAIRLINE = '#B9AE96';
const COPYRIGHT = '© Off Mute: Dark PM Comedy';

const font = (file) => readFileSync(FONT_DIR + file);
const FONTS = [
  { name: 'Newsreader', data: font('newsreader-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'Newsreader', data: font('newsreader-latin-400-italic.woff'), weight: 400, style: 'italic' },
  { name: 'Newsreader', data: font('newsreader-latin-600-normal.woff'), weight: 600, style: 'normal' },
];

// A tiny hyperscript so the element tree reads top-down instead of as nested
// object literals. Satori only does flexbox layout, so containers are flex.
const h = (style, children) => ({ type: 'div', props: { style, children } });
const text = (style, value) => ({ type: 'div', props: { style, children: value } });

// One transcript row: a right-aligned speaker label in a fixed gutter, then the
// line sharing the text column's left edge — the same grammar as the on-site card.
function exchange(label, line, { italic, size }) {
  return h(
    { display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: 24, width: '100%' },
    [
      text(
        {
          width: 132,
          flexShrink: 0,
          textAlign: 'right',
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: '0.18em',
          color: MUTED,
        },
        label.toUpperCase(),
      ),
      text(
        {
          display: 'flex',
          flex: 1,
          fontSize: size,
          lineHeight: 1.28,
          color: INK,
          fontStyle: italic ? 'italic' : 'normal',
          fontWeight: 400,
        },
        line,
      ),
    ],
  );
}

function card(riff) {
  // Scale the riff text down for the wordier exchanges so nothing overflows the
  // fixed 630px canvas. Longest live pair is ~143 chars; these steps keep even
  // that comfortably inside two multi-line blocks.
  const load = riff.prompt.length + riff.comeback.length;
  const size = load <= 90 ? 46 : load <= 120 ? 40 : 34;

  return h(
    {
      width: 1200,
      height: 630,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '72px 80px',
      background: PAPER,
      fontFamily: 'Newsreader',
    },
    [
      // Masthead: wordmark + a hairline rule, echoing the newsprint header.
      h({ display: 'flex', flexDirection: 'column' }, [
        text(
          { fontSize: 30, fontWeight: 600, color: GREEN, letterSpacing: '-0.01em' },
          'PM Off Mute',
        ),
        h({ display: 'flex', height: 3, background: GREEN, marginTop: 16, width: 96 }, []),
      ]),
      // The exchange.
      h({ display: 'flex', flexDirection: 'column', gap: 40, paddingTop: 8, paddingBottom: 8 }, [
        exchange(riff.stakeholder, riff.prompt, { italic: false, size }),
        exchange('PM', riff.comeback, { italic: true, size }),
      ]),
      // Footer credit.
      h({ display: 'flex', flexDirection: 'column' }, [
        h({ display: 'flex', height: 1, background: HAIRLINE, marginBottom: 18 }, []),
        text({ fontSize: 17, color: MUTED, letterSpacing: '0.02em' }, COPYRIGHT),
      ]),
    ],
  );
}

async function main() {
  const riffs = JSON.parse(readFileSync(fileURLToPath(new URL('src/data/riffs.json', ROOT)), 'utf8'));
  const active = riffs.filter((r) => !r.retired);
  mkdirSync(OUT_DIR, { recursive: true });

  let written = 0;
  for (const riff of active) {
    const svg = await satori(card(riff), { width: 1200, height: 630, fonts: FONTS });
    const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
    writeFileSync(OUT_DIR + `${riff.code}.png`, png);
    written++;
  }
  console.log(`✓ OG images: ${written} riff cards → dist/og/`);
}

main().catch((err) => {
  console.error('✗ OG image generation failed:', err && err.stack ? err.stack : err);
  process.exit(1);
});
