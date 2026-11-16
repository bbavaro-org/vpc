import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AuditView } from '../audit/AuditView';
import { DashboardShell } from '../shell/DashboardShell';
import { InMemoryAuditLog } from '../../infrastructure/inMemoryAuditLog';

const T = new Date('2026-11-16T12:00:00Z');

describe('audit view', () => {
  it('renders a row per entry with role and panel', () => {
    const html = renderToString(
      <AuditView entries={[{ role: 'marketing', panel: 'lead-sources', timestamp: T }]} />,
    );
    expect(html).toContain('data-role="marketing"');
    expect(html).toContain('data-panel="lead-sources"');
    expect(html).toContain('Lead sources');
    expect(html).toContain(T.toLocaleString('en-CA'));
  });

  it('lists newest first and labels the audit log view', () => {
    const html = renderToString(
      <AuditView
        entries={[
          { role: 'management', panel: 'audit-log', timestamp: new Date(1) },
          { role: 'clinician', panel: 'intake-funnel', timestamp: new Date(2) },
        ]}
      />,
    );
    expect(html.indexOf('intake-funnel')).toBeLessThan(html.indexOf('audit-log'));
    expect(html).toContain('Audit log');
  });

  it('shows the audit button only to management', () => {
    const log = new InMemoryAuditLog();
    const show = (role: 'management' | 'clinician') =>
      renderToString(<DashboardShell provider={{}} role={role} auditLog={log} />);
    expect(show('management')).toContain('View audit log');
    expect(show('clinician')).not.toContain('View audit log');
  });
});
