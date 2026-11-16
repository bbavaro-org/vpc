import { describe, expect, it } from 'vitest';
import { MockJaneRepository } from './mockJane';
import { REFERENCE_NOW } from '../domain/referenceNow';
import { LEAD_SOURCES } from '../domain/entities';
import { generateStore, SEED } from './seedGenerator';

const DAY = 86_400_000;
const repo = new MockJaneRepository();
const last30 = { from: new Date(REFERENCE_NOW.getTime() - 30 * DAY), to: REFERENCE_NOW };

describe('inquiry data model', () => {
  it('keys byStage by the funnel vocabulary', async () => {
    const agg = await repo.queryInquiries(last30);
    expect(Object.keys(agg.byStage).sort()).toEqual([
      'booked',
      'closed',
      'inquiry',
      'intakeCompleted',
      'matched',
    ]);
  });

  it('reports newClientsBySource over lead sources summing to booked', async () => {
    const agg = await repo.queryInquiries(last30);
    for (const key of Object.keys(agg.newClientsBySource)) {
      expect(LEAD_SOURCES).toContain(key);
    }
    const sum = Object.values(agg.newClientsBySource).reduce((n, v) => n + v, 0);
    expect(sum).toBe(agg.byStage.booked);
    expect(agg.byStage.booked).toBeGreaterThan(0);
  });

  it('seeds only lead sources, weighted with Google search most common', () => {
    const { inquiries } = generateStore(SEED);
    const counts = new Map<string, number>();
    for (const i of inquiries) counts.set(i.source, (counts.get(i.source) ?? 0) + 1);
    expect([...counts.keys()].every((k) => (LEAD_SOURCES as readonly string[]).includes(k))).toBe(true);
    const google = counts.get('Google search') ?? 0;
    expect(google).toBe(Math.max(...counts.values()));
    expect(google / inquiries.length).toBeGreaterThan(0.3);
  });
});
