// The Reader island (architecture AD-4, AD-5, AD-7). One client module owning
// all reader behavior: random Next, Stakeholder filter, permalink routing,
// sharing, save-as-image, and the About panel. Reads riff data ONLY from the
// inline JSON read model; the DOM is presentation. No backend, no paid service.
import { toPng } from 'html-to-image';
import { SITE_URL, COPYRIGHT } from '../lib/site';

interface Riff {
  code: string;
  stakeholder: string;
  prompt: string;
  comeback: string;
}

const SERIF = 'Georgia, "Iowan Old Style", "Palatino Linotype", Palatino, "Times New Roman", serif';
const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

function initReader(): void {
  const byId = (id: string) => document.getElementById(id);
  const dataEl = byId('riffs-data');
  const card = byId('riff-card');
  const nextBtn = byId('next-btn');
  if (!dataEl || !card || !nextBtn) return;

  let riffs: Riff[] = [];
  try {
    riffs = JSON.parse(dataEl.textContent || '[]') as Riff[];
  } catch {
    return;
  }
  if (riffs.length === 0) return;

  const stakeEl = card.querySelector<HTMLElement>('.riff__stakeholder');
  const promptEl = card.querySelector<HTMLElement>('.riff__prompt');
  const comebackEl = card.querySelector<HTMLElement>('.riff__comeback');
  if (!stakeEl || !promptEl || !comebackEl) return;

  let filter = ''; // '' = All, else 'Sales' | 'CS' | 'Exec'
  let current = Math.max(0, riffs.findIndex((r) => r.code === card.dataset.code));

  const codeUrl = (code: string) => `${SITE_URL}/r/${code}`;

  function render(i: number, mode: 'push' | 'replace' | 'none' = 'none'): void {
    const r = riffs[i];
    stakeEl!.textContent = r.stakeholder.toUpperCase();
    promptEl!.textContent = r.prompt;
    comebackEl!.textContent = r.comeback;
    card!.dataset.code = r.code;
    const path = `/r/${r.code}`;
    if (mode === 'push') history.pushState({ code: r.code }, '', path);
    else if (mode === 'replace') history.replaceState({ code: r.code }, '', path);
  }

  function pool(): number[] {
    if (!filter) return riffs.map((_, i) => i);
    const idx: number[] = [];
    riffs.forEach((r, i) => { if (r.stakeholder === filter) idx.push(i); });
    return idx.length ? idx : riffs.map((_, i) => i);
  }

  // Shuffle-bag: deal out the whole pool in random order and only reshuffle
  // once it's empty, so no riff repeats until every other one has been shown.
  // Far less repetitive than uniform-with-replacement (AD-5: no immediate
  // repeat — here strengthened to no repeat within a full pass). Cleared on
  // filter change so it always draws from the current pool.
  let bag: number[] = [];

  function refillBag(): void {
    bag = pool();
    for (let k = bag.length - 1; k > 0; k--) {   // Fisher-Yates
      const j = Math.floor(Math.random() * (k + 1));
      [bag[k], bag[j]] = [bag[j], bag[k]];
    }
    // Avoid a seam repeat: don't let the new bag open with the riff just shown.
    // (We draw from the end via pop.)
    if (bag.length > 1 && bag[bag.length - 1] === current) {
      [bag[bag.length - 1], bag[0]] = [bag[0], bag[bag.length - 1]];
    }
  }

  function pickRandom(): number {
    const p = pool();
    if (p.length <= 1) return p[0] ?? current;      // single-riff set: re-serve
    if (bag.length === 0) refillBag();
    let next = bag.pop() ?? current;
    // Guard the back-navigation seam too: if history moved `current` onto the
    // bag's next item, take the following one and defer this draw.
    if (next === current && bag.length > 0) {
      const alt = bag.pop()!;
      bag.push(next);
      next = alt;
    }
    return next;
  }

  function goNext(): void {
    current = pickRandom();
    render(current, 'push');
  }

  // Canonicalize the landing URL to the current riff (AD-3).
  render(current, 'replace');

  // ---- Overlays (About + Share) ----
  // Accessible modals: focus moves into the dialog on open, Tab is trapped
  // inside it, the rest of the page is made inert (invisible to keyboard and
  // screen-reader alike), and focus returns to the trigger on close.
  const aboutOverlay = byId('about-overlay');
  const shareOverlay = byId('share-overlay');
  const isOpen = (o: HTMLElement | null) => !!o && !o.hasAttribute('hidden');
  const anyOverlayOpen = () => isOpen(aboutOverlay) || isOpen(shareOverlay);

  const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';
  const background = (Array.from(document.body.children) as HTMLElement[]).filter(
    (el) => el !== aboutOverlay && el !== shareOverlay
      && !(el instanceof HTMLScriptElement) && !(el instanceof HTMLStyleElement),
  );
  let lastTrigger: HTMLElement | null = null;

  const open = (o: HTMLElement | null, trigger?: HTMLElement | null) => {
    if (!o) return;
    lastTrigger = trigger ?? (document.activeElement as HTMLElement | null);
    background.forEach((el) => { el.inert = true; });
    o.removeAttribute('hidden');
    (o.querySelector<HTMLElement>(FOCUSABLE) ?? o).focus();
  };
  const close = (o: HTMLElement | null) => {
    if (!o || o.hasAttribute('hidden')) return;
    o.setAttribute('hidden', '');
    if (!anyOverlayOpen()) {
      background.forEach((el) => { el.inert = false; });
      const restore = lastTrigger && lastTrigger !== document.body ? lastTrigger : nextBtn;
      restore?.focus();
      lastTrigger = null;
    }
  };
  const closeAll = () => { close(aboutOverlay); close(shareOverlay); };
  [aboutOverlay, shareOverlay].forEach((o) => {
    if (o) o.addEventListener('click', (e) => { if (e.target === o) close(o); });
  });

  // Keep Tab focus inside whichever overlay is open.
  function trapTab(e: KeyboardEvent): void {
    const o = isOpen(aboutOverlay) ? aboutOverlay : shareOverlay;
    if (!o) return;
    const items = Array.from(o.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute('hidden') && el.offsetParent !== null,
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }

  // ---- Next + card + keyboard ----
  nextBtn.addEventListener('click', goNext);
  card.addEventListener('click', goNext);

  window.addEventListener('popstate', () => {
    const m = location.pathname.match(/\/r\/([^/]+)/);
    if (!m) return;
    const i = riffs.findIndex((r) => r.code === m[1]);
    if (i >= 0) { current = i; render(current); }
  });

  document.addEventListener('keydown', (e) => {
    if (anyOverlayOpen()) {
      if (e.key === 'Escape') closeAll();
      else if (e.key === 'Tab') trapTab(e);
      return;
    }
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    // Right arrow is a global "next" reading shortcut. Space advances too, but
    // only when focus is NOT on a control, so it still activates focused buttons.
    const onControl = !!(t && t.closest('button, a, [role="button"]'));
    if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    else if (e.key === ' ' && !onControl) { e.preventDefault(); goNext(); }
    else if (e.key === 'Escape') closeAll();
  });

  // ---- Stakeholder filter ----
  const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('.chip'));
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filter = chip.dataset.filter || '';
      bag = [];  // reshuffle from the newly selected pool
      chips.forEach((c) => {
        const on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      // Immediately show a fresh riff from the selected pool, so it's obvious
      // the filter applied (clearer than deferring to the next Next).
      goNext();
    });
  });

  // ---- About ----
  byId('about-btn')?.addEventListener('click', (e) => open(aboutOverlay, e.currentTarget as HTMLElement));
  byId('about-close')?.addEventListener('click', () => close(aboutOverlay));

  // ---- Share ----
  const shareText = () => `“${riffs[current].prompt}” — “${riffs[current].comeback}”`;
  const shareUrl = () => codeUrl(riffs[current].code);
  const setHref = (id: string, href: string) => {
    const el = byId(id) as HTMLAnchorElement | null;
    if (el) el.href = href;
  };
  byId('share-btn')?.addEventListener('click', () => {
    const url = shareUrl();
    const text = shareText();
    const eu = encodeURIComponent(url);
    setHref('share-x', `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${eu}`);
    setHref('share-li', `https://www.linkedin.com/sharing/share-offsite/?url=${eu}`);
    setHref('share-wa', `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
    setHref('share-email', `mailto:?subject=${encodeURIComponent('A riff from Off Mute')}&body=${encodeURIComponent(text + '\n\n' + url)}`);
    const nativeBtn = byId('share-native');
    if (nativeBtn) {
      if (typeof (navigator as unknown as { share?: unknown }).share === 'function') nativeBtn.removeAttribute('hidden');
      else nativeBtn.setAttribute('hidden', '');
    }
    open(shareOverlay, byId('share-btn'));
  });
  byId('share-close')?.addEventListener('click', () => close(shareOverlay));
  byId('share-native')?.addEventListener('click', async () => {
    try {
      await (navigator as unknown as { share: (d: object) => Promise<void> }).share({
        title: 'Off Mute', text: shareText(), url: shareUrl(),
      });
      close(shareOverlay);
    } catch { /* user cancelled */ }
  });
  byId('share-copy')?.addEventListener('click', async () => {
    const btn = byId('share-copy');
    try {
      await navigator.clipboard.writeText(shareUrl());
      if (btn) { const o = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => { if (btn) btn.textContent = o; }, 1200); }
    } catch { /* clipboard blocked */ }
  });

  // ---- Save as image ----
  byId('save-btn')?.addEventListener('click', async () => {
    const btn = byId('save-btn');
    const label = btn?.textContent;
    if (btn) btn.textContent = 'Saving…';
    const card = buildExportNode(riffs[current]);
    // Render on-screen at (0,0) but clipped by a 0x0 host, so the browser lays
    // it out fully (reliable capture) while it stays invisible to the user.
    const host = document.createElement('div');
    Object.assign(host.style, {
      position: 'fixed', top: '0', left: '0', width: '0', height: '0',
      overflow: 'hidden', zIndex: '-1',
    });
    host.appendChild(card);
    document.body.appendChild(host);
    try {
      if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch { /* ignore */ }
      }
      const opts = {
        pixelRatio: 4,
        backgroundColor: '#F4EEE1',
        width: card.offsetWidth,
        height: card.offsetHeight,
      };
      // html-to-image's first pass on a fresh node can come back blank; the
      // second pass renders the real content.
      await toPng(card, opts);
      const dataUrl = await toPng(card, opts);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `off-mute-${riffs[current].code}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('save-as-image failed', err);
    } finally {
      host.remove();
      if (btn) btn.textContent = label || 'Save';
    }
  });

  // ---- First-run About (non-blocking; a riff is already rendered behind) ----
  try {
    if (!localStorage.getItem('offmute-about-seen')) {
      open(aboutOverlay);
      localStorage.setItem('offmute-about-seen', '1');
    }
  } catch { /* storage unavailable: harmless */ }
}

