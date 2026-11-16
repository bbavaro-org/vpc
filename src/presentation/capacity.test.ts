import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { SpecialtyBooking, Waitlist } from '../application/capacity';
import { MockJaneRepository } from '../infrastructure/mockJane';
import { CapacityPanel } from './capacity/CapacityPanel';
import { capacityLoader } from './capacity/capacityProvider';

const bookings: SpecialtyBooking[] = [
  { specialty: 'Child/Youth', state: 'booked', bookedPercent: 96 },
  { specialty: 'Adult Anxiety', state: 'booked', bookedPercent: 40 },
  { specialty: 'Couples', state: 'no-capacity' },
  { specialty: 'Assessments', state: 'booked', bookedPercent: 55 },
];
const waitlist: Waitlist = { total: 14, dominantSpecialty: 'Child/Youth' };

describe('capacity panel', () => {
  const html = renderToString(createElement(CapacityPanel, { bookings, waitlist }));
  it('renders a bar per specialty with percent', () => {
    expect(html.match(/data-specialty=/g)).toHaveLength(4);
    expect(html).toContain('96% booked');
    expect(html).toContain('40% booked');
  });
  it('distinguishes near-full from open room', () => {
    expect(html).toMatch(/data-specialty="Child\/Youth"[^>]*data-near-full="true"/);
    expect(html).toMatch(/data-specialty="Adult Anxiety"[^>]*data-near-full="false"/);
  });
  it('shows waitlist total and dominant specialty', () => {
    expect(html).toContain('Waitlist');
    expect(html).toContain('data-waitlist-total="14"');
    expect(html).toContain('Most waiting: Child/Youth');
  });
  it('renders no-capacity as no capacity, not 0%', () => {
    expect(html).toMatch(/data-specialty="Couples"[^>]*data-no-capacity="true"/);
    expect(html).toContain('No capacity');
    expect(html).not.toMatch(/>0% booked/);
  });
  it('loader yields a render function', async () => {
    const vm = await capacityLoader(new MockJaneRepository())();
    expect(vm.render).toBeTypeOf('function');
    expect(vm.items.length).toBeGreaterThan(0);
    for (const item of vm.items) {
      expect(item.label).toBeTruthy();
      expect(item.value).toMatch(/^(No capacity|\d+% booked)$/);
    }
  });
  it('loader view model and rendered body distinguish no-capacity from percent booked', async () => {
    const vm = await capacityLoader(new MockJaneRepository())();
    const body = renderToString(vm.render?.() as never);
    const noCap = vm.items.filter((i) => i.value === 'No capacity');
    const booked = vm.items.filter((i) => i.value.endsWith('% booked'));
    expect(noCap.length + booked.length).toBe(vm.items.length);
    expect(body.includes('No capacity')).toBe(noCap.length > 0);
    for (const i of booked) expect(body).toContain(i.value);
  });
});
