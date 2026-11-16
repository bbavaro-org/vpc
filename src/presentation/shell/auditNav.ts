import { recordView } from '../../application/audit';
import { AUDIT_VIEW_ID, type AuditLog, type Role } from '../../domain';

/** Opens the audit view, recording one audit entry only on the closed-to-open transition. */
export function openAuditView(log: AuditLog, role: Role, alreadyOpen: boolean): boolean {
  if (!alreadyOpen) recordView(log, role, AUDIT_VIEW_ID);
  return true;
}

/** Closes the audit view without recording anything. */
export function closeAuditView(): boolean {
  return false;
}
