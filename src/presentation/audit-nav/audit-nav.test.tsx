import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DashboardShell } from '../shell/DashboardShell';
import { closeAuditView, openAuditView } from '../shell/auditNav';
import { InMemoryAuditLog } from '../../infrastructure/inMemoryAuditLog';

describe('audit view navigation', () => {
  // AC: audit view is its own screen with a way back
  it('replaces the panel grid with the audit view and offers a back control', () => {
    const log = new InMemoryAuditLog();
    const html = renderToString(
      <DashboardShell provider={{}} role="management" auditLog={log} initialAuditOpen />,
    );
    expect(html).toContain('data-testid="audit-view"');
    expect(html).not.toContain('data-slot=');
    expect(html).toContain('Back to dashboard');
    expect(html).toContain('vpc-btn');
  });

  it('shows the panels and no audit view when closed', () => {
    const html = renderToString(
      <DashboardShell provider={{}} role="management" auditLog={new InMemoryAuditLog()} />,
    );
    expect(html).toContain('data-slot=');
    expect(html).not.toContain('data-testid="audit-view"');
    expect(html).not.toContain('Back to dashboard');
  });

  it('never shows the audit view to a role without access', () => {
    const html = renderToString(
      <DashboardShell provider={{}} role="clinician" auditLog={new InMemoryAuditLog()} initialAuditOpen />,
    );
    expect(html).not.toContain('data-testid="audit-view"');
    expect(html).not.toContain('Back to dashboard');
    expect(html).toContain('data-slot=');
  });

  it('records exactly one entry on open and none on back', () => {
    const log = new InMemoryAuditLog();
    expect(openAuditView(log, 'management', false)).toBe(true);
    expect(log.list()).toHaveLength(1);
    expect(openAuditView(log, 'management', true)).toBe(true);
    expect(log.list()).toHaveLength(1);
    expect(closeAuditView()).toBe(false);
    expect(log.list()).toHaveLength(1);
  });
});
