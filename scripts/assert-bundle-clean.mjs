// Fails when any built client JS contains a raw seeded row id or an ISO timestamp.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const assetsDir = join(process.cwd(), 'dist', 'assets');
const PATTERNS = [/(ap|iq|cl|wl)-\d{5}/, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/];

const files = readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
if (files.length === 0) {
  console.error(`No JS files found in ${assetsDir}; run the build first.`);
  process.exit(1);
}

let failed = false;
for (const file of files) {
  const text = readFileSync(join(assetsDir, file), 'utf8');
  for (const pattern of PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      failed = true;
      console.error(`${file}: matches ${pattern} (${match[0]})`);
    }
  }
}

if (failed) process.exit(1);
console.log(`bundle clean: ${files.length} file(s) checked`);
