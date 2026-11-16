import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  SEED,
  REFERENCE_NOW,
  SPECIALTIES,
  WINDOW_DAYS,
  FORWARD_DAYS,
  generateStore,
  serializeStore,
} from './seedGenerator';

const DAY = 86_400_000;

describe('seed generator', () => {
  // AC: store spans at least 90 days
  it('spans 90 days back and 14 days ahead of REFERENCE_NOW with all four streams populated', () => {
    const store = generateStore(SEED);
    const times = store.appointments.map((a) => Date.parse(a.scheduledAt));
    const dayIndex = (t: number) => Math.floor(t / DAY);
    const calendarDaysCovered = dayIndex(Math.max(...times)) - dayIndex(Math.min(...times)) + 1;
    // Weekend days may carry no appointments, so the edges can fall a couple of days short.
    expect(calendarDaysCovered).toBeGreaterThanOrEqual(WINDOW_DAYS + FORWARD_DAYS - 3);
    expect(Math.max(...times)).toBeGreaterThan(REFERENCE_NOW.getTime() + (FORWARD_DAYS - 3) * DAY);
    expect(Math.min(...times)).toBeGreaterThanOrEqual(REFERENCE_NOW.getTime() - WINDOW_DAYS * DAY);
    expect(Math.max(...times)).toBeLessThanOrEqual(REFERENCE_NOW.getTime() + FORWARD_DAYS * DAY);
    expect(store.inquiries.length).toBeGreaterThan(0);
    expect(store.clinicians.length).toBeGreaterThan(0);
    expect(store.waitlist.length).toBeGreaterThan(0);
    expect(store.appointments.some((a) => a.status === 'noShow')).toBe(true);
    expect(store.appointments.some((a) => a.status === 'cancelled')).toBe(true);
  });

  it('seeds past appointments as history and future appointments as scheduled', () => {
    const { appointments } = generateStore(SEED);
    const past = appointments.filter((a) => Date.parse(a.scheduledAt) < REFERENCE_NOW.getTime());
    const future = appointments.filter((a) => Date.parse(a.scheduledAt) >= REFERENCE_NOW.getTime());
    expect(past.length).toBeGreaterThan(0);
    expect(future.length).toBeGreaterThan(0);
    expect(past.every((a) => a.status !== 'scheduled')).toBe(true);
    expect(future.every((a) => a.status === 'scheduled')).toBe(true);
    expect(appointments.every((a) => Date.parse(a.bookedAt) < REFERENCE_NOW.getTime())).toBe(true);
  });

  it('uses the capacity specialty vocabulary with capacity for all four specialties', () => {
    const store = generateStore(SEED);
    expect(SPECIALTIES).toEqual(['Child/Youth', 'Adult Anxiety', 'Couples', 'Assessments']);
    for (const specialty of SPECIALTIES) {
      expect(store.clinicians.some((c) => c.specialty === specialty && c.weeklyCapacity > 0)).toBe(true);
    }
    const allowed = new Set<string>(SPECIALTIES);
    expect(store.clinicians.every((c) => allowed.has(c.specialty))).toBe(true);
    expect(store.appointments.every((a) => allowed.has(a.specialty))).toBe(true);
    expect(store.waitlist.every((w) => allowed.has(w.specialty))).toBe(true);
  });

  it('gives every converted inquiry a first-session date after it was received', () => {
    const { inquiries } = generateStore(SEED);
    const converted = inquiries.filter((i) => i.intakeStage === 'booked');
    expect(converted.length).toBeGreaterThan(0);
    for (const i of converted) {
      expect(i.firstSessionAt).not.toBeNull();
      expect(Date.parse(i.firstSessionAt as string)).toBeGreaterThan(Date.parse(i.receivedAt));
    }
    const others = inquiries.filter((i) => i.intakeStage !== 'booked');
    expect(others.every((i) => i.firstSessionAt === null)).toBe(true);
  });

  it('keeps waitlist removals at or before REFERENCE_NOW and leaves some clients waiting', () => {
    const { waitlist } = generateStore(SEED);
    const stillWaiting = waitlist.filter((w) => w.removedAt === null);
    expect(stillWaiting.length).toBeGreaterThan(0);
    for (const w of waitlist) {
      if (w.removedAt !== null) {
        expect(Date.parse(w.removedAt)).toBeGreaterThan(Date.parse(w.addedAt));
        expect(Date.parse(w.removedAt)).toBeLessThanOrEqual(REFERENCE_NOW.getTime());
      }
    }
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
