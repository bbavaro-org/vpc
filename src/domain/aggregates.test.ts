import { describe, it, expect } from 'vitest';
import { totalAppointments, type AppointmentAggregate } from './aggregates';

describe('appointment aggregate', () => {
  it('sums per-status counts with no name field present', () => {
    const agg: AppointmentAggregate = {
      range: { from: new Date('2026-01-01'), to: new Date('2026-01-31') },
      byStatus: { scheduled: 3, completed: 5, cancelled: 1, noShow: 2 },
    };
    expect(totalAppointments(agg)).toBe(11);
    expect(Object.keys(agg).some((k) => /name|note/i.test(k))).toBe(false);
  });
});
