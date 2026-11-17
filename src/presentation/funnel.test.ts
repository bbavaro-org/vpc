import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { buildFunnel } from '../application/funnel';
import type { DateRange, InquiryRepository } from '../domain';
import { MockAutomationRepository } from '../infrastructure/mockAutomation';
import { MockJaneRepository } from '../infrastructure/mockJane';
import { serverFetcher } from './testFetcher';
import { FunnelPanel } from './funnel/FunnelPanel';
import { funnelLoader } from './funnel/funnelProvider';

const withInquiries = (inq: InquiryRepository) => {
  const base = new MockJaneRepository();
  return { queryBookings: (r: DateRange) => base.queryBookings(r), queryInquiries: inq.queryInquiries };
};

describe('funnel panel', () => {
  it('renders one bar per stage with the largest drop distinguished', () => {
    const html = renderToString(createElement(FunnelPanel, { funnel: buildFunnel([100, 70, 55, 40]) }));
    expect(html.match(/data-stage=/g)).toHaveLength(4);
    expect(html.match(/data-largest="true"/g)).toHaveLength(1);
    expect(html).toContain('Largest drop');
    expect(html).toContain('Inquiries');
    expect(html).toContain('First session booked');
  });
  it('renders an anomaly as a flagged state, not a negative number', () => {
    const html = renderToString(createElement(FunnelPanel, { funnel: buildFunnel([100, 90, 120, 10]) }));
    expect(html).toContain('data-anomaly="true"');
    expect(html).toContain('Data anomaly');
    expect(html).not.toContain('-30');
  });
  it('loader yields items and a render function', async () => {
    const vm = await funnelLoader(serverFetcher())();
    expect(vm.render).toBeTypeOf('function');
    expect(vm.items.length).toBe(4);
  });
  it('loader returns no items when total is 0', async () => {
    const empty: InquiryRepository = {
      async queryInquiries(range) {
        return {
          range,
          bySource: {},
          newClientsBySource: {},
          total: 0,
          averageDaysToFirstSession: null,
          byStage: { inquiry: 0, intakeCompleted: 0, matched: 0, booked: 0, closed: 0 },
        };
      },
    };
    expect((await funnelLoader(serverFetcher({ jane: withInquiries(empty), automation: new MockAutomationRepository() }))()).items).toEqual([]);
  });
});
