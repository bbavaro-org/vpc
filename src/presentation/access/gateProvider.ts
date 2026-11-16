import { canView } from '../../application/access';
import { recordView } from '../../application/audit';
import type { AuditLog, Role } from '../../domain';
import { SLOT_IDS, type DashboardProvider, type SlotId } from '../shell/provider';

type Loader = NonNullable<DashboardProvider[SlotId]>;
type AnyLoader = (...args: unknown[]) => Promise<unknown>;

/**
 * Keeps only the loaders the role may view, so a denied panel never issues a data request.
 * With `audit`, a successful load records one view per panel per provider instance.
 */
export function gateProvider(
  loaders: DashboardProvider,
  role: Role,
  audit?: { log: AuditLog; clock?: () => Date },
): DashboardProvider {
  const gated: Partial<Record<SlotId, Loader>> = {};
  const recorded = new Set<SlotId>();
  for (const id of SLOT_IDS) {
    const load = loaders[id];
    if (!load || !canView(role, id)) continue;
    gated[id] = audit
      ? ((async (...args: unknown[]) => {
          const result = await (load as AnyLoader)(...args);
          if (!recorded.has(id)) {
            recorded.add(id);
            recordView(audit.log, role, id, audit.clock);
          }
          return result;
        }) as Loader)
      : load;
  }
  return gated;
}
