import { describe, expect, it, vi } from 'vitest';
import { InMemoryAuditLog } from '../infrastructure/inMemoryAuditLog';
import { recordView } from './audit';

const T = new Date('2026-03-01T10:00:00Z');

describe('recordView', () => {
  // AC-3: entry holds role + timestamp and no personal or clinical data
  it('appends an entry with exactly role, panel, timestamp', () => {
    const log = new InMemoryAuditLog();
    recordView(log, 'marketing', 'lead-sources', () => T);
    expect(log.list()).toEqual([{ role: 'marketing', panel: 'lead-sources', timestamp: T }]);
    expect(Object.keys(log.list()[0]!).sort()).toEqual(['panel', 'role', 'timestamp']);
  });

  it('defaults the timestamp to the real current time', () => {
    const log = new InMemoryAuditLog();
    const before = Date.now();
    recordView(log, 'management', 'audit-log');
    const t = log.list()[0]!.timestamp.getTime();
    expect(t).toBeGreaterThanOrEqual(before);
    expect(t).toBeLessThanOrEqual(Date.now());
  });

  it('list returns a stable frozen snapshot until the next append, and append notifies', () => {
    const log = new InMemoryAuditLog();
    const listener = vi.fn();
    const unsubscribe = log.subscribe(listener);
    const first = log.list();
    expect(log.list()).toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
    recordView(log, 'clinician', 'clinician-capacity', () => T);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(log.list()).not.toBe(first);
    expect(log.list()).toBe(log.list());
    unsubscribe();
    recordView(log, 'clinician', 'clinician-capacity', () => T);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
