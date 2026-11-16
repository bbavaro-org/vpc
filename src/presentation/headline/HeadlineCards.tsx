import type { ReactNode } from 'react';
import type {
  BandStatus,
  HeadlineMetric,
  HeadlineMetrics,
  UtilizationMetric,
} from '../../application/headline';

interface Unit {
  readonly suffix: string;
  readonly noun?: string;
}

const fmt = (n: number, unit: Unit) => (unit.noun ? `${n} ${unit.noun}` : `${n}${unit.suffix}`);

export function deltaText(metric: HeadlineMetric, unit: Unit): string {
  if (metric.current === null || metric.prior === null || metric.direction === null) {
    return 'No prior-period comparison';
  }
  if (metric.direction === 'flat') return `Unchanged from ${fmt(metric.prior, unit)}`;
  return `${metric.direction === 'up' ? 'Up' : 'Down'} from ${fmt(metric.prior, unit)}`;
}

const BAND_LABEL: Record<BandStatus, string> = {
  below: 'Below target',
  within: 'Within target',
  above: 'Above target',
};

const cardStyle = {
  background: 'var(--white)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card)',
  padding: 'var(--space-4)',
} as const;

function MetricCard({
  id,
  title,
  metric,
  unit,
  children,
}: {
  id: string;
  title: string;
  metric: HeadlineMetric;
  unit: Unit;
  children?: ReactNode;
}) {
  const noData = metric.current === null;
  return (
    <article style={cardStyle} data-metric={id} data-no-data={noData}>
      <div className="vpc-eyebrow">{title}</div>
      {noData ? (
        <p className="text-body" style={{ color: 'var(--ink-2)', margin: 'var(--space-2) 0 0' }}>
          No data for this period
        </p>
      ) : (
        <>
          <p className="text-heading-3" style={{ margin: 'var(--space-2) 0 0' }}>
            {fmt(metric.current as number, unit)}
          </p>
          <p className="text-body" style={{ color: 'var(--ink-2)', margin: 'var(--space-1) 0 0' }}>
            {deltaText(metric, unit)}
          </p>
          {children}
        </>
      )}
    </article>
  );
}

function BandIndicator({ metric }: { metric: UtilizationMetric }) {
  if (metric.bandStatus === null) return null;
  return (
    <p style={{ margin: 'var(--space-2) 0 0' }} data-band={metric.bandStatus}>
      <span className="vpc-tag">{BAND_LABEL[metric.bandStatus]}</span>{' '}
      <span className="text-body" style={{ color: 'var(--ink-2)' }}>
        {`Target ${metric.targetBand.min}–${metric.targetBand.max}%`}
      </span>
    </p>
  );
}

export function HeadlineCards({ metrics }: { metrics: HeadlineMetrics }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      <MetricCard id="new-inquiries" title="New inquiries" metric={metrics.newInquiries} unit={{ suffix: '' }} />
      <MetricCard
        id="inquiry-to-first-session"
        title="Inquiry to first session"
        metric={metrics.inquiryToFirstSessionDays}
        unit={{ suffix: '', noun: 'days' }}
      />
      <MetricCard
        id="clinician-utilization"
        title="Clinician utilization"
        metric={metrics.clinicianUtilizationPercent}
        unit={{ suffix: '%' }}
      >
        <BandIndicator metric={metrics.clinicianUtilizationPercent} />
      </MetricCard>
      <MetricCard id="no-show-rate" title="No-show rate" metric={metrics.noShowRatePercent} unit={{ suffix: '%' }} />
    </div>
  );
}
