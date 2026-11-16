import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { AutomationImpact } from '../application/automation';
import { MockAutomationRepository } from '../infrastructure/mockAutomation';
import { AutomationPanel } from './automation/AutomationPanel';
import { automationLoader } from './automation/automationProvider';
import { resolveSlot } from './shell/provider';

const impact = (count: number): AutomationImpact => ({
  adminHoursSaved: 12.5,
  intakeFormsAutoFiled: 40,
  remindersSent: 210,
  syncErrors: { count, status: count > 0 ? 'needs-attention' : 'healthy' },
});

describe('automation panel', () => {
  it('renders four cards with a needs-attention tag for non-zero sync errors', () => {
    const html = renderToString(createElement(AutomationPanel, { impact: impact(3) }));
    expect(html.match(/<article/g)).toHaveLength(4);
    expect(html).toContain('data-status="needs-attention"');
    expect(html).toContain('Needs attention');
    expect(html).not.toContain('Healthy');
  });

  it('renders 0 with a Healthy tag when there are no sync errors', () => {
    const html = renderToString(createElement(AutomationPanel, { impact: impact(0) }));
    expect(html).toContain('Healthy');
    expect(html).toContain('data-status="healthy"');
    expect(html).not.toContain('Needs attention');
  });

  it('loader always yields four items from the mock repository', async () => {
    const state = await resolveSlot(
      { 'automation-impact': automationLoader(new MockAutomationRepository()) },
      'automation-impact',
    );
    expect(state.status).toBe('ready');
    if (state.status === 'ready') expect(state.viewModel.items).toHaveLength(4);
  });
});
