import { describe, expect, it } from 'vitest';
import type { InquiryAggregate, InquiryRepository } from '../domain';
import { MockJaneRepository } from '../infrastructure/mockJane';
import { buildFunnel, getIntakeFunnel } from './funnel';

function stub(counts: [number, number, number, number], total = counts[0]): InquiryRepository {
  return {
    async queryInquiries(range) {
      const agg: InquiryAggregate = {
        range,
        bySource: {},
        byStage: {
          inquiry: counts[0],
          intakeCompleted: counts[1],
          matched: counts[2],
          booked: counts[3],
          closed: 0,
        },
        newClientsBySource: {},
        total,
        averageDaysToFirstSession: null,
      };
      return agg;
    },
  };
}

// AC-1 AC-2 AC-3 AC-4 (F004 core + edge)
describe('intake funnel use case', () => {
  it('reads four stage counts and marks the largest drop', async () => {
    const f = await getIntakeFunnel(stub([100, 70, 55, 40]));
    expect(f.stages.map((s) => s.count)).toEqual([100, 70, 55, 40]);
    expect(f.gaps[0]).toEqual({ state: 'drop', dropOff: 30, dropOffPercent: 30, largest: true });
    expect(f.gaps[1]).toMatchObject({ state: 'drop', dropOff: 15, largest: false });
    expect(f.gaps[2]).toMatchObject({ state: 'drop', dropOff: 15, largest: false });
  });
  it('ties go to the earliest gap', () => {
    const f = buildFunnel([100, 80, 60, 40]);
    expect(f.gaps.map((g) => g.state === 'drop' && g.largest)).toEqual([true, false, false]);
  });
  it('dropOffPercent is null when the earlier count is 0', () => {
    const f = buildFunnel([0, 0, 0, 0]);
    expect(f.gaps[0]).toEqual({ state: 'drop', dropOff: 0, dropOffPercent: null, largest: true });
  });
  it('flags a later stage exceeding an earlier one and never marks it largest', () => {
    const f = buildFunnel([100, 90, 120, 10]);
    expect(f.gaps[1]).toEqual({ state: 'anomaly', excess: 30 });
    expect(f.gaps[0]).toMatchObject({ state: 'drop', dropOff: 10, largest: false });
    expect(f.gaps[2]).toMatchObject({ state: 'drop', dropOff: 110, largest: true });
  });
  it('reads the seeded repository', async () => {
    const f = await getIntakeFunnel(new MockJaneRepository());
    expect(f.stages).toHaveLength(4);
  });
});
