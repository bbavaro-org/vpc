import type { Appointment, AppointmentStatus, Clinician, IntakeStage, Inquiry, WaitlistEntry } from '../domain/entities';

export const SEED = 20260101;
export const REFERENCE_DATE = new Date('2026-11-01T00:00:00.000Z');
export const WINDOW_DAYS = 90;

const DAY = 86_400_000;
const HOUR = 3_600_000;
const SPECIALTIES = ['Anxiety', 'Depression', 'Trauma', 'Couples', 'ADHD'];
const SOURCES = ['website', 'referral', 'phone', 'insurance', 'walk-in'];
const STAGES: IntakeStage[] = ['new', 'contacted', 'assessment', 'booked', 'closed'];

type Wire<T> = { [K in keyof T]: T[K] extends Date ? string : T[K] };

export interface Store {
  appointments: Wire<Appointment>[];
  inquiries: Wire<Inquiry>[];
  clinicians: Clinician[];
  waitlist: Wire<WaitlistEntry>[];
}

// mulberry32: small deterministic PRNG.
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateStore(seed: number): Store {
  const rand = prng(seed);
  const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
  const pick = <T>(xs: readonly T[]): T => xs[int(0, xs.length - 1)] as T;
  const end = REFERENCE_DATE.getTime();
  const start = end - WINDOW_DAYS * DAY;
  const iso = (ms: number) => new Date(ms).toISOString();

  const clinicians: Clinician[] = Array.from({ length: 8 }, (_, i) => ({
    id: `cl-${String(i + 1).padStart(3, '0')}`,
    specialty: SPECIALTIES[i % SPECIALTIES.length] as string,
    weeklyCapacity: int(15, 30),
  }));

  const appointments: Wire<Appointment>[] = [];
  const inquiries: Wire<Inquiry>[] = [];
  const waitlist: Wire<WaitlistEntry>[] = [];

  for (let d = 0; d < WINDOW_DAYS; d++) {
    const dayStart = start + d * DAY;
    // Volume ramps up over the window so the recent 30 days differ from the prior 30.
    const trend = 1 + d / WINDOW_DAYS;
    const weekday = new Date(dayStart).getUTCDay();
    const apptCount = weekday === 0 || weekday === 6 ? int(0, 2) : Math.round(int(4, 8) * trend);
    for (let n = 0; n < apptCount; n++) {
      const clinician = pick(clinicians);
      const scheduledMs = dayStart + int(8, 17) * HOUR;
      const roll = rand();
      const status: AppointmentStatus =
        roll < 0.1 + 0.05 * (1 - d / WINDOW_DAYS) ? 'noShow' : roll < 0.2 ? 'cancelled' : 'completed';
      appointments.push({
        id: `ap-${String(appointments.length + 1).padStart(5, '0')}`,
        clinicianId: clinician.id,
        specialty: clinician.specialty,
        status,
        scheduledAt: iso(scheduledMs),
        bookedAt: iso(scheduledMs - int(1, 21) * DAY),
      });
    }
    const inquiryCount = Math.round(int(1, 4) * trend);
    for (let n = 0; n < inquiryCount; n++) {
      inquiries.push({
        id: `iq-${String(inquiries.length + 1).padStart(5, '0')}`,
        source: pick(SOURCES),
        receivedAt: iso(dayStart + int(0, 23) * HOUR),
        intakeStage: pick(STAGES),
      });
    }
    if (rand() < 0.25) {
      waitlist.push({
        id: `wl-${String(waitlist.length + 1).padStart(4, '0')}`,
        specialty: pick(SPECIALTIES),
        addedAt: iso(dayStart + int(0, 23) * HOUR),
      });
    }
  }

  return { appointments, inquiries, clinicians, waitlist };
}

export function serializeStore(store: Store): string {
  return JSON.stringify(store, null, 2) + '\n';
}
