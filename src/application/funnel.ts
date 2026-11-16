import { REFERENCE_NOW, type DateRange, type InquiryRepository, type IntakeStage } from '../domain';
import { PERIOD_DAYS } from './headline';

const DAY_MS = 86_400_000;

export const FUNNEL_STAGES: ReadonlyArray<{ readonly stage: IntakeStage; readonly label: string }> = [
  { stage: 'inquiry', label: 'Inquiries' },
  { stage: 'intakeCompleted', label: 'Intake form completed' },
  { stage: 'matched', label: 'Matched to clinician' },
  { stage: 'booked', label: 'First session booked' },
];

export interface FunnelStage {
  readonly stage: IntakeStage;
  readonly label: string;
  readonly count: number;
}

export type FunnelGap =
  | {
      readonly state: 'drop';
      readonly dropOff: number;
      readonly dropOffPercent: number | null;
      readonly largest: boolean;
    }
  | { readonly state: 'anomaly'; readonly excess: number };

export interface IntakeFunnel {
  readonly total: number;
  readonly stages: readonly FunnelStage[];
  /** gaps[i] is the transition from stages[i] to stages[i + 1]. */
  readonly gaps: readonly FunnelGap[];
}

/** Pure: stage counts in FUNNEL_STAGES order to stages and per-gap drop-off. */
export function buildFunnel(counts: readonly number[], total: number = counts[0] ?? 0): IntakeFunnel {
  const stages = FUNNEL_STAGES.map((s, i): FunnelStage => ({ ...s, count: counts[i] ?? 0 }));
  const raw = stages.slice(1).map((s, i) => {
    const earlier = stages[i]?.count ?? 0;
    return { earlier, diff: earlier - s.count };
  });
  let largestIndex = -1;
  let largestDrop = -1;
  raw.forEach((g, i) => {
    if (g.diff >= 0 && g.diff > largestDrop) {
      largestDrop = g.diff;
      largestIndex = i;
    }
  });
  const gaps = raw.map(
    (g, i): FunnelGap =>
      g.diff < 0
        ? { state: 'anomaly', excess: -g.diff }
        : {
            state: 'drop',
            dropOff: g.diff,
            dropOffPercent: g.earlier === 0 ? null : Math.round((g.diff / g.earlier) * 100),
            largest: i === largestIndex,
          },
  );
  return { total, stages, gaps };
}

export async function getIntakeFunnel(
  repo: InquiryRepository,
  now: Date = REFERENCE_NOW,
): Promise<IntakeFunnel> {
  const range: DateRange = { from: new Date(now.getTime() - PERIOD_DAYS * DAY_MS), to: now };
  const agg = await repo.queryInquiries(range);
  return buildFunnel(
    FUNNEL_STAGES.map((s) => agg.byStage[s.stage]),
    agg.total,
  );
}
