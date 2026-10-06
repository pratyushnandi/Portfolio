// Copies only the files that are actually deployed into .lhci-site/, so Lighthouse
// audits the real site without node_modules, tests or tooling configs in the way.
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, '.lhci-site');
const SITE = ['index.html', 'script.js', 'style.css', 'robots.txt', 'sitemap.xml',
  'images', 'projects', 'documents', 'files'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const p of SITE) {
  if (existsSync(resolve(root, p))) cpSync(resolve(root, p), resolve(out, p), { recursive: true });
}
console.log(`✓ staged ${SITE.length} entries into .lhci-site/`);
