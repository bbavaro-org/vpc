// AC: F009 user_flow_probe proves the dashboard is served and its JS has no raw rows.
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const dataDir =
  process.env.SHIPYARD_DATA ||
  join(homedir(), '.claude/plugins/data/shipyard-acendas/projects/04ace45702fc');
const featurePath = join(dataDir, 'spec/features/F009-deployment-hosting-k3s.md');
const text = readFileSync(featurePath, 'utf8');
const fm = text.split(/^---\s*$/m)[1] ?? '';
const block = fm.split('user_flow_probe:')[1] ?? '';
const kind = /kind:\s*(\S+)/.exec(block)?.[1];
const command = block.split('command:')[1] ?? '';
const oldCurl = 'curl -sSf https://www.bavaro.org/ -o /dev/null && echo ok';

const fail = (m) => {
  console.error(`FAIL: ${m}`);
  process.exit(1);
};

if (kind !== 'auto') fail('probe kind must be auto');
if (command.trim() === `|\n    ${oldCurl}`.trim() || command.trim().endsWith(oldCurl) && !command.includes('flow-probe'))
  fail('probe is still the bare curl');

const scriptMatch = /scripts\/flow-probe\.sh/.exec(command);
let body = command;
if (scriptMatch) {
  if (!existsSync('scripts/flow-probe.sh')) fail('scripts/flow-probe.sh missing');
  body += readFileSync('scripts/flow-probe.sh', 'utf8');
}
if (!/\(ap\|iq\|cl\|wl\)-(\\d|\[0-9\])\{5\}/.test(body)) fail('probe does not check served JS for raw row ids');
if (!/(\\d|\[0-9\])\{4\}-(\\d|\[0-9\])\{2\}-(\\d|\[0-9\])\{2\}T/.test(body)) fail('probe does not check ISO timestamps');
console.log('ok: F009 probe verifies served JS has no raw ids or ISO timestamps');
