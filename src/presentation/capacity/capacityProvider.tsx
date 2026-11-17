import type { getBookedPercentBySpecialty, getWaitlist } from '../../application/capacity';
import type { PanelFetcher } from '../panelApi';
import type { PanelViewModel } from '../shell/provider';
import { CapacityPanel } from './CapacityPanel';

interface CapacityData {
  readonly bookings: Awaited<ReturnType<typeof getBookedPercentBySpecialty>>;
  readonly waitlist: Awaited<ReturnType<typeof getWaitlist>>;
}

/** Loader for the 'clinician-capacity' slot; maps the endpoint's aggregate JSON. */
export function capacityLoader(fetchPanel: PanelFetcher): () => Promise<PanelViewModel> {
  return async () => {
    const { items, data } = await fetchPanel<CapacityData>('clinician-capacity');
    return {
      items,
      render: () => <CapacityPanel bookings={data.bookings} waitlist={data.waitlist} />,
    };
  };
}
