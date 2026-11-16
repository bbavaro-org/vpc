export const ROLES = ['front-desk', 'clinician', 'marketing', 'management'] as const;
export type Role = (typeof ROLES)[number];

export const PANEL_IDS = [
  'headline-metrics',
  'intake-funnel',
  'lead-sources',
  'clinician-capacity',
  'automation-impact',
] as const;
export type PanelId = (typeof PANEL_IDS)[number];

export const AUDIT_VIEW_ID = 'audit-log';
export type ViewId = PanelId | typeof AUDIT_VIEW_ID;

/** Holds no personal or clinical data. */
export interface AuditEntry {
  readonly role: Role;
  readonly panel: ViewId;
  readonly timestamp: Date;
}

export interface AuditLog {
  append(entry: AuditEntry): void;
  list(): readonly AuditEntry[];
  subscribe(listener: () => void): () => void;
}