// Off-screen shareable card for the PNG export (inline styles; scoped CSS
// would not apply to a dynamically created node). Uses textContent (no HTML).
function buildExportNode(r: Riff): HTMLElement {
  const wrap = document.createElement('div');
  Object.assign(wrap.style, {
    width: '600px', boxSizing: 'border-box', padding: '48px', background: '#F4EEE1',
  });

  const brand = document.createElement('div');
  brand.textContent = 'PM Off Mute';
  Object.assign(brand.style, {
    fontFamily: SERIF, fontWeight: '700', fontSize: '22px', color: '#183D2B',
    letterSpacing: '-0.01em', marginBottom: '32px',
  });

  const grid = document.createElement('div');
  Object.assign(grid.style, {
    display: 'grid', gridTemplateColumns: '70px 1fr', columnGap: '18px',
    rowGap: '30px', alignItems: 'baseline',
  });
  const label = (t: string): HTMLElement => {
    const s = document.createElement('div');
    s.textContent = t;
    Object.assign(s.style, {
      fontFamily: SANS, fontSize: '13px', fontWeight: '600', letterSpacing: '0.2em',
      textTransform: 'uppercase', color: '#7C7568', textAlign: 'right',
    });
    return s;
  };
  const prompt = document.createElement('div');
  prompt.textContent = r.prompt;
  Object.assign(prompt.style, { fontFamily: SERIF, fontSize: '24px', lineHeight: '1.25', color: '#1A1712' });
  const comeback = document.createElement('div');
  comeback.textContent = r.comeback;
  Object.assign(comeback.style, { fontFamily: SERIF, fontStyle: 'italic', fontSize: '24px', lineHeight: '1.3', color: '#1A1712' });
  grid.append(label(r.stakeholder.toUpperCase()), prompt, label('PM'), comeback);

  const foot = document.createElement('div');
  foot.textContent = COPYRIGHT; // "© Off Mute: Dark PM Comedy" — no URL
  Object.assign(foot.style, {
    fontFamily: SANS, fontSize: '13px', color: '#7C7568',
    marginTop: '40px', paddingTop: '18px', borderTop: '1px solid #B9AE96',
    letterSpacing: '0.02em',
  });

  wrap.append(brand, grid, foot);
  return wrap;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReader);
} else {
  initReader();
}
