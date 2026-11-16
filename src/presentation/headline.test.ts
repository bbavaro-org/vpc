import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { HeadlineMetrics } from '../application/headline';
import { MockJaneRepository } from '../infrastructure/mockJane';
import { HeadlineCards } from './headline/HeadlineCards';
import { headlineLoader } from './headline/headlineProvider';
import { PanelSlotView } from './shell/PanelSlot';
import { resolveSlot } from './shell/provider';

const m = (current: number | null, prior: number | null) => ({
  current,
  prior,
  change: current === null || prior === null ? null : current - prior,
  direction:
    current === null || prior === null ? null : current < prior ? ('down' as const) : ('up' as const),
});
const metrics: HeadlineMetrics = {
  newInquiries: m(12, 10),
  inquiryToFirstSessionDays: m(7.6, 9.1),
  clinicianUtilizationPercent: { ...m(95, 85), targetBand: { min: 80, max: 90 }, bandStatus: 'above' },
  noShowRatePercent: m(null, 5),
};

describe('headline cards', () => {
  it('renders four cards, delta, band indicator and a no-data card', () => {
    const html = renderToString(createElement(HeadlineCards, { metrics }));
    expect(html.match(/<article/g)).toHaveLength(4);
    expect(html).toContain('7.6 days');
    expect(html).toContain('Down from 9.1 days');
    expect(html).toContain('Target 80–90%');
    expect(html).toContain('Above target');
    expect(html).toContain('data-no-data="true"');
    expect(html).not.toContain('NaN');
  });

  it('renders the flat delta and the null-prior comparison text', () => {
    const edge: HeadlineMetrics = {
      ...metrics,
      newInquiries: { current: 10, prior: 10, change: 0, direction: 'flat' },
      inquiryToFirstSessionDays: { current: 7, prior: null, change: null, direction: null },
    };
    const html = renderToString(createElement(HeadlineCards, { metrics: edge }));
    expect(html).toContain('Unchanged from 10');
    expect(html).toContain('No prior-period comparison');
  });

  it('live panel reads real view models through the provider seam', async () => {
    const jane = new MockJaneRepository();
    const provider = { 'headline-metrics': headlineLoader({ bookings: jane, inquiries: jane }) };
    const state = await resolveSlot(provider, 'headline-metrics');
    expect(state.status).toBe('ready');
    const html = renderToString(createElement(PanelSlotView, { slot: 'headline-metrics', state }));
    expect(html.match(/<article/g)).toHaveLength(4);
  });
});
