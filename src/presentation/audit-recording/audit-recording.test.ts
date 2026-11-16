import { describe, expect, it } from 'vitest';
import { InMemoryAuditLog } from '../../infrastructure/inMemoryAuditLog';
import { gateProvider } from '../access/gateProvider';

describe('audit recording', () => {
  // AC-3
  it('records one entry per panel per activation, even when loaded twice', async () => {
    const log = new InMemoryAuditLog();
    const T = new Date('2026-01-01T00:00:00Z');
    const p = gateProvider({ 'intake-funnel': async () => 1 } as never, 'front-desk', {
      log,
      clock: () => T,
    });
    const load = p['intake-funnel']!;
    await load();
    await load();
    expect(log.list()).toEqual([{ role: 'front-desk', panel: 'intake-funnel', timestamp: T }]);
  });

  it('does not record a rejected load', async () => {
    const log = new InMemoryAuditLog();
    const p = gateProvider(
      {
        'intake-funnel': async () => {
          throw new Error('x');
        },
      } as never,
      'front-desk',
      { log },
    );
    await expect(p['intake-funnel']!()).rejects.toThrow();
    expect(log.list()).toEqual([]);
  });
});
