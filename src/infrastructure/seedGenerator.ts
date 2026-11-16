import { SPECIALTIES, type Specialty, type Appointment, type AppointmentStatus, type Clinician, type IntakeStage, type Inquiry, LEAD_SOURCES, type LeadSource, type WaitlistEntry } from '../domain/entities';
import { REFERENCE_NOW } from '../domain/referenceNow';

export { REFERENCE_NOW, SPECIALTIES };
export const SEED = 20260101;
/** Days of history before REFERENCE_NOW: feeds the headline 30-day and prior-30-day comparison. */
export const WINDOW_DAYS = 90;
/** Days of booked-ahead appointments after REFERENCE_NOW: feeds the capacity panel's forward window. */
export const FORWARD_DAYS = 14;

const DAY = 86_400_000;
const HOUR = 3_600_000;
const SOURCE_WEIGHTS: readonly (readonly [LeadSource, number])[] = [
  [LEAD_SOURCES[0], 38],
  [LEAD_SOURCES[1], 25],
  [LEAD_SOURCES[2], 18],
  [LEAD_SOURCES[3], 12],
  [LEAD_SOURCES[4], 7],
];
const STAGE_WEIGHTS: readonly (readonly [IntakeStage, number])[] = [
  ['inquiry', 15],
  ['intakeCompleted', 15],
  ['matched', 15],
  ['booked', 40],
  ['closed', 15],
];
// Child/Youth carries the longest waitlist.
const WAITLIST_WEIGHTS: readonly (readonly [Specialty, number])[] = [
  ['Child/Youth', 50],
  ['Assessments', 25],
  ['Adult Anxiety', 15],
  ['Couples', 10],
];

type Wire<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K];
};

export interface Store {
  appointments: Wire<Appointment>[];
  inquiries: Wire<Inquiry>[];
  clinicians: Clinician[];
  waitlist: Wire<WaitlistEntry>[];
}

// mulberry32: small deterministic PRNG.
export function prng(seed: number): () => number {
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
  const pickWeighted = <T>(xs: readonly (readonly [T, number])[]): T => {
    const total = xs.reduce((sum, [, w]) => sum + w, 0);
    let roll = rand() * total;
    for (const [value, weight] of xs) {
      roll -= weight;
      if (roll < 0) return value;
    }
    return (xs[xs.length - 1] as readonly [T, number])[0];
  };
  const now = REFERENCE_NOW.getTime();
  const iso = (ms: number) => new Date(ms).toISOString();

  const clinicians: Clinician[] = Array.from({ length: 8 }, (_, i) => ({
    id: `cl-${String(i + 1).padStart(3, '0')}`,
    specialty: SPECIALTIES[i % SPECIALTIES.length] as Specialty,
    weeklyCapacity: int(8, 11),
  }));

  const appointments: Wire<Appointment>[] = [];
  const inquiries: Wire<Inquiry>[] = [];
  const waitlist: Wire<WaitlistEntry>[] = [];

  // Day offsets from REFERENCE_NOW: negative is history, 0..FORWARD_DAYS-1 is the booked-ahead window.
  for (let d = -WINDOW_DAYS; d < FORWARD_DAYS; d++) {
    const dayStart = now + d * DAY;
    const forward = d >= 0;
    // History ramps up so the recent 30 days differ from the prior 30; future days are only
    // partly booked so far, thinning out the further ahead they are.
    const volume = forward ? 1.1 * (1 - (0.5 * d) / FORWARD_DAYS) : 0.85 + (0.25 * (d + WINDOW_DAYS)) / WINDOW_DAYS;
    const weekday = new Date(dayStart).getUTCDay();
    const apptCount = weekday === 0 || weekday === 6 ? int(0, 2) : Math.round(int(9, 15) * volume);
    for (let n = 0; n < apptCount; n++) {
      const clinician = pick(clinicians);
      const scheduledMs = dayStart + int(8, 17) * HOUR;
      const roll = rand();
      // A future appointment that is cancelled frees its slot, so only live bookings are seeded ahead.
      const status: AppointmentStatus = forward
        ? 'scheduled'
        : roll < 0.1 + 0.05 * (1 - (d + WINDOW_DAYS) / WINDOW_DAYS)
          ? 'noShow'
          : roll < 0.2
            ? 'cancelled'
            : 'completed';
      appointments.push({
        id: `ap-${String(appointments.length + 1).padStart(5, '0')}`,
        clinicianId: clinician.id,
        specialty: clinician.specialty,
        status,
        scheduledAt: iso(scheduledMs),
        bookedAt: iso(Math.min(scheduledMs - int(1, 21) * DAY, now - HOUR)),
      });
    }
    if (forward) continue;

    // Inquiries and waitlist entries only exist up to REFERENCE_NOW.
    const inquiryCount = Math.round(int(1, 4) * (1 + (d + WINDOW_DAYS) / WINDOW_DAYS));
    for (let n = 0; n < inquiryCount; n++) {
      const receivedMs = dayStart + int(0, 23) * HOUR;
      const intakeStage = pickWeighted(STAGE_WEIGHTS);
      inquiries.push({
        id: `iq-${String(inquiries.length + 1).padStart(5, '0')}`,
        source: pickWeighted(SOURCE_WEIGHTS),
        receivedAt: iso(receivedMs),
        intakeStage,
        firstSessionAt: intakeStage === 'booked' ? iso(receivedMs + int(2, 14) * DAY) : null,
      });
    }
    if (rand() < 0.25) {
      const addedMs = dayStart + int(0, 23) * HOUR;
      const removedMs = addedMs + int(7, 75) * DAY;
      waitlist.push({
        id: `wl-${String(waitlist.length + 1).padStart(4, '0')}`,
        specialty: pickWeighted(WAITLIST_WEIGHTS),
        addedAt: iso(addedMs),
        removedAt: removedMs <= now ? iso(removedMs) : null,
      });
    }
  }

  return { appointments, inquiries, clinicians, waitlist };
}

export function serializeStore(store: Store): string {
  return JSON.stringify(store, null, 2) + '\n';
}
