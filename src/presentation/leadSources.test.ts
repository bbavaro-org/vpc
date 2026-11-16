import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { InquiryRepository } from '../domain';
import type { LeadSourceShares } from '../application/leadSources';
import { LeadSourcesPanel } from './leadSources/LeadSourcesPanel';
import { leadSourcesLoader } from './leadSources/leadSourcesProvider';

const ready: Extract<LeadSourceShares, { state: 'ready' }> = {
  state: 'ready',
  total: 3,
  shares: [
    { source: 'Google search', count: 2, sharePercent: 67 },
    { source: 'Physician referral', count: 1, sharePercent: 33 },
    { source: 'Insurance / EAP', count: 0, sharePercent: 0 },
    { source: 'Social media', count: 0, sharePercent: 0 },
    { source: 'Word of mouth', count: 0, sharePercent: 0 },
  ],
};

describe('lead sources panel', () => {
  it('renders a legend entry per source with its percent and tokenised colours', () => {
    const html = renderToString(createElement(LeadSourcesPanel, { result: ready }));
    expect(html.match(/data-source=/g)).toHaveLength(5);
    expect(html).toContain('67%');
    expect(html).toContain('var(--lime)');
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });
  it('renders an empty message when there is no data', () => {
    const html = renderToString(createElement(LeadSourcesPanel, { result: { state: 'empty' } }));
    expect(html).toContain('No new clients');
  });
  it('loader returns no items when empty and items when ready', async () => {
    const mk = (n: Record<string, number>): InquiryRepository => ({
      queryInquiries: async (range) => ({
        range,
        bySource: {},
        newClientsBySource: n,
        total: 0,
        averageDaysToFirstSession: null,
        byStage: { inquiry: 0, intakeCompleted: 0, matched: 0, booked: 0, closed: 0 },
      }),
    });
    expect((await leadSourcesLoader(mk({}))()).items).toEqual([]);
    const vm = await leadSourcesLoader(mk({ 'Google search': 1 }))();
    expect(vm.items[0]).toEqual({ label: 'Google search', value: '100%' });
  });
});
