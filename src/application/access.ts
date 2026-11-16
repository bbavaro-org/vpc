import { AUDIT_VIEW_ID, PANEL_IDS, type PanelId, type Role, type ViewId } from '../domain';

export const ROLE_LABELS: Readonly<Record<Role, string>> = {
  'front-desk': 'Front desk',
  clinician: 'Clinician',
  marketing: 'Marketing',
  management: 'Management',
};

export const PANEL_PERMISSIONS: Readonly<Record<Role, readonly PanelId[]>> = {
  'front-desk': ['intake-funnel', 'clinician-capacity'],
  clinician: ['clinician-capacity'],
  marketing: ['intake-funnel', 'lead-sources', 'clinician-capacity'],
  management: PANEL_IDS,
};

export const DEFAULT_ROLE: Role = 'management';

export function permittedPanels(role: Role): readonly PanelId[] {
  const allowed = PANEL_PERMISSIONS[role];
  return PANEL_IDS.filter((id) => allowed.includes(id));
}

export function canView(role: Role, view: ViewId): boolean {
  if (view === AUDIT_VIEW_ID) return role === 'management';
  return PANEL_PERMISSIONS[role].includes(view);
}
