export type Specialty = string;
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
}
