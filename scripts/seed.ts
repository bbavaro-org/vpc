import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEED, generateStore, serializeStore } from '../src/infrastructure/seedGenerator';
import {
  AUTOMATION_SEED,
  generateAutomationLog,
  serializeAutomationLog,
} from '../src/infrastructure/automationSeed';

const target = fileURLToPath(new URL('../src/infrastructure/seed-data/store.json', import.meta.url));
const store = generateStore(SEED);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, serializeStore(store));
console.log(
  `seed: wrote ${store.appointments.length} appointments, ${store.inquiries.length} inquiries, ` +
    `${store.clinicians.length} clinicians, ${store.waitlist.length} waitlist entries`,
);

const automationTarget = fileURLToPath(
  new URL('../src/infrastructure/seed-data/automation.json', import.meta.url),
);
const automation = generateAutomationLog(AUTOMATION_SEED);
writeFileSync(automationTarget, serializeAutomationLog(automation));
console.log(`seed: wrote ${automation.length} automation events`);
