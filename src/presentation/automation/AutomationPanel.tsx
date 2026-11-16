import type { ReactNode } from 'react';
import type { AutomationImpact } from '../../application/automation';
import { cardStyle } from '../shell/cardStyle';

function MeasureCard({
  id,
  title,
  value,
  status,
  children,
}: {
  id: string;
  title: string;
  value: string;
  status?: string;
  children?: ReactNode;
}) {
  return (
    <article style={cardStyle} data-measure={id} data-status={status}>
      <div className="vpc-eyebrow">{title}</div>
      <p className="text-heading-3" style={{ margin: 'var(--space-2) 0 0' }}>
        {value}
      </p>
      {children}
    </article>
  );
}

export function AutomationPanel({ impact }: { impact: AutomationImpact }) {
  const { syncErrors } = impact;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      <MeasureCard id="admin-hours-saved" title="Admin hours saved" value={`${impact.adminHoursSaved} hrs`} />
      <MeasureCard
        id="intake-forms-auto-filed"
        title="Intake forms auto-filed"
        value={String(impact.intakeFormsAutoFiled)}
      />
      <MeasureCard id="reminders-sent" title="Reminders sent" value={String(impact.remindersSent)} />
      <MeasureCard
        id="sync-errors"
        title="Sync errors"
        value={String(syncErrors.count)}
        status={syncErrors.status}
      >
        <p style={{ margin: 'var(--space-2) 0 0' }}>
          <span className="vpc-tag" style={{ color: 'var(--ink)' }}>
            {syncErrors.status === 'needs-attention' ? 'Needs attention' : 'Healthy'}
          </span>
        </p>
      </MeasureCard>
    </div>
  );
}
