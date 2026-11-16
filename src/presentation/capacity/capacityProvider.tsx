import type { BookingRepository } from '../../domain';
import { getBookedPercentBySpecialty, getWaitlist } from '../../application/capacity';
import { REFERENCE_NOW } from '../../infrastructure/referenceNow';
import type { PanelViewModel } from '../shell/provider';
import { CapacityPanel } from './CapacityPanel';

/** Loader for the 'clinician-capacity' slot; reads the use cases' view models only. */
export function capacityLoader(
  repo: BookingRepository,
  now: Date = REFERENCE_NOW,
): () => Promise<PanelViewModel> {
  return async () => {
    const [bookings, waitlist] = await Promise.all([
      getBookedPercentBySpecialty(repo, now),
      getWaitlist(repo, now),
    ]);
    return {
      items: bookings.map((b) => ({
        label: b.specialty,
        value: b.state === 'no-capacity' ? 'No capacity' : `${b.bookedPercent}% booked`,
      })),
      render: () => <CapacityPanel bookings={bookings} waitlist={waitlist} />,
    };
  };
}
