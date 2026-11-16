import type { InquiryRepository } from '../../domain';
import { getLeadSourceShares } from '../../application/leadSources';
import { REFERENCE_NOW } from '../../domain/referenceNow';
import type { PanelViewModel } from '../shell/provider';
import { LeadSourcesPanel } from './LeadSourcesPanel';

/** Loader for the 'lead-sources' slot; no items means the slot shows its empty state. */
export function leadSourcesLoader(
  repo: InquiryRepository,
  now: Date = REFERENCE_NOW,
): () => Promise<PanelViewModel> {
  return async () => {
    const result = await getLeadSourceShares(repo, now);
    if (result.state === 'empty') return { items: [] };
    return {
      items: result.shares.map((s) => ({ label: s.source, value: `${s.sharePercent}%` })),
      render: () => <LeadSourcesPanel result={result} />,
    };
  };
}
