import { defineConfig } from 'astro/config';

// Off Mute is a fully static site (SSG). No adapter is needed:
// `astro build` emits a plain static `dist/` that deploys to Cloudflare
// Pages (zero config) or Workers static assets. See ARCHITECTURE-SPINE.md.
export default defineConfig({
  // Update to the custom domain later if you add one.
  site: 'https://offmute.pages.dev',
});
