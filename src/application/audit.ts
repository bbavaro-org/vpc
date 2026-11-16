import type { AuditLog, Role, ViewId } from '../domain';

/** Records that a role viewed a view. The timestamp is the real access time. */
export function recordView(
  log: AuditLog,
  role: Role,
  view: ViewId,
  clock: () => Date = () => new Date(),
): void {
  log.append({ role, panel: view, timestamp: clock() });
}
