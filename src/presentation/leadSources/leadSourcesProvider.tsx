import type { LeadSourceShares } from '../../application/leadSources';
import type { PanelFetcher } from '../panelApi';
import type { PanelViewModel } from '../shell/provider';
import { LeadSourcesPanel } from './LeadSourcesPanel';

/** Loader for the 'lead-sources' slot; no items means the slot shows its empty state. */
export function leadSourcesLoader(fetchPanel: PanelFetcher): () => Promise<PanelViewModel> {
  return async () => {
    const { items, data } = await fetchPanel<LeadSourceShares>('lead-sources');
    if (items.length === 0) return { items: [] };
    return { items, render: () => <LeadSourcesPanel result={data} /> };
  };
}
