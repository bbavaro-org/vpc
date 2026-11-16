import { describe, expect, it } from 'vitest';
import type { InquiryAggregate, InquiryRepository } from '../domain';
import { getLeadSourceShares } from './leadSources';

const now = new Date('2026-11-16T00:00:00Z');
function repoWith(newClientsBySource: Record<string, number>, ranges: { from: Date; to: Date }[] = []): InquiryRepository {
  return {
    queryInquiries: async (range) => {
      ranges.push(range);
      return {
        range,
        bySource: {},
        byStage: { inquiry: 0, intakeCompleted: 0, matched: 0, booked: 0, closed: 0 },
        newClientsBySource,
        total: 0,
        averageDaysToFirstSession: null,
      } as InquiryAggregate;
    },
  };
}

describe('lead source shares', () => {
  // AC-1: share of new clients per source
  it('lists all five sources, largest first, ties in vocabulary order', async () => {
    const r = await getLeadSourceShares(repoWith({ 'Google search': 2, 'Physician referral': 1 }), now);
    if (r.state !== 'ready') throw new Error('expected ready');
    expect(r.shares.map((s) => [s.source, s.sharePercent])).toEqual([
      ['Google search', 67],
      ['Physician referral', 33],
      ['Insurance / EAP', 0],
      ['Social media', 0],
      ['Word of mouth', 0],
    ]);
    expect(r.total).toBe(3);
  });
  // AC-2: shares sum to 100%
  it('sums to exactly 100 via largest remainder', async () => {
    const r = await getLeadSourceShares(
      repoWith({ 'Google search': 1, 'Physician referral': 1, 'Insurance / EAP': 1 }),
      now,
    );
    if (r.state !== 'ready') throw new Error('expected ready');
    expect(r.shares.reduce((s, x) => s + x.sharePercent, 0)).toBe(100);
    expect(r.shares.map((s) => s.sharePercent).slice(0, 3)).toEqual([34, 33, 33]);
  });
  // AC-3: empty state
  it('is empty when there are no new clients', async () => {
    expect(await getLeadSourceShares(repoWith({}), now)).toEqual({ state: 'empty' });
  });
  it('queries the 30 days ending at now', async () => {
    const ranges: { from: Date; to: Date }[] = [];
    await getLeadSourceShares(repoWith({}, ranges), now);
    expect(ranges[0]!.to).toEqual(now);
    expect(now.getTime() - ranges[0]!.from.getTime()).toBe(30 * 86400000);
  });
});
