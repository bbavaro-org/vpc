// Smoke check: the built server serves / and /api/panels/headline-metrics.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const entry = 'build/server/index.js';
if (!existsSync(entry) || !existsSync('dist/index.html')) {
  console.error('build missing: run `npm run build && npm run build:server` first');
  process.exit(1);
}
const port = 20000 + Math.floor(Math.random() * 20000);
const child = spawn(process.execPath, [entry], { env: { ...process.env, PORT: String(port) }, stdio: 'inherit' });
const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  child.kill();
  process.exit(1);
};
const base = `http://127.0.0.1:${port}`;
let up = false;
for (let i = 0; i < 50 && !up; i++) {
  try {
    await fetch(base + '/');
    up = true;
  } catch {
    await new Promise((r) => setTimeout(r, 100));
  }
}
if (!up) fail('server did not start');
const root = await fetch(base + '/');
const html = await root.text();
if (root.status !== 200 || !html.includes('<div id="root"')) fail('GET / did not return index HTML');
const api = await fetch(base + '/api/panels/headline-metrics');
const body = await api.json();
if (api.status !== 200 || !Array.isArray(body.items) || body.data === undefined) fail('headline-metrics aggregate missing');
console.log('smoke ok: / and /api/panels/headline-metrics');
child.kill();
