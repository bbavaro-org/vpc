import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ROLES } from '../domain';
import { PANEL_PERMISSIONS, permittedPanels } from '../application/access';
import { gateProvider } from './access/gateProvider';
import { DashboardShell } from './shell/DashboardShell';
import { resolveSlot, SLOT_IDS, type DashboardProvider } from './shell/provider';

const vm = async () => ({ items: [{ label: 'Leads', value: '42' }] });

describe('role gating', () => {
  // AC-1: role selection shows only permitted panels
  it('renders only the permitted panels and nav links for a role', () => {
    const html = renderToString(<DashboardShell provider={{}} role="clinician" />);
    expect(html).toContain('data-slot="clinician-capacity"');
    expect(html).not.toContain('data-slot="lead-sources"');
    expect(html).not.toContain('href="#slot-lead-sources-title"');
    expect(html).toContain('aria-label="Active role"');
  });

  // AC-2: a denied panel issues no data request
  it('never calls a denied loader when resolved through the gated provider', async () => {
    for (const role of ROLES) {
      const spies = Object.fromEntries(SLOT_IDS.map((id) => [id, vi.fn(vm)])) as Record<
        (typeof SLOT_IDS)[number],
        ReturnType<typeof vi.fn>
      >;
      const gated = gateProvider(spies as unknown as DashboardProvider, role);
      for (const id of SLOT_IDS) await resolveSlot(gated, id);
      for (const id of SLOT_IDS) {
        const expected = PANEL_PERMISSIONS[role].includes(id) ? 1 : 0;
        expect(spies[id]).toHaveBeenCalledTimes(expected);
      }
      expect(Object.keys(gated)).toEqual([...permittedPanels(role)]);
    }
  });
});
