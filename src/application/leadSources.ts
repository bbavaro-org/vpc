import { LEAD_SOURCES, REFERENCE_NOW, type InquiryRepository, type LeadSource } from '../domain';
import { PERIOD_DAYS } from './headline';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface LeadSourceShare {
  readonly source: LeadSource;
  readonly count: number;
  readonly sharePercent: number;
}

export type LeadSourceShares =
  | { readonly state: 'empty' }
  | { readonly state: 'ready'; readonly total: number; readonly shares: readonly LeadSourceShare[] };

export async function getLeadSourceShares(
  repo: InquiryRepository,
  now: Date = REFERENCE_NOW,
): Promise<LeadSourceShares> {
  const agg = await repo.queryInquiries({ from: new Date(now.getTime() - PERIOD_DAYS * DAY_MS), to: now });
  const counts = LEAD_SOURCES.map((source) => agg.newClientsBySource[source] ?? 0);
  const total = counts.reduce((a, b) => a + b, 0);
  if (total <= 0) return { state: 'empty' };

  // Largest-remainder: floor every share, then give the leftover points to the largest remainders.
  const exact = counts.map((c) => (c / total) * 100);
  const percents = exact.map(Math.floor);
  let leftover = 100 - percents.reduce((a, b) => a + b, 0);
  const byRemainder = exact
    .map((e, i) => ({ i, rem: e - Math.floor(e) }))
    .sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (const { i } of byRemainder) {
    if (leftover <= 0) break;
    percents[i] = (percents[i] ?? 0) + 1;
    leftover -= 1;
  }

  const shares = LEAD_SOURCES.map(
    (source, i): LeadSourceShare => ({
      source,
      count: counts[i] ?? 0,
      sharePercent: percents[i] ?? 0,
    }),
  );
  // Array.prototype.sort is stable, so ties stay in LEAD_SOURCES order.
  shares.sort((a, b) => b.sharePercent - a.sharePercent);
  return { state: 'ready', total, shares };
}
