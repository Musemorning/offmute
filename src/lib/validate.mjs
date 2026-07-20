// Build-time content gate for Off Mute (Story 1.2, architecture AD-6).
// Runs before `astro build`; a non-zero exit fails the build and blocks deploy.
import { readFileSync } from 'node:fs';

const STAKEHOLDERS = new Set(['Sales', 'CS', 'Exec']);
const ALLOWED = ['code', 'stakeholder', 'prompt', 'comeback', 'retired'];
const url = new URL('../data/riffs.json', import.meta.url);

let riffs;
try {
  riffs = JSON.parse(readFileSync(url, 'utf8'));
} catch (e) {
  console.error('✗ riffs.json is missing or not valid JSON:', e.message);
  process.exit(1);
}
if (!Array.isArray(riffs)) {
  console.error('✗ riffs.json must be a JSON array.');
  process.exit(1);
}

const errors = [];
const seen = new Map();

riffs.forEach((r, i) => {
  const where = `riff #${i}${r && r.code ? ` (code "${r.code}")` : ''}`;
  if (typeof r !== 'object' || r === null) {
    errors.push(`${where}: not an object`);
    return;
  }
  for (const field of ['code', 'stakeholder', 'prompt', 'comeback']) {
    if (typeof r[field] !== 'string' || r[field].trim() === '') {
      errors.push(`${where}: missing or empty "${field}"`);
    }
  }
  if (r.stakeholder && !STAKEHOLDERS.has(r.stakeholder)) {
    errors.push(`${where}: stakeholder "${r.stakeholder}" must be one of Sales, CS, Exec`);
  }
  if ('retired' in r && typeof r.retired !== 'boolean') {
    errors.push(`${where}: "retired" must be a boolean if present`);
  }
  for (const k of Object.keys(r)) {
    if (!ALLOWED.includes(k)) errors.push(`${where}: unexpected field "${k}"`);
  }
  if (typeof r.code === 'string' && r.code !== '') {
    if (seen.has(r.code)) errors.push(`${where}: duplicate code (also riff #${seen.get(r.code)})`);
    else seen.set(r.code, i);
  }
});

if (errors.length) {
  console.error(`✗ riffs.json failed validation (${errors.length} problem(s)):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

console.log(`✓ riffs.json valid: ${riffs.length} riffs, ${seen.size} unique codes.`);
