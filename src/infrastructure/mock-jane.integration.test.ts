import { describe, expect, it } from 'vitest';
import { MockJaneRepository } from './mockJane';
import { REFERENCE_NOW, SPECIALTIES } from '../domain';
import { totalAppointments } from '../domain/aggregates';
import { getBookedPercentBySpecialty, getWaitlist } from '../application/capacity';
import { getHeadlineMetrics } from '../application/headline';

const repo = new MockJaneRepository();
const day = (s: string) => new Date(`${s}T00:00:00.000Z`);
const DAY = 86_400_000;
const sum = (counts: readonly { count: number }[]) => counts.reduce((n, c) => n + c.count, 0);

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

  it('exposes the first-session figure as an average number with no raw timestamps', async () => {
    const forward = { from: REFERENCE_NOW, to: new Date(REFERENCE_NOW.getTime() + 14 * DAY) };
    const inq = await repo.queryInquiries({ from: day('2026-08-04'), to: REFERENCE_NOW });
    const json = JSON.stringify([await repo.queryBookings(forward), inq]);
    expect(json).not.toMatch(/scheduledAt|bookedAt|receivedAt|firstSessionAt|addedAt|removedAt/);
    expect(typeof inq.averageDaysToFirstSession).toBe('number');
    expect(inq.averageDaysToFirstSession).toBeGreaterThan(0);
  });

  it('returns zero counts for a range with no appointments', async () => {
    const agg = await repo.queryBookings({ from: day('2030-01-01'), to: day('2030-01-07') });
    expect(totalAppointments(agg)).toBe(0);
    expect(agg.bySpecialty).toEqual([]);
    const inq = await repo.queryInquiries({ from: day('2030-01-01'), to: day('2030-01-07') });
    expect(inq.total).toBe(0);
    expect(inq.averageDaysToFirstSession).toBeNull();
  });

  it('counts a row on the shared boundary of adjacent windows exactly once', async () => {
    const boundary = day('2026-10-02');
    const store = {
      appointments: [{ specialty: 'Couples', status: 'scheduled' as const, scheduledAt: boundary.toISOString() }],
      inquiries: [
        { source: 'website', receivedAt: boundary.toISOString(), intakeStage: 'new' as const, firstSessionAt: null },
      ],
      clinicians: [],
      waitlist: [],
    };
    const r = new MockJaneRepository(store);
    const prior = { from: day('2026-09-02'), to: boundary };
    const current = { from: boundary, to: day('2026-11-01') };
    const counts = [
      totalAppointments(await r.queryBookings(prior)),
      totalAppointments(await r.queryBookings(current)),
    ];
    expect(counts).toEqual([0, 1]);
    expect([(await r.queryInquiries(prior)).total, (await r.queryInquiries(current)).total]).toEqual([0, 1]);
  });

  it('counts only scheduled appointments as live bookings', async () => {
    const at = day('2026-11-02').toISOString();
    const r = new MockJaneRepository({
      appointments: [
        { specialty: 'Couples', status: 'scheduled', scheduledAt: at },
        { specialty: 'Couples', status: 'cancelled', scheduledAt: at },
        { specialty: 'Couples', status: 'noShow', scheduledAt: at },
        { specialty: 'Couples', status: 'completed', scheduledAt: at },
      ],
      inquiries: [],
      clinicians: [],
      waitlist: [],
    });
    const agg = await r.queryBookings({ from: day('2026-11-01'), to: day('2026-11-15') });
    expect(agg.bySpecialty).toEqual([{ specialty: 'Couples', count: 4 }]);
    expect(agg.liveBookingsBySpecialty).toEqual([{ specialty: 'Couples', count: 1 }]);
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

  it('reports the waitlist as a snapshot at the range end, independent of the range start', async () => {
    const now = await repo.queryBookings({ from: REFERENCE_NOW, to: REFERENCE_NOW });
    expect(sum(now.waitlistBySpecialty)).toBeGreaterThan(0);
    const narrow = await repo.queryBookings({
      from: new Date(REFERENCE_NOW.getTime() + 13 * DAY),
      to: new Date(REFERENCE_NOW.getTime() + 14 * DAY),
    });
    expect(narrow.waitlistBySpecialty).toEqual(now.waitlistBySpecialty);
    const earlier = await repo.queryBookings({ from: day('2026-08-04'), to: day('2026-08-10') });
    expect(earlier.waitlistBySpecialty).not.toEqual(now.waitlistBySpecialty);
  });
});

describe('use cases over the committed seed', () => {
  it('returns a booked percentage for each capacity specialty over the forward window', async () => {
    const result = await getBookedPercentBySpecialty(repo);
    expect(result.map((r) => r.specialty)).toEqual([...SPECIALTIES]);
    for (const r of result) {
      expect(r.state).toBe('booked');
      if (r.state === 'booked') {
        expect(r.bookedPercent).toBeGreaterThan(0);
        expect(r.bookedPercent).toBeLessThanOrEqual(100);
      }
    }
  });

  it('reports a non-zero waitlist with a dominant specialty', async () => {
    const waitlist = await getWaitlist(repo);
    expect(waitlist.total).toBeGreaterThan(0);
    expect(SPECIALTIES).toContain(waitlist.dominantSpecialty);
  });

  it('reports a measured inquiry-to-first-session average greater than zero', async () => {
    const m = await getHeadlineMetrics({ bookings: repo, inquiries: repo });
    expect(m.inquiryToFirstSessionDays.current).toBeGreaterThan(0);
    expect(m.inquiryToFirstSessionDays.prior).toBeGreaterThan(0);
    expect(m.clinicianUtilizationPercent.current).toBeGreaterThan(0);
  });
});
