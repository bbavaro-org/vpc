import type { LeadSourceShares } from '../../application/leadSources';
import { cardStyle } from '../shell/cardStyle';

const SEGMENT_COLOURS = [
  'var(--lime)',
  'var(--lime-mid)',
  'var(--lime-deep)',
  'var(--green-deep)',
  'var(--ink-2)',
] as const;

export function LeadSourcesPanel({ result }: { result: LeadSourceShares }) {
  if (result.state === 'empty') {
    return (
      <article style={cardStyle} data-panel="lead-sources">
        <div className="vpc-eyebrow">New clients by source, last 30 days</div>
        <p className="text-body" style={{ color: 'var(--ink-2)', margin: 'var(--space-2) 0 0' }}>
          No new clients in this period
        </p>
      </article>
    );
  }
  return (
    <article style={cardStyle} data-panel="lead-sources">
      <div className="vpc-eyebrow">New clients by source, last 30 days</div>
      <div
        style={{
          display: 'flex',
          overflow: 'hidden',
          height: 'var(--space-3)',
          marginTop: 'var(--space-2)',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--line)',
        }}
      >
        {result.shares.map((s, i) =>
          s.sharePercent > 0 ? (
            <div
              key={s.source}
              data-segment={s.source}
              style={{ width: `${s.sharePercent}%`, background: SEGMENT_COLOURS[i] }}
            />
          ) : null,
        )}
      </div>
      <ul
        style={{
          listStyle: 'none',
          margin: 'var(--space-3) 0 0',
          padding: 0,
          display: 'grid',
          gap: 'var(--space-2)',
        }}
      >
        {result.shares.map((s, i) => (
          <li key={s.source} data-source={s.source} className="text-body">
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: 'var(--space-3)',
                height: 'var(--space-3)',
                marginRight: 'var(--space-2)',
                borderRadius: 'var(--radius-pill)',
                background: SEGMENT_COLOURS[i],
              }}
            />
            {s.source} <span style={{ color: 'var(--ink-2)' }}>{`${s.sharePercent}%`}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
