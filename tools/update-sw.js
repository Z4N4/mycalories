// Rewrites the ASSETS list in sw.js from the files on disk and bumps the cache
// version, so installed phones download the new version. Run: node tools/update-sw.js
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const walk = (dir) => readdirSync(join(root, dir), { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
const files = [
  'index.html', 'manifest.webmanifest', 'css/app.css',
  ...walk('icons').filter((f) => f.endsWith('.png')),
  ...walk('js').filter((f) => f.endsWith('.js')),
  ...walk('vendor').filter((f) => f.endsWith('.js')),
].map((f) => `./${relative('.', f).replaceAll('\\', '/')}`);

const swPath = join(root, 'sw.js');
const sw = readFileSync(swPath, 'utf8');
const version = Number(/mycalories-v(\d+)/.exec(sw)[1]) + 1;
const list = ['./', ...files].map((f) => `  '${f}',`).join('\n');
const next = sw
  .replace(/const CACHE = 'mycalories-v\d+';/, `const CACHE = 'mycalories-v${version}';`)
  .replace(/const ASSETS = \[[\s\S]*?\];/, `const ASSETS = [\n${list}\n];`);
writeFileSync(swPath, next);
process.stdout.write(`sw.js: cache v${version}, ${files.length + 1} files\n`);
