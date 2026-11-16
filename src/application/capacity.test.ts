import { describe, expect, it } from 'vitest';
import type { BookingAggregate, BookingRepository } from '../domain';
import { CAPACITY_SPECIALTIES, getBookedPercentBySpecialty, getWaitlist } from './capacity';
import { REFERENCE_NOW } from '../infrastructure/referenceNow';

const now = new Date('2026-11-16T00:00:00Z');
const agg: BookingAggregate = {
  range: { from: now, to: now },
  byStatus: { scheduled: 0, completed: 0, cancelled: 0, noShow: 0 },
  bySpecialty: [
    { specialty: 'Adult Anxiety', count: 10 },
    { specialty: 'Couples', count: 0 },
  ],
  waitlistBySpecialty: [
    { specialty: 'Adult Anxiety', count: 3 },
    { specialty: 'Couples', count: 7 },
  ],
  weeklyCapacity: 30,
  weeklyCapacityBySpecialty: [
    { specialty: 'Adult Anxiety', count: 10 },
    { specialty: 'Couples', count: 5 },
  ],
};
const repo: BookingRepository = { queryBookings: async () => agg };

describe('capacity use cases', () => {
  it('uses the capacity specialty vocabulary', () => {
    expect([...CAPACITY_SPECIALTIES]).toEqual(['Child/Youth', 'Adult Anxiety', 'Couples', 'Assessments']);
  });
  it('queries a forward two-week window from now', async () => {
    const ranges: { from: Date; to: Date }[] = [];
    const spy: BookingRepository = {
      queryBookings: async (range) => {
        ranges.push(range);
        return agg;
      },
    };
    await getBookedPercentBySpecialty(spy, now);
    expect(ranges[0]?.from).toEqual(now);
    expect(ranges[0]!.to.getTime() - now.getTime()).toBe(14 * 86400000);
  });
  it('defaults now to REFERENCE_NOW', async () => {
    const ranges: { from: Date; to: Date }[] = [];
    const spy: BookingRepository = {
      queryBookings: async (range) => {
        ranges.push(range);
        return agg;
      },
    };
    await getBookedPercentBySpecialty(spy);
    await getWaitlist(spy);
    expect(ranges.map((r) => r.from)).toEqual([REFERENCE_NOW, REFERENCE_NOW]);
  });
  it('computes booked percent per specialty over two weeks', async () => {
    const r = await getBookedPercentBySpecialty(repo, now);
    expect(r.find((x) => x.specialty === 'Adult Anxiety')).toEqual({
      specialty: 'Adult Anxiety',
      state: 'booked',
      bookedPercent: 50,
    });
    expect(r.find((x) => x.specialty === 'Couples')).toMatchObject({ bookedPercent: 0 });
  });
  it('reports no-capacity instead of 0% booked', async () => {
    const r = await getBookedPercentBySpecialty(repo, now);
    expect(r.find((x) => x.specialty === 'Assessments')).toEqual({
      specialty: 'Assessments',
      state: 'no-capacity',
    });
  });
  it('reads the waitlist snapshot as of now', async () => {
    const ranges: { from: Date; to: Date }[] = [];
    const spy: BookingRepository = {
      queryBookings: async (range) => {
        ranges.push(range);
        return agg;
      },
    };
    expect(await getWaitlist(spy, now)).toEqual({ total: 10, dominantSpecialty: 'Couples' });
    expect(ranges[0]?.to).toEqual(now);
  });
  it('reports a null dominant specialty for an empty waitlist', async () => {
    const empty: BookingRepository = {
      queryBookings: async () => ({ ...agg, waitlistBySpecialty: [] }),
    };
    expect(await getWaitlist(empty, now)).toEqual({ total: 0, dominantSpecialty: null });
  });
});
