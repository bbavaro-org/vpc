import { describe, expect, it } from 'vitest';
import type { BookingAggregate, BookingRepository } from '../domain';
import { getBookedPercentBySpecialty, getWaitlist } from './capacity';

const now = new Date('2026-11-16T00:00:00Z');
const agg: BookingAggregate = {
  range: { from: now, to: now },
  byStatus: { scheduled: 0, completed: 0, cancelled: 0, noShow: 0 },
  bySpecialty: [
    { specialty: 'Anxiety', count: 10 },
    { specialty: 'Couples', count: 0 },
  ],
  waitlistBySpecialty: [
    { specialty: 'Anxiety', count: 3 },
    { specialty: 'Couples', count: 7 },
  ],
  weeklyCapacity: 30,
  weeklyCapacityBySpecialty: [
    { specialty: 'Anxiety', count: 10 },
    { specialty: 'Couples', count: 5 },
  ],
};
const repo: BookingRepository = {
  queryBookings: async (range) => {
    expect(range.to.getTime() - range.from.getTime()).toBe(14 * 86400000);
    return agg;
  },
};

describe('capacity use cases', () => {
  it('computes booked percent per specialty over two weeks', async () => {
    const r = await getBookedPercentBySpecialty(repo, now);
    expect(r.find((x) => x.specialty === 'Anxiety')).toEqual({
      specialty: 'Anxiety',
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
  it('reports waitlist total and dominant specialty', async () => {
    expect(await getWaitlist(repo, now)).toEqual({ total: 10, dominantSpecialty: 'Couples' });
  });
});
