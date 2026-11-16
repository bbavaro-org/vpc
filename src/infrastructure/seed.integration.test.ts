import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SEED, REFERENCE_DATE, generateStore, serializeStore } from './seedGenerator';

describe('seed generator', () => {
  // AC: store spans at least 90 days
  it('spans at least 90 days with all four streams populated', () => {
    const store = generateStore(SEED);
    const times = store.appointments.map((a) => Date.parse(a.scheduledAt));
    const dayIndex = (t: number) => Math.floor(t / 86_400_000);
    const calendarDaysCovered = dayIndex(Math.max(...times)) - dayIndex(Math.min(...times)) + 1;
    expect(calendarDaysCovered).toBeGreaterThanOrEqual(90);
    expect(Math.max(...times)).toBeLessThanOrEqual(REFERENCE_DATE.getTime());
    expect(store.inquiries.length).toBeGreaterThan(0);
    expect(store.clinicians.length).toBeGreaterThan(0);
    expect(store.waitlist.length).toBeGreaterThan(0);
    expect(store.appointments.some((a) => a.status === 'noShow')).toBe(true);
  });

  // AC: determinism, identical output on every run
  it('produces byte-identical output for the same seed', () => {
    expect(serializeStore(generateStore(SEED))).toBe(serializeStore(generateStore(SEED)));
    expect(serializeStore(generateStore(SEED + 1))).not.toBe(serializeStore(generateStore(SEED)));
  });

  it('matches the committed fixture', () => {
    const fixture = readFileSync(new URL('./seed-data/store.json', import.meta.url), 'utf8');
    expect(fixture).toBe(serializeStore(generateStore(SEED)));
  });
});
