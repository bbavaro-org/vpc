import type {
  BookingAggregate,
  DateRange,
  InquiryAggregate,
  SpecialtyCount,
} from '../domain/aggregates';
import type { AppointmentStatus, IntakeStage } from '../domain/entities';
import type { BookingRepository, InquiryRepository } from '../domain/repositories';
import storeJson from './seed-data/store.json';

interface RawStore {
  appointments: { specialty: string; status: AppointmentStatus; scheduledAt: string }[];
  inquiries: {
    source: string;
    receivedAt: string;
    intakeStage: IntakeStage;
    firstSessionAt: string | null;
  }[];
  clinicians: { specialty: string; weeklyCapacity: number }[];
  waitlist: { specialty: string; addedAt: string; removedAt: string | null }[];
}

/** Set when the requested start precedes the seeded history; holds the effective start used. */
export interface ClampInfo {
  readonly clampedStart?: Date;
}

export type MockBookingAggregate = BookingAggregate & ClampInfo;
export type MockInquiryAggregate = InquiryAggregate & ClampInfo;

const DAY_MS = 86_400_000;
const STATUSES: readonly AppointmentStatus[] = ['scheduled', 'completed', 'cancelled', 'noShow'];
const STAGES: readonly IntakeStage[] = ['new', 'contacted', 'assessment', 'booked', 'closed'];

function earliest(times: readonly string[]): number {
  return times.length === 0 ? Number.NEGATIVE_INFINITY : Math.min(...times.map(Date.parse));
}

function clamp(range: DateRange, windowStart: number): { range: DateRange } & ClampInfo {
  if (range.from.getTime() >= windowStart) return { range };
  const clampedStart = new Date(windowStart);
  return { range: { from: clampedStart, to: range.to }, clampedStart };
}

function inRange(iso: string, range: DateRange): boolean {
  const t = Date.parse(iso);
  return t >= range.from.getTime() && t <= range.to.getTime();
}

/** Present-state snapshot: added on or before `at` and not yet removed by `at`. */
function waitingAt(entry: { addedAt: string; removedAt: string | null }, at: Date): boolean {
  return (
    Date.parse(entry.addedAt) <= at.getTime() &&
    (entry.removedAt === null || Date.parse(entry.removedAt) > at.getTime())
  );
}

function averageDaysToFirstSession(
  rows: readonly { receivedAt: string; firstSessionAt: string | null }[],
): number | null {
  const waits = rows.flatMap((r) =>
    r.firstSessionAt === null ? [] : [(Date.parse(r.firstSessionAt) - Date.parse(r.receivedAt)) / DAY_MS],
  );
  if (waits.length === 0) return null;
  return Math.round((waits.reduce((sum, w) => sum + w, 0) / waits.length) * 100) / 100;
}

function toCounts(counts: Map<string, number>): SpecialtyCount[] {
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([specialty, count]) => ({ specialty, count }));
}

function tally(values: readonly string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

function capacityBySpecialty(
  clinicians: readonly { specialty: string; weeklyCapacity: number }[],
): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of clinicians) m.set(c.specialty, (m.get(c.specialty) ?? 0) + c.weeklyCapacity);
  return m;
}

/** The only reader of raw seeded rows; every method returns aggregates only. */
export class MockJaneRepository implements BookingRepository, InquiryRepository {
  private readonly store: RawStore;

  constructor(store: RawStore = storeJson as RawStore) {
    this.store = store;
  }

  async queryBookings(requested: DateRange): Promise<MockBookingAggregate> {
    const { range, clampedStart } = clamp(
      requested,
      earliest(this.store.appointments.map((a) => a.scheduledAt)),
    );
    const appts = this.store.appointments.filter((a) => inRange(a.scheduledAt, range));
    const byStatus = Object.fromEntries(
      STATUSES.map((s) => [s, appts.filter((a) => a.status === s).length]),
    ) as Record<AppointmentStatus, number>;
    const waiting = this.store.waitlist.filter((w) => waitingAt(w, range.to));
    return {
      range,
      byStatus,
      bySpecialty: toCounts(tally(appts.map((a) => a.specialty))),
      waitlistBySpecialty: toCounts(tally(waiting.map((w) => w.specialty))),
      weeklyCapacity: this.store.clinicians.reduce((sum, c) => sum + c.weeklyCapacity, 0),
      weeklyCapacityBySpecialty: toCounts(capacityBySpecialty(this.store.clinicians)),
      ...(clampedStart ? { clampedStart } : {}),
    };
  }

  async queryInquiries(requested: DateRange): Promise<MockInquiryAggregate> {
    const { range, clampedStart } = clamp(
      requested,
      earliest(this.store.inquiries.map((i) => i.receivedAt)),
    );
    const rows = this.store.inquiries.filter((i) => inRange(i.receivedAt, range));
    const byStage = Object.fromEntries(
      STAGES.map((s) => [s, rows.filter((i) => i.intakeStage === s).length]),
    ) as Record<IntakeStage, number>;
    return {
      range,
      bySource: Object.fromEntries(tally(rows.map((i) => i.source))),
      byStage,
      total: rows.length,
      averageDaysToFirstSession: averageDaysToFirstSession(rows),
      ...(clampedStart ? { clampedStart } : {}),
    };
  }
}
