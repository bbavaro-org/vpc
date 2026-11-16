import { useCallback, useSyncExternalStore } from 'react';
import { ROLE_LABELS } from '../../application/access';
import { AUDIT_VIEW_ID, type AuditEntry, type AuditLog } from '../../domain';
import { SLOT_TITLES } from '../shell/provider';

function panelTitle(panel: AuditEntry['panel']): string {
  return panel === AUDIT_VIEW_ID ? 'Audit log' : SLOT_TITLES[panel];
}

export function AuditView({ entries }: { readonly entries: readonly AuditEntry[] }) {
  const newestFirst = [...entries].reverse();
  const cell = {
    textAlign: 'left',
    padding: 'var(--space-2) var(--space-4)',
    borderBottom: '1px solid var(--line)',
  } as const;
  return (
    <section aria-labelledby="audit-view-title" data-testid="audit-view">
      <h2 id="audit-view-title" className="text-heading-3" style={{ color: 'var(--ink)' }}>
        Audit log
      </h2>
      <table className="text-body" style={{ color: 'var(--ink)', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th scope="col" className="vpc-eyebrow" style={cell}>Role</th>
            <th scope="col" className="vpc-eyebrow" style={cell}>Panel</th>
            <th scope="col" className="vpc-eyebrow" style={cell}>Time</th>
          </tr>
        </thead>
        <tbody>
          {newestFirst.map((e, i) => (
            <tr key={i} data-role={e.role} data-panel={e.panel}>
              <td style={cell}>{ROLE_LABELS[e.role]}</td>
              <td style={cell}>{panelTitle(e.panel)}</td>
              <td style={cell}>{e.timestamp.toLocaleString('en-CA')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function AuditViewContainer({ log }: { readonly log: AuditLog }) {
  const subscribe = useCallback((listener: () => void) => log.subscribe(listener), [log]);
  const list = useCallback(() => log.list(), [log]);
  const entries = useSyncExternalStore(subscribe, list, list);
  return <AuditView entries={entries} />;
}
