export const SPECIALTIES = ['Child/Youth', 'Adult Anxiety', 'Couples', 'Assessments'] as const;
export type Specialty = (typeof SPECIALTIES)[number];
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'noShow';
export type IntakeStage = 'new' | 'contacted' | 'assessment' | 'booked' | 'closed';

export interface Appointment {
  readonly id: string;
  readonly clinicianId: string;
  readonly specialty: Specialty;
  readonly status: AppointmentStatus;
  readonly scheduledAt: Date;
  readonly bookedAt: Date;
}

export interface Inquiry {
  readonly id: string;
  readonly source: string;
  readonly receivedAt: Date;
  readonly intakeStage: IntakeStage;
  /** Date of the client's first session; null until the inquiry converts to a booking. */
  readonly firstSessionAt: Date | null;
}

export interface Clinician {
  readonly id: string;
  readonly specialty: Specialty;
  readonly weeklyCapacity: number;
}

export interface WaitlistEntry {
  readonly id: string;
  readonly specialty: Specialty;
  readonly addedAt: Date;
  /** When the client left the waitlist; null while still waiting. */
  readonly removedAt: Date | null;
}
