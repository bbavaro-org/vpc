import { describe, expect, it } from 'vitest';
import { PANEL_IDS, ROLES } from '../domain';
import { DEFAULT_ROLE, PANEL_PERMISSIONS, ROLE_LABELS, canView, permittedPanels } from './access';

describe('access', () => {
  it('marketing sees funnel, lead sources, capacity in panel order', () => {
    expect(permittedPanels('marketing')).toEqual(['intake-funnel', 'lead-sources', 'clinician-capacity']);
  });

  it('matches the approved map', () => {
    expect(permittedPanels('front-desk')).toEqual(['intake-funnel', 'clinician-capacity']);
    expect(permittedPanels('clinician')).toEqual(['clinician-capacity']);
    expect(permittedPanels('management')).toEqual([...PANEL_IDS]);
  });

  it('only management may view the audit log', () => {
    for (const role of ROLES) expect(canView(role, 'audit-log')).toBe(role === 'management');
  });

  it('canView follows the permission map', () => {
    expect(canView('clinician', 'intake-funnel')).toBe(false);
    expect(canView('clinician', 'clinician-capacity')).toBe(true);
    expect(PANEL_PERMISSIONS.marketing).toContain('lead-sources');
  });

  it('has labels for every role and a management default', () => {
    for (const role of ROLES) expect(ROLE_LABELS[role]).toBeTruthy();
    expect(DEFAULT_ROLE).toBe('management');
  });
});
