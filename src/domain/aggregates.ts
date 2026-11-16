import type { AppointmentStatus, IntakeStage, Specialty } from './entities';

export interface DateRange {
  readonly from: Date;
  readonly to: Date;
}

/** Query-result types: counts and derived figures only; no client names or clinical notes. */
export interface AppointmentAggregate {
  readonly range: DateRange;
  readonly byStatus: Readonly<Record<AppointmentStatus, number>>;
}

export interface SpecialtyCount {
  readonly specialty: Specialty;
  readonly count: number;
}

export interface BookingAggregate extends AppointmentAggregate {
  readonly bySpecialty: readonly SpecialtyCount[];
  /** Scheduled (live) appointments in range per specialty; excludes completed, cancelled and no-show. */
  readonly liveBookingsBySpecialty: readonly SpecialtyCount[];
  /** Present-state snapshot: clients still waiting as of `range.to`. */
  readonly waitlistBySpecialty: readonly SpecialtyCount[];
  readonly weeklyCapacity: number;
  readonly weeklyCapacityBySpecialty: readonly SpecialtyCount[];
}

export interface InquiryAggregate {
  readonly range: DateRange;
  readonly bySource: Readonly<Record<string, number>>;
  readonly byStage: Readonly<Record<IntakeStage, number>>;
  /** Inquiries that reached 'booked' per lead source. */
  readonly newClientsBySource: Readonly<Record<string, number>>;
  readonly total: number;
  /** Mean days from inquiry to first session over converted inquiries; null when none converted. */
  readonly averageDaysToFirstSession: number | null;
}

export function totalAppointments(agg: AppointmentAggregate): number {
  return Object.values(agg.byStatus).reduce((sum, n) => sum + n, 0);
}
