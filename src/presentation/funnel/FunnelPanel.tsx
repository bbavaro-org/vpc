import type { FunnelGap, IntakeFunnel } from '../../application/funnel';
import { cardStyle } from '../shell/cardStyle';

function GapRow({ gap }: { gap: FunnelGap }) {
  if (gap.state === 'anomaly') {
    return (
      <div data-gap="anomaly" data-anomaly="true" data-largest="false">
        <span className="vpc-tag">Data anomaly</span>{' '}
        <span className="text-body" style={{ color: 'var(--ink-2)' }}>
          {`Later stage exceeds earlier by ${gap.excess}`}
        </span>
      </div>
    );
  }
  const pct = gap.dropOffPercent === null ? '' : ` (${gap.dropOffPercent}%)`;
  return (
    <div data-gap="drop" data-anomaly="false" data-largest={gap.largest}>
      <span className="text-body" style={{ color: 'var(--ink-2)' }}>{`Drop-off ${gap.dropOff}${pct}`}</span>
      {gap.largest ? (
        <>
          {' '}
          <span className="vpc-tag">Largest drop</span>
        </>
      ) : null}
    </div>
  );
}

export function FunnelPanel({ funnel }: { funnel: IntakeFunnel }) {
  const max = Math.max(...funnel.stages.map((s) => s.count), 1);
  return (
    <article style={cardStyle} data-panel="intake-funnel">
      <div className="vpc-eyebrow">Last 30 days</div>
      <ol
        style={{
          listStyle: 'none',
          margin: 'var(--space-2) 0 0',
          padding: 0,
          display: 'grid',
          gap: 'var(--space-3)',
        }}
      >
        {funnel.stages.map((s, i) => {
          const gap = i > 0 ? funnel.gaps[i - 1] : null;
          const largest = gap?.state === 'drop' && gap.largest;
          return (
            <li key={s.stage} data-stage={s.stage}>
              {gap ? <GapRow gap={gap} /> : null}
              <span className="text-body">{s.label}</span>{' '}
              <span className="text-body" style={{ color: 'var(--ink-2)' }}>
                {s.count}
              </span>
              <div
                style={{
                  background: 'var(--line)',
                  borderRadius: 'var(--radius-pill)',
                  height: 'var(--space-2)',
                  marginTop: 'var(--space-1)',
                }}
              >
                <div
                  style={{
                    width: `${(s.count / max) * 100}%`,
                    height: '100%',
                    borderRadius: 'var(--radius-pill)',
                    background: largest ? 'var(--ink)' : 'var(--lime)',
                  }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
