import { describe, expect, it } from 'vitest';
import { MockJaneRepository } from './mockJane';
import { totalAppointments } from '../domain/aggregates';

const repo = new MockJaneRepository();
const day = (s: string) => new Date(`${s}T00:00:00.000Z`);

describe('mock Jane repository', () => {
  it('returns aggregates with counts and no name or note fields', async () => {
    const agg = await repo.queryBookings({ from: day('2026-08-04'), to: day('2026-08-16') });
    expect(totalAppointments(agg)).toBeGreaterThan(0);
    expect(agg.clampedStart).toBeUndefined();
    expect(JSON.stringify(agg)).not.toMatch(/name|note|"id"/i);
    const inq = await repo.queryInquiries({ from: day('2026-08-04'), to: day('2026-08-16') });
    expect(inq.total).toBeGreaterThan(0);
    expect(JSON.stringify(inq)).not.toMatch(/name|note|"id"/i);
  });

  it('returns zero counts for a range with no appointments', async () => {
    const agg = await repo.queryBookings({ from: day('2030-01-01'), to: day('2030-01-07') });
    expect(totalAppointments(agg)).toBe(0);
    expect(agg.bySpecialty).toEqual([]);
    const inq = await repo.queryInquiries({ from: day('2030-01-01'), to: day('2030-01-07') });
    expect(inq.total).toBe(0);
  });

  it('clamps a pre-window start and flags the clamped start', async () => {
    const agg = await repo.queryBookings({ from: day('2020-01-01'), to: day('2026-08-16') });
    expect(agg.clampedStart).toBeInstanceOf(Date);
    expect(agg.clampedStart!.getTime()).toBeGreaterThan(day('2020-01-01').getTime());
    expect(agg.range.from).toEqual(agg.clampedStart);
    expect(totalAppointments(agg)).toBeGreaterThan(0);
    const inq = await repo.queryInquiries({ from: day('2020-01-01'), to: day('2026-08-16') });
    expect(inq.clampedStart).toBeInstanceOf(Date);
  });
});
