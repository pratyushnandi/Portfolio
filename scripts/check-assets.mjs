// Fails CI when index.html or style.css points at a local file that is not in the repo
// (renamed CV, moved image, typo in a certificate path…). External URLs are not
// fetched here — they are flaky in CI and out of our control.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i; // http:, mailto:, tel:, data:, about:, //cdn, #anchor

const sources = {
  'index.html': [
    /\b(?:src|href)\s*=\s*"([^"]+)"/g,
    /openPcModal\(\s*'([^']+)'/g
  ],
  'style.css': [/url\(\s*['"]?([^'")]+)['"]?\s*\)/g]
};

const missing = [];
let checked = 0;
for (const [file, patterns] of Object.entries(sources)) {
  const text = readFileSync(resolve(root, file), 'utf8');
  for (const re of patterns) {
    for (const [, ref] of text.matchAll(re)) {
      if (SKIP.test(ref)) continue;
      const decoded = decodeURIComponent(ref);
      // url(%23id) inside an inline SVG data URI is a fragment, not a file.
      if (decoded.startsWith('#')) continue;
      const path = decoded.split(/[?#]/)[0];
      if (!path) continue;
      checked++;
      if (!existsSync(resolve(root, path))) missing.push(`${file}: ${ref}`);
    }
  }
}
for (const f of ['robots.txt', 'sitemap.xml']) {
  checked++;
  if (!existsSync(resolve(root, f))) missing.push(`(required) ${f}`);
}

// icons.css is generated: an icon used without re-running the generator would
// render as an empty box, so every icon class in the page and script needs a rule.
const icons = readFileSync(resolve(root, 'icons.css'), 'utf8');
const used = ['index.html', 'script.js'].map(f => readFileSync(resolve(root, f), 'utf8')).join('\n');
const iconClasses = new Set([
  ...(used.match(/\bfa-[a-z0-9-]+/g) || []).filter(c => !['fa-spin', 'fa-fw'].includes(c)),
  ...(used.match(/\bdevicon-[a-z0-9]+-(?:plain|original|line)(?:-wordmark)?\b/g) || [])
]);
for (const c of iconClasses) {
  checked++;
  if (!icons.includes(`.${c}{`)) missing.push(`icons.css: no rule for .${c} (run node scripts/build-icons.mjs)`);
}

if (missing.length) {
  console.error(`✗ ${missing.length} missing local asset(s):\n  ` + missing.join('\n  '));
  process.exit(1);
}
console.log(`✓ ${checked} local asset references resolved`);
