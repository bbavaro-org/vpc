import { REFERENCE_NOW, SPECIALTIES, type BookingRepository, type DateRange, type SpecialtyCount } from '../domain';

export const WINDOW_WEEKS = 2;
const WINDOW_MS = WINDOW_WEEKS * 7 * 24 * 60 * 60 * 1000;

export type SpecialtyBooking =
  | { readonly specialty: string; readonly state: 'no-capacity' }
  | { readonly specialty: string; readonly state: 'booked'; readonly bookedPercent: number };

export interface Waitlist {
  readonly total: number;
  readonly dominantSpecialty: string | null;
}

function forwardWindow(now: Date): DateRange {
  return { from: now, to: new Date(now.getTime() + WINDOW_MS) };
}

function countOf(counts: readonly SpecialtyCount[], specialty: string): number {
  return counts.find((c) => c.specialty === specialty)?.count ?? 0;
}

export async function getBookedPercentBySpecialty(
  repo: BookingRepository,
  now: Date = REFERENCE_NOW,
): Promise<SpecialtyBooking[]> {
  const agg = await repo.queryBookings(forwardWindow(now));
  return SPECIALTIES.map((specialty): SpecialtyBooking => {
    const capacity = countOf(agg.weeklyCapacityBySpecialty, specialty) * WINDOW_WEEKS;
    if (capacity <= 0) return { specialty, state: 'no-capacity' };
    const booked = countOf(agg.liveBookingsBySpecialty, specialty);
    return { specialty, state: 'booked', bookedPercent: Math.round((booked / capacity) * 100) };
  });
}

/** Who is waiting as of `now`: the booking aggregate's waitlist is a snapshot at the range end. */
export async function getWaitlist(
  repo: BookingRepository,
  now: Date = REFERENCE_NOW,
): Promise<Waitlist> {
  const agg = await repo.queryBookings({ from: now, to: now });
  const list = agg.waitlistBySpecialty;
  const total = list.reduce((sum, c) => sum + c.count, 0);
  const top = list.reduce<SpecialtyCount | null>((a, c) => (!a || c.count > a.count ? c : a), null);
  return { total, dominantSpecialty: top && top.count > 0 ? top.specialty : null };
}
