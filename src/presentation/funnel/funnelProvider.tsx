import type { InquiryRepository } from '../../domain';
import { getIntakeFunnel } from '../../application/funnel';
import { REFERENCE_NOW } from '../../domain/referenceNow';
import type { PanelViewModel } from '../shell/provider';
import { FunnelPanel } from './FunnelPanel';

/** Loader for the 'intake-funnel' slot; reads the use case's view model only. */
export function funnelLoader(
  repo: InquiryRepository,
  now: Date = REFERENCE_NOW,
): () => Promise<PanelViewModel> {
  return async () => {
    const funnel = await getIntakeFunnel(repo, now);
    if (funnel.total === 0) return { items: [] };
    return {
      items: funnel.stages.map((s) => ({ label: s.label, value: String(s.count) })),
      render: () => <FunnelPanel funnel={funnel} />,
    };
  };
}
