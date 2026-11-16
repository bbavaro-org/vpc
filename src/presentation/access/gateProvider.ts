import { canView } from '../../application/access';
import type { Role } from '../../domain';
import { SLOT_IDS, type DashboardProvider, type SlotId } from '../shell/provider';

type Loader = NonNullable<DashboardProvider[SlotId]>;

/** Keeps only the loaders the role may view, so a denied panel never issues a data request. */
export function gateProvider(loaders: DashboardProvider, role: Role): DashboardProvider {
  const gated: Partial<Record<SlotId, Loader>> = {};
  for (const id of SLOT_IDS) {
    const load = loaders[id];
    if (load && canView(role, id)) gated[id] = load;
  }
  return gated;
}
