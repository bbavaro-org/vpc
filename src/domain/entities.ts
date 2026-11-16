export const SPECIALTIES = ['Child/Youth', 'Adult Anxiety', 'Couples', 'Assessments'] as const;
export type Specialty = (typeof SPECIALTIES)[number];
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'noShow';
export type IntakeStage = 'inquiry' | 'intakeCompleted' | 'matched' | 'booked' | 'closed';
export const LEAD_SOURCES = [
  'Google search',
  'Physician referral',
  'Insurance / EAP',
  'Social media',
  'Word of mouth',
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

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
  readonly source: LeadSource;
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
