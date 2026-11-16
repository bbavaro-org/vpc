import { describe, expect, it } from 'vitest';
import { MockJaneRepository } from '../infrastructure/mockJane';
import { getHeadlineMetrics } from './headline';

const repo = new MockJaneRepository();
const deps = { bookings: repo, inquiries: repo };
const now = new Date('2026-10-31T23:59:59.000Z');

describe('headline metrics', () => {
  // AC-1: four figures over the last 30 days
  it('computes the four figures with prior values and direction', async () => {
    const m = await getHeadlineMetrics(deps, now);
    expect(m.newInquiries.current).toBeGreaterThan(0);
    expect(m.inquiryToFirstSessionDays.current).toBeGreaterThan(0);
    expect(m.clinicianUtilizationPercent.current).toBeGreaterThan(0);
    expect(m.noShowRatePercent.current).toBeGreaterThanOrEqual(0);
    // AC-2: change versus prior 30 days with direction
    for (const f of [m.newInquiries, m.inquiryToFirstSessionDays, m.clinicianUtilizationPercent, m.noShowRatePercent]) {
      expect(f.prior).not.toBeNull();
      expect(f.change).toBeCloseTo(f.current! - f.prior!, 1);
      expect(f.direction).toBe(f.change! > 0 ? 'up' : f.change! < 0 ? 'down' : 'flat');
    }
  });

  // AC-3: utilization target band
  it('carries the 80-90% target band and classifies the value', async () => {
    const u = (await getHeadlineMetrics(deps, now)).clinicianUtilizationPercent;
    expect(u.targetBand).toEqual({ min: 80, max: 90 });
    const v = u.current!;
    expect(u.bandStatus).toBe(v < 80 ? 'below' : v > 90 ? 'above' : 'within');
  });

  // AC-4: zero-inquiry edge
  it('reports 0 inquiries and no-data ratios when nothing falls in range', async () => {
    const m = await getHeadlineMetrics(deps, new Date('2031-01-01T00:00:00.000Z'));
    expect(m.newInquiries.current).toBe(0);
    expect(m.inquiryToFirstSessionDays.current).toBeNull();
    expect(m.inquiryToFirstSessionDays.direction).toBeNull();
    expect(m.noShowRatePercent.current).toBeNull();
    expect(m.clinicianUtilizationPercent.current).toBe(0);
    expect(m.clinicianUtilizationPercent.bandStatus).toBe("below");
  });
});
