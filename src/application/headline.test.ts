import { describe, expect, it } from 'vitest';
import { MockJaneRepository } from '../infrastructure/mockJane';
import type { BookingAggregate, InquiryAggregate } from '../domain/aggregates';
import { getHeadlineMetrics } from './headline';

const repo = new MockJaneRepository();
const deps = { bookings: repo, inquiries: repo };

const range = { from: new Date('2026-10-01T00:00:00Z'), to: new Date('2026-10-31T00:00:00Z') };
const inquiryAgg = (averageDaysToFirstSession: number | null): InquiryAggregate => ({
  range,
  bySource: {},
  byStage: { inquiry: 0, intakeCompleted: 0, matched: 0, booked: 0, closed: 0 },
  newClientsBySource: {},
  total: 10,
  averageDaysToFirstSession,
});
const bookingAgg = (byStatus: BookingAggregate['byStatus']): BookingAggregate => ({
  range,
  byStatus,
  bySpecialty: [],
  liveBookingsBySpecialty: [],
  waitlistBySpecialty: [],
  weeklyCapacity: 20,
  weeklyCapacityBySpecialty: [],
});
const stubDeps = (b: BookingAggregate, i: InquiryAggregate) => ({
  bookings: { queryBookings: async () => b },
  inquiries: { queryInquiries: async () => i },
});

describe('headline metrics', () => {
  // AC-1: four figures over the last 30 days
  it('computes the four figures with prior values and direction', async () => {
    const m = await getHeadlineMetrics(deps);
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
    const u = (await getHeadlineMetrics(deps)).clinicianUtilizationPercent;
    expect(u.targetBand).toEqual({ min: 80, max: 90 });
    const v = u.current!;
    expect(u.bandStatus).toBe(v < 80 ? 'below' : v > 90 ? 'above' : 'within');
  });

  // AC-4: zero-inquiry edge
  it('reports 0 inquiries and no-data figures when nothing falls in range', async () => {
    const m = await getHeadlineMetrics(deps, new Date('2031-01-01T00:00:00.000Z'));
    expect(m.newInquiries.current).toBe(0);
    expect(m.inquiryToFirstSessionDays.current).toBeNull();
    expect(m.inquiryToFirstSessionDays.direction).toBeNull();
    expect(m.noShowRatePercent.current).toBeNull();
    expect(m.clinicianUtilizationPercent.current).toBeNull();
    expect(m.clinicianUtilizationPercent.bandStatus).toBeNull();
  });

  it('reads the measured first-session average rather than estimating it', async () => {
    const m = await getHeadlineMetrics(stubDeps(bookingAgg({ scheduled: 0, completed: 5, cancelled: 0, noShow: 0 }), inquiryAgg(6.25)));
    expect(m.inquiryToFirstSessionDays.current).toBe(6.3);
    const none = await getHeadlineMetrics(stubDeps(bookingAgg({ scheduled: 0, completed: 5, cancelled: 0, noShow: 0 }), inquiryAgg(null)));
    expect(none.inquiryToFirstSessionDays.current).toBeNull();
  });

  it('distinguishes a window with no appointments from a genuine 0% utilization', async () => {
    const noAppointments = await getHeadlineMetrics(
      stubDeps(bookingAgg({ scheduled: 0, completed: 0, cancelled: 0, noShow: 0 }), inquiryAgg(5)),
    );
    expect(noAppointments.clinicianUtilizationPercent.current).toBeNull();
    expect(noAppointments.clinicianUtilizationPercent.bandStatus).toBeNull();
    const allCancelled = await getHeadlineMetrics(
      stubDeps(bookingAgg({ scheduled: 0, completed: 0, cancelled: 4, noShow: 0 }), inquiryAgg(5)),
    );
    expect(allCancelled.clinicianUtilizationPercent.current).toBe(0);
    expect(allCancelled.clinicianUtilizationPercent.bandStatus).toBe('below');
  });
});
