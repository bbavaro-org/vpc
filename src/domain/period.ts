import type { DateRange } from './aggregates';

export const DAY_MS = 86_400_000;
export const PERIOD_DAYS = 30;

/** The reporting period of PERIOD_DAYS days ending at `now`. */
export function lastPeriod(now: Date): DateRange {
  return { from: new Date(now.getTime() - PERIOD_DAYS * DAY_MS), to: now };
}
