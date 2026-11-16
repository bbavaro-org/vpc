import {
  totalAppointments,
  type BookingAggregate,
  type DateRange,
  type InquiryAggregate,
} from '../domain/aggregates';
import type { BookingRepository, InquiryRepository } from '../domain/repositories';
import { REFERENCE_NOW } from '../domain/referenceNow';
import { DAY_MS, PERIOD_DAYS, lastPeriod } from '../domain/period';
export const UTILIZATION_TARGET_BAND = { min: 80, max: 90 } as const;

export type Direction = 'up' | 'down' | 'flat';
export type BandStatus = 'below' | 'within' | 'above';

/** A figure for one period; `null` means no data, never a division by zero. */
export interface HeadlineMetric {
  readonly current: number | null;
  readonly prior: number | null;
  /** Current minus prior; null when either period has no data. */
  readonly change: number | null;
  readonly direction: Direction | null;
}

export interface UtilizationMetric extends HeadlineMetric {
  readonly targetBand: { readonly min: number; readonly max: number };
  /** Position of the current value against the band; null when no data. */
  readonly bandStatus: BandStatus | null;
}

export interface HeadlineMetrics {
  readonly newInquiries: HeadlineMetric;
  readonly inquiryToFirstSessionDays: HeadlineMetric;
  readonly clinicianUtilizationPercent: UtilizationMetric;
  readonly noShowRatePercent: HeadlineMetric;
}

export interface HeadlineDeps {
  readonly bookings: BookingRepository;
  readonly inquiries: InquiryRepository;
}

interface PeriodFigures {
  readonly newInquiries: number;
  readonly inquiryToFirstSessionDays: number | null;
  readonly utilizationPercent: number | null;
  readonly noShowRatePercent: number | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function ratio(numerator: number, denominator: number, scale: number): number | null {
  return denominator > 0 ? round1((numerator / denominator) * scale) : null;
}

function spanDays(range: DateRange): number {
  return (range.to.getTime() - range.from.getTime()) / DAY_MS;
}

function figures(bookings: BookingAggregate, inquiries: InquiryAggregate): PeriodFigures {
  const { byStatus } = bookings;
  const held = byStatus.completed + byStatus.noShow;
  const used = held + byStatus.scheduled;
  const capacity = bookings.weeklyCapacity * (spanDays(bookings.range) / 7);
  return {
    newInquiries: inquiries.total,
    inquiryToFirstSessionDays:
      inquiries.averageDaysToFirstSession === null ? null : round1(inquiries.averageDaysToFirstSession),
    // No appointments at all is no data; capacity with no live bookings is a genuine 0%.
    utilizationPercent: totalAppointments(bookings) === 0 ? null : ratio(used, capacity, 100),
    noShowRatePercent: ratio(byStatus.noShow, held, 100),
  };
}

function compare(current: number | null, prior: number | null): HeadlineMetric {
  if (current === null || prior === null) {
    return { current, prior, change: null, direction: null };
  }
  const change = round1(current - prior);
  return { current, prior, change, direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat' };
}

function bandStatus(value: number | null): BandStatus | null {
  if (value === null) return null;
  if (value < UTILIZATION_TARGET_BAND.min) return 'below';
  return value > UTILIZATION_TARGET_BAND.max ? 'above' : 'within';
}

/** Computes the four headline figures for the 30 days ending at `now` and the 30 days before. */
export async function getHeadlineMetrics(
  deps: HeadlineDeps,
  now: Date = REFERENCE_NOW,
): Promise<HeadlineMetrics> {
  const currentRange = lastPeriod(now);
  const priorRange = {
    from: new Date(currentRange.from.getTime() - PERIOD_DAYS * DAY_MS),
    to: currentRange.from,
  };
  const [cb, ci, pb, pi] = await Promise.all([
    deps.bookings.queryBookings(currentRange),
    deps.inquiries.queryInquiries(currentRange),
    deps.bookings.queryBookings(priorRange),
    deps.inquiries.queryInquiries(priorRange),
  ]);
  const cur = figures(cb, ci);
  const pri = figures(pb, pi);
  const utilization = compare(cur.utilizationPercent, pri.utilizationPercent);
  return {
    newInquiries: compare(cur.newInquiries, pri.newInquiries),
    inquiryToFirstSessionDays: compare(cur.inquiryToFirstSessionDays, pri.inquiryToFirstSessionDays),
    clinicianUtilizationPercent: {
      ...utilization,
      targetBand: UTILIZATION_TARGET_BAND,
      bandStatus: bandStatus(utilization.current),
    },
    noShowRatePercent: compare(cur.noShowRatePercent, pri.noShowRatePercent),
  };
}
