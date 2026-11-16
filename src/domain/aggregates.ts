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
  readonly waitlistBySpecialty: readonly SpecialtyCount[];
  readonly weeklyCapacity: number;
}

export interface InquiryAggregate {
  readonly range: DateRange;
  readonly bySource: Readonly<Record<string, number>>;
  readonly byStage: Readonly<Record<IntakeStage, number>>;
  readonly total: number;
}

export function totalAppointments(agg: AppointmentAggregate): number {
  return Object.values(agg.byStatus).reduce((sum, n) => sum + n, 0);
}
